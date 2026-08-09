import { useEffect, useRef, useState } from "react";
import { updateWheelSelection, updateWheelSelectionLink } from "./config/bikeComponents.js";
import { persistBikeSetup, readPersistedBikeSetup } from "./config/setupPersistence.js";
import { createBikeFromGeometryImport, createComparisonBike, getPersistableBikeSetup, updateBikeSize } from "./state/dualBikeState.js";
import { addGeometryImportDraftSize, bikeToGeometryImportDraft, GEOMETRY_IMPORT_FIELDS, getSelectedImportSizes, getGeometryImportFieldError, getGeometryImportPreviewIssues, isGeometryImportPreviewSafe, isSupportedGeometryImage, scopeGeometryImportWarnings, toggleGeometryImportSize, updateGeometryImportDraftField, validateGeometryImportDraft } from "./state/geometryImportState.js";
import { addWorkspaceBike, deleteWorkspaceBike, MAX_BIKES, replaceWorkspaceBike } from "./state/workspaceBikes.js";
import { analyzeGeometryImage } from "./services/geometryImageAnalyzer.js";
import { FrameGeometryPanel } from "./components/panels/FrameGeometryPanel.jsx";
import { BikeSetupPanel } from "./components/panels/BikeSetupPanel.jsx";
import { BikeVisualizer } from "./components/visualizer/BikeVisualizer.jsx";
import { BikeManagementModal } from "./components/comparison/BikeManagementModal.jsx";
import Prism from "./components/visualizer/Prism.jsx";
import { WelcomeGate } from "./components/import/WelcomeGate.jsx";
import brandLogo from "./assets/brand/logo_bai.png";

const GEOMETRY_PREVIEW_COLOR = "#E5E7EB";

export function App() {
  const [initialSetup] = useState(() => readPersistedBikeSetup());
  const [demoBike] = useState(() => createComparisonBike("demo-preview", initialSetup));
  const [bikes, setBikes] = useState([]);
  const [activeBikeIndex, setActiveBikeIndex] = useState(null);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [isStageFullscreen, setIsStageFullscreen] = useState(false);
  const [geometryImportStatus, setGeometryImportStatus] = useState("ready");
  const [geometryImportImage, setGeometryImportImage] = useState(null);
  const [geometryImportDraft, setGeometryImportDraft] = useState(null);
  const [geometryImportErrors, setGeometryImportErrors] = useState({});
  const [geometryImportErrorMessage, setGeometryImportErrorMessage] = useState("");
  const [importOperation, setImportOperation] = useState(null);
  const [managementIndex, setManagementIndex] = useState(null);
  const [managementStage, setManagementStage] = useState("menu");
  const nextBikeNumber = useRef(1);
  const shouldPersistSetup = useRef(false);
  const analysisRequestId = useRef(0);

  const selectedBike = activeBikeIndex == null ? null : bikes[activeBikeIndex] ?? null;
  const workspaceBike = selectedBike ?? demoBike;
  const isGeometryImportActive = geometryImportStatus !== "ready";
  const importSelectedGeometry = geometryImportDraft?.sizes?.[geometryImportDraft.selectedSize];
  const geometryImportPreviewIssues = getGeometryImportPreviewIssues(importSelectedGeometry);
  const draftPreviewValid = isGeometryImportPreviewSafe(importSelectedGeometry);
  const importPreviewSourceBike = isGeometryImportActive && draftPreviewValid
    ? createBikeFromGeometryImport({ ...workspaceBike, id: "geometry-import-preview" }, geometryImportDraft, geometryImportImage)
    : null;
  const importPreviewBike = importPreviewSourceBike && {
    ...importPreviewSourceBike,
    frameColor: GEOMETRY_PREVIEW_COLOR,
    forkColor: GEOMETRY_PREVIEW_COLOR,
  };
  const showWelcomeGate = bikes.length === 0 && geometryImportStatus === "ready";

  useEffect(() => {
    if (!shouldPersistSetup.current || !bikes[0]) return;
    persistBikeSetup(getPersistableBikeSetup(bikes[0]));
  }, [bikes]);

  useEffect(() => {
    if (!isStageFullscreen) return undefined;
    const exitOnEscape = (event) => { if (event.key === "Escape") setIsStageFullscreen(false); };
    window.addEventListener("keydown", exitOnEscape);
    return () => window.removeEventListener("keydown", exitOnEscape);
  }, [isStageFullscreen]);

  const createBikeId = () => `workspace-bike-${nextBikeNumber.current++}`;
  const updateBikeAt = (index, update) => setBikes((current) => current.map((bike, bikeIndex) => (
    bikeIndex === index ? (typeof update === "function" ? update(bike) : update) : bike
  )));
  const updateSelectedBike = (update) => {
    if (activeBikeIndex == null) return;
    updateBikeAt(activeBikeIndex, update);
  };
  const markFirstBikeForPersistence = () => {
    if (activeBikeIndex === 0) shouldPersistSetup.current = true;
  };
  const setFrameSize = (size) => updateSelectedBike((current) => updateBikeSize(current, size));
  const updateFitSetup = (key, value) => {
    if (!selectedBike) return;
    markFirstBikeForPersistence();
    updateSelectedBike((current) => ({ ...current, fitSetup: { ...current.fitSetup, [key]: value } }));
  };
  const updateComponentSetup = (key, value) => {
    if (!selectedBike) return;
    markFirstBikeForPersistence();
    updateSelectedBike((current) => {
      if (key === "frameColor" || key === "forkColor") return { ...current, [key]: value };
      let nextComponentSetup;
      if (key === "frontWheelId") nextComponentSetup = updateWheelSelection(current.componentSetup, "front", value);
      else if (key === "rearWheelId") nextComponentSetup = updateWheelSelection(current.componentSetup, "rear", value);
      else if (key === "linkWheelSelection") nextComponentSetup = updateWheelSelectionLink(current.componentSetup, value);
      else nextComponentSetup = { ...current.componentSetup, [key]: value };
      return { ...current, componentSetup: nextComponentSetup };
    });
  };

  const clearImportFlow = () => {
    analysisRequestId.current += 1;
    setGeometryImportImage(null);
    setGeometryImportDraft(null);
    setGeometryImportErrors({});
    setGeometryImportErrorMessage("");
    setGeometryImportStatus("ready");
    setImportOperation(null);
  };
  const startGeometryEdit = () => {
    if (!selectedBike || selectedBike.source !== "upload") return;
    setImportOperation({ type: "edit", targetIndex: activeBikeIndex });
    setGeometryImportImage(selectedBike.geometryImage ?? null);
    setGeometryImportDraft(bikeToGeometryImportDraft(selectedBike));
    setGeometryImportErrors({});
    setGeometryImportErrorMessage("");
    setGeometryImportStatus("review");
  };
  const analyzeGeometryImageRecord = async (image, operation) => {
    const requestId = ++analysisRequestId.current;
    setGeometryImportStatus("analyzing");
    setGeometryImportErrorMessage("");
    try {
      const analyzedDraft = await analyzeGeometryImage(image.file);
      if (requestId !== analysisRequestId.current) return;
      const targetBike = operation?.type === "edit" ? bikes[operation.targetIndex] : null;
      setGeometryImportDraft(targetBike ? {
        ...analyzedDraft,
        brand: targetBike.brand,
        model: targetBike.model,
      } : {
        ...analyzedDraft,
        model: analyzedDraft.model?.trim() || "未命名车型",
      });
      setGeometryImportErrors({});
      setGeometryImportStatus("review");
    } catch (error) {
      if (requestId !== analysisRequestId.current) return;
      setGeometryImportErrorMessage(error instanceof Error ? error.message : "图片分析失败，请重试。");
      setGeometryImportStatus("error");
    }
  };
  const selectGeometryImage = (file, operation = importOperation) => {
    if (!isSupportedGeometryImage(file)) {
      setGeometryImportErrorMessage("仅支持 PNG、JPG 或 JPEG 图片。请重新选择文件。");
      setGeometryImportStatus("error");
      return false;
    }
    const image = { file, fileName: file.name, previewUrl: URL.createObjectURL(file) };
    setGeometryImportDraft(null);
    setGeometryImportErrors({});
    setGeometryImportErrorMessage("");
    setGeometryImportImage(image);
    analyzeGeometryImageRecord(image, operation);
    return true;
  };
  const updateGeometryImportMeta = (key, value) => {
    setGeometryImportDraft((current) => ({ ...current, [key]: value }));
    setGeometryImportErrors((current) => {
      if (!current[key] || (key === "brand" && !value.trim())) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };
  const selectGeometryImportSize = (size) => setGeometryImportDraft((current) => ({ ...current, selectedSize: String(size) }));
  const toggleGeometryImportCandidateSize = (size) => {
    setGeometryImportDraft((current) => toggleGeometryImportSize(current, size));
    setGeometryImportErrors((current) => {
      const prefix = `sizes.${String(size)}.`;
      return Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(prefix)));
    });
  };
  const addGeometryImportSize = (size) => {
    setGeometryImportDraft((current) => addGeometryImportDraftSize(current, size));
    setGeometryImportErrors((current) => ({ ...current, sizes: undefined }));
  };
  const updateGeometryImportField = (key, value) => {
    if (!geometryImportDraft) return;
    const size = geometryImportDraft.selectedSize;
    setGeometryImportDraft((current) => {
      const updatedDraft = updateGeometryImportDraftField(current, size, key, value);
      const next = {
        ...updatedDraft,
        candidateSizes: {
          ...(updatedDraft.candidateSizes ?? {}),
          [size]: { ...updatedDraft.sizes[size] },
        },
      };
      const field = GEOMETRY_IMPORT_FIELDS.find((candidate) => candidate.key === key);
      const fieldError = getGeometryImportFieldError(field, value === "" ? null : Number(value));
      if (fieldError || !Array.isArray(current.parserWarnings)) return next;
      const fieldIsComplete = getSelectedImportSizes(next).every((selectedSize) => next.sizes[selectedSize]?.[key] != null);
      const allParserWarnings = (current.allParserWarnings ?? current.parserWarnings ?? []).filter((warning) => {
        if (warning.field !== key) return true;
        if (warning.size === size && ["CELL_UNRECOGNIZED", "GEOMETRY_VALUE_OUT_OF_RANGE"].includes(warning.code)) return false;
        if (fieldIsComplete && ["COLUMN_COUNT_MISMATCH", "REPORTED_COLUMN_COUNT_MISMATCH"].includes(warning.code)) return false;
        return true;
      });
      const parserWarnings = scopeGeometryImportWarnings(allParserWarnings, getSelectedImportSizes(next));
      return {
        ...next,
        allParserWarnings,
        parserWarnings,
        parserConfirmationCount: parserWarnings.filter((warning) => ["CELL_UNRECOGNIZED", "SIZE_COLUMN_MISSING", "GEOMETRY_VALUE_OUT_OF_RANGE"].includes(warning.code)).length,
      };
    });
    setGeometryImportErrors((current) => {
      const errorKey = `sizes.${size}.${key}`;
      if (!current[errorKey]) return current;
      const field = GEOMETRY_IMPORT_FIELDS.find((candidate) => candidate.key === key);
      const error = getGeometryImportFieldError(field, value === "" ? null : Number(value));
      if (error) return { ...current, [errorKey]: error };
      const next = { ...current };
      delete next[errorKey];
      return next;
    });
  };
  const confirmGeometryImport = () => {
    const validation = validateGeometryImportDraft(geometryImportDraft);
    if (!validation.isValid) {
      setGeometryImportErrors(validation.errors);
      if (validation.firstInvalidSize) selectGeometryImportSize(validation.firstInvalidSize);
      return validation;
    }
    const operation = importOperation ?? { type: "add", targetIndex: null };
    if (operation.type === "add") {
      if (bikes.length >= MAX_BIKES) return;
      const base = createComparisonBike(createBikeId(), getPersistableBikeSetup(selectedBike ?? demoBike));
      const importedBike = createBikeFromGeometryImport(base, geometryImportDraft, geometryImportImage);
      const nextIndex = bikes.length;
      setBikes((current) => addWorkspaceBike(current, importedBike));
      setActiveBikeIndex(nextIndex);
      setCompareEnabled(false);
    } else {
      const currentBike = bikes[operation.targetIndex];
      if (!currentBike) return;
      const importedBike = createBikeFromGeometryImport(currentBike, geometryImportDraft, geometryImportImage ?? currentBike.geometryImage);
      setBikes((current) => replaceWorkspaceBike(current, operation.targetIndex, importedBike));
      setActiveBikeIndex(operation.targetIndex);
    }
    clearImportFlow();
    return validation;
  };
  const useWelcomePreset = () => {
    const bike = createComparisonBike(createBikeId(), initialSetup);
    setBikes([bike]);
    setActiveBikeIndex(0);
    setCompareEnabled(false);
  };
  const selectWelcomeImage = (file) => {
    const operation = { type: "add", targetIndex: null };
    setImportOperation(operation);
    selectGeometryImage(file, operation);
  };
  const openBikeManagement = (index) => {
    setManagementIndex(index);
    setManagementStage("menu");
  };
  const closeBikeManagement = () => {
    setManagementIndex(null);
    setManagementStage("menu");
  };
  const replaceManagedBike = (file) => {
    const targetIndex = managementIndex;
    closeBikeManagement();
    if (targetIndex == null) return;
    const operation = { type: "replace", targetIndex };
    setImportOperation(operation);
    selectGeometryImage(file, operation);
  };
  const addComparisonBikeFromImage = (file) => {
    if (bikes.length >= MAX_BIKES) return;
    const operation = { type: "add", targetIndex: null };
    setImportOperation(operation);
    selectGeometryImage(file, operation);
  };
  const deleteManagedBike = () => {
    if (managementIndex == null) return;
    const removedBike = bikes[managementIndex];
    if (removedBike?.geometryImage?.previewUrl) URL.revokeObjectURL(removedBike.geometryImage.previewUrl);
    const nextBikes = deleteWorkspaceBike(bikes, managementIndex);
    setBikes(nextBikes);
    setActiveBikeIndex(nextBikes.length ? 0 : null);
    setCompareEnabled(false);
    clearImportFlow();
    closeBikeManagement();
  };

  return (
    <div className={`app-shell${showWelcomeGate ? " app-shell--welcome" : ""}`}>
      <header className="site-header"><img className="site-header__logo" src={brandLogo} alt="Bike Geometry Lab" /></header>
      <main className={`workspace${isStageFullscreen ? " workspace--stage-fullscreen" : ""}${isGeometryImportActive ? " workspace--geometry-import" : ""}`} id="top" inert={showWelcomeGate ? true : undefined}>
        <div className="workspace-prism-background" aria-hidden="true"><Prism animationType="rotate" timeScale={0.3} height={6.4} baseWidth={5.7} scale={2.4} hueShift={0} colorFrequency={1} noise={0} glow={0.7} transparent /></div>
        <FrameGeometryPanel
          bike={workspaceBike}
          setFrameSize={setFrameSize}
          updateComponentSetup={updateComponentSetup}
          geometryImport={{
            status: geometryImportStatus,
            mode: importOperation?.type ?? "add",
            image: geometryImportImage,
            draft: geometryImportDraft,
            errors: geometryImportErrors,
            errorMessage: geometryImportErrorMessage,
            onSelectImage: selectGeometryImage,
            onDraftMetaChange: updateGeometryImportMeta,
            onSelectSize: selectGeometryImportSize,
            onToggleImportSize: toggleGeometryImportCandidateSize,
            onAddSize: addGeometryImportSize,
            onGeometryFieldChange: updateGeometryImportField,
            onConfirm: confirmGeometryImport,
            onReanalyze: () => geometryImportImage && analyzeGeometryImageRecord(geometryImportImage, importOperation),
            onCancel: clearImportFlow,
            onEdit: startGeometryEdit,
          }}
          isStageFullscreen={isStageFullscreen}
        />
        <div className="main-stage">
          <BikeVisualizer
            bikes={bikes}
            demoBike={demoBike}
            activeBikeIndex={isGeometryImportActive ? null : activeBikeIndex}
            stagePreviewBike={isGeometryImportActive ? importPreviewBike : null}
            frameOnly={isGeometryImportActive}
            geometryImportMode={isGeometryImportActive}
            geometryImportPreviewReady={draftPreviewValid}
            geometryImportPreviewIssues={geometryImportPreviewIssues}
            compareEnabled={compareEnabled}
            onActiveBikeChange={setActiveBikeIndex}
            onCompareEnabledChange={setCompareEnabled}
            onAddBike={addComparisonBikeFromImage}
            onManageBike={openBikeManagement}
            isStageFullscreen={isStageFullscreen}
            onToggleStageFullscreen={() => setIsStageFullscreen((current) => !current)}
          />
        </div>
        <BikeSetupPanel fitSetup={workspaceBike.fitSetup} updateFitSetup={updateFitSetup} componentSetup={workspaceBike.componentSetup} updateComponentSetup={updateComponentSetup} isStageFullscreen={isStageFullscreen || isGeometryImportActive} />
      </main>
      {showWelcomeGate && <WelcomeGate onUsePreset={useWelcomePreset} onSelectImage={selectWelcomeImage} />}
      <BikeManagementModal
        bike={managementIndex == null ? null : bikes[managementIndex]}
        stage={managementStage}
        onClose={closeBikeManagement}
        onReplace={replaceManagedBike}
        onRequestDelete={() => setManagementStage("delete")}
        onConfirmDelete={deleteManagedBike}
      />
    </div>
  );
}

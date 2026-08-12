import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { updateWheelSelection, updateWheelSelectionLink } from "./config/bikeComponents.js";
import { persistBikeSetup, readPersistedBikeSetup } from "./config/setupPersistence.js";
import { createBikeFromGeometryImport, createComparisonBike, createPresetExperiencePack, getPersistableBikeSetup, instantiatePresetExperienceBike, updateBikeSeatStayStyle, updateBikeSize } from "./state/dualBikeState.js";
import { addGeometryImportDraftSize, bikeToGeometryImportDraft, copyGeometryImportDraftSize, createManualGeometryImportDraft, GEOMETRY_IMPORT_FIELDS, getSelectedImportSizes, getGeometryImportFieldError, getGeometryImportPreviewIssues, isGeometryImportPreviewSafe, isSupportedGeometryImage, renameGeometryImportDraftSize, scopeGeometryImportWarnings, toggleGeometryImportSize, updateGeometryImportDraftField, validateGeometryImportDraft } from "./state/geometryImportState.js";
import { addWorkspaceBike, deleteWorkspaceBike, MAX_BIKES, replaceWorkspaceBike } from "./state/workspaceBikes.js";
import { DeveloperAboutModal, LandingPage } from "./components/landing/LandingPage.jsx";
import brandLogo from "./assets/brand/logo_bai.png";
import { DEFAULT_PRESET_BIKE_ID, PRESET_EXPERIENCE_IDS } from "./data/presetExperience.js";
import { hasUnfinishedGeometryTask, WORKSPACE_ENTRY_MODE } from "./state/workspaceEntryMode.js";
import { createLabPageUrl, createLandingPageUrl, shouldShowLandingPage } from "./state/landingPageState.js";

const GEOMETRY_PREVIEW_COLOR = "#E5E7EB";
const lazyNamed = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));
const FrameGeometryPanel = lazyNamed(() => import("./components/panels/FrameGeometryPanel.jsx"), "FrameGeometryPanel");
const BikeSetupPanel = lazyNamed(() => import("./components/panels/BikeSetupPanel.jsx"), "BikeSetupPanel");
const BikeVisualizer = lazyNamed(() => import("./components/visualizer/BikeVisualizer.jsx"), "BikeVisualizer");
const BikeManagementModal = lazyNamed(() => import("./components/comparison/BikeManagementModal.jsx"), "BikeManagementModal");
const Prism = lazy(() => import("./components/visualizer/Prism.jsx"));
const WelcomeGate = lazyNamed(() => import("./components/import/WelcomeGate.jsx"), "WelcomeGate");
const PresetComparisonConfirmModal = lazyNamed(() => import("./components/preset/PresetComparisonConfirmModal.jsx"), "PresetComparisonConfirmModal");
const WorkspaceModeNavigation = lazyNamed(() => import("./components/navigation/WorkspaceModeNavigation.jsx"), "WorkspaceModeNavigation");
const WorkspaceModeConfirmModal = lazyNamed(() => import("./components/navigation/WorkspaceModeConfirmModal.jsx"), "WorkspaceModeConfirmModal");

function LabLoadingFallback() {
  return <div className="app-shell app-shell--lab-loading" aria-live="polite" aria-label="正在进入几何实验室" />;
}

export function App() {
  const [initialSetup] = useState(() => readPersistedBikeSetup());
  const [presetExperienceBikes, setPresetExperienceBikes] = useState(() => createPresetExperiencePack(initialSetup));
  const [showLandingPage, setShowLandingPage] = useState(() => shouldShowLandingPage());
  const [landingTransition, setLandingTransition] = useState(null);
  const [isDeveloperAboutOpen, setIsDeveloperAboutOpen] = useState(false);
  const [activePresetBikeId, setActivePresetBikeId] = useState(DEFAULT_PRESET_BIKE_ID);
  const [isPresetExperienceMode, setIsPresetExperienceMode] = useState(false);
  const [hasEnteredWorkspace, setHasEnteredWorkspace] = useState(false);
  const [workspaceEntryMode, setWorkspaceEntryMode] = useState(WORKSPACE_ENTRY_MODE.PRESET);
  const [workspaceTaskMode, setWorkspaceTaskMode] = useState(null);
  const [pendingWorkspaceMode, setPendingWorkspaceMode] = useState(null);
  const [pendingPresetComparisonId, setPendingPresetComparisonId] = useState(null);
  const [bikes, setBikes] = useState([]);
  const [activeBikeIndex, setActiveBikeIndex] = useState(null);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [isStageFullscreen, setIsStageFullscreen] = useState(false);
  const [geometryImportStatus, setGeometryImportStatus] = useState("ready");
  const [geometryImportImage, setGeometryImportImage] = useState(null);
  const [geometryImportDraft, setGeometryImportDraft] = useState(null);
  const [geometryImportErrors, setGeometryImportErrors] = useState({});
  const [geometryImportErrorMessage, setGeometryImportErrorMessage] = useState("");
  const [geometryImportErrorCode, setGeometryImportErrorCode] = useState(null);
  const [importOperation, setImportOperation] = useState(null);
  const [managementIndex, setManagementIndex] = useState(null);
  const [managementStage, setManagementStage] = useState("menu");
  const nextBikeNumber = useRef(1);
  const shouldPersistSetup = useRef(false);
  const analysisRequestId = useRef(0);
  const developerAboutTriggerRef = useRef(null);

  const selectedBike = activeBikeIndex == null ? null : bikes[activeBikeIndex] ?? null;
  const activePresetBike = presetExperienceBikes[activePresetBikeId];
  const pendingPresetComparisonBike = pendingPresetComparisonId == null
    ? null
    : presetExperienceBikes[pendingPresetComparisonId] ?? null;
  const orderedPresetExperienceBikes = PRESET_EXPERIENCE_IDS.map((id) => presetExperienceBikes[id]);
  const workspaceBike = isPresetExperienceMode ? activePresetBike : selectedBike ?? activePresetBike;
  const isGeometryImportActive = geometryImportStatus !== "ready";
  const isWorkspaceEntryTaskActive = workspaceTaskMode != null;
  const isGeometryWorkspaceActive = isGeometryImportActive || isWorkspaceEntryTaskActive;
  const importSelectedGeometry = geometryImportDraft?.sizes?.[geometryImportDraft.selectedSize];
  const geometryImportPreviewIssues = getGeometryImportPreviewIssues(importSelectedGeometry);
  const draftPreviewValid = Boolean(geometryImportDraft?.category)
    && isGeometryImportPreviewSafe(importSelectedGeometry);
  const importPreviewSourceBike = isGeometryImportActive && draftPreviewValid
    ? createBikeFromGeometryImport({ ...workspaceBike, id: "geometry-import-preview" }, geometryImportDraft, geometryImportImage)
    : null;
  const importPreviewBike = importPreviewSourceBike && {
    ...importPreviewSourceBike,
    frameColor: GEOMETRY_PREVIEW_COLOR,
    forkColor: GEOMETRY_PREVIEW_COLOR,
  };
  const showWelcomeGate = !hasEnteredWorkspace && bikes.length === 0 && geometryImportStatus === "ready";
  const showWorkspaceModeNavigation = hasEnteredWorkspace && !isStageFullscreen;

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

  useEffect(() => {
    const syncPageFromLocation = () => {
      setShowLandingPage(shouldShowLandingPage());
      setLandingTransition(null);
    };
    window.addEventListener("popstate", syncPageFromLocation);
    return () => window.removeEventListener("popstate", syncPageFromLocation);
  }, []);

  const createBikeId = () => `workspace-bike-${nextBikeNumber.current++}`;
  const updateBikeAt = (index, update) => setBikes((current) => current.map((bike, bikeIndex) => (
    bikeIndex === index ? (typeof update === "function" ? update(bike) : update) : bike
  )));
  const updateSelectedBike = (update) => {
    if (isPresetExperienceMode) {
      setPresetExperienceBikes((current) => {
        const activeBike = current[activePresetBikeId];
        const nextBike = typeof update === "function" ? update(activeBike) : update;
        return { ...current, [activePresetBikeId]: nextBike };
      });
      return;
    }
    if (activeBikeIndex != null) {
      updateBikeAt(activeBikeIndex, update);
      return;
    }
  };
  const markFirstBikeForPersistence = () => {
    if (activeBikeIndex === 0) shouldPersistSetup.current = true;
  };
  const setFrameSize = (size) => updateSelectedBike((current) => updateBikeSize(current, size));
  const setSeatStayStyle = (style) => updateSelectedBike((current) => updateBikeSeatStayStyle(current, style));
  const updateFitSetup = (key, value) => {
    if (!selectedBike && !isPresetExperienceMode) return;
    markFirstBikeForPersistence();
    updateSelectedBike((current) => ({ ...current, fitSetup: { ...current.fitSetup, [key]: value } }));
  };
  const updateComponentSetup = (key, value) => {
    if (!selectedBike && !isPresetExperienceMode) return;
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
    setGeometryImportErrorCode(null);
    setGeometryImportStatus("ready");
    setImportOperation(null);
  };
  const startGeometryEdit = () => {
    if (!selectedBike || selectedBike.source !== "upload") return;
    setWorkspaceEntryMode(WORKSPACE_ENTRY_MODE.UPLOAD);
    setWorkspaceTaskMode(WORKSPACE_ENTRY_MODE.UPLOAD);
    setImportOperation({ type: "edit", targetIndex: activeBikeIndex });
    setGeometryImportImage(selectedBike.geometryImage ?? null);
    setGeometryImportDraft(bikeToGeometryImportDraft(selectedBike));
    setGeometryImportErrors({});
    setGeometryImportErrorMessage("");
    setGeometryImportErrorCode(null);
    setGeometryImportStatus("review");
  };
  const analyzeGeometryImageRecord = async (image, operation) => {
    const requestId = ++analysisRequestId.current;
    setGeometryImportStatus("analyzing");
    setGeometryImportErrorMessage("");
    setGeometryImportErrorCode(null);
    try {
      const { analyzeGeometryImage } = await import("./services/geometryImageAnalyzer.js");
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
      setGeometryImportErrorCode(error?.code ?? "GEOMETRY_PARSER_REQUEST_FAILED");
      setGeometryImportStatus("error");
    }
  };
  const selectGeometryImage = (file, operation = importOperation) => {
    if (!isSupportedGeometryImage(file)) {
      setGeometryImportErrorMessage("仅支持 PNG、JPG 或 JPEG 图片。请重新选择文件。");
      setGeometryImportErrorCode("IMAGE_TYPE_UNSUPPORTED");
      setGeometryImportStatus("error");
      return false;
    }
    const image = { file, fileName: file.name, previewUrl: URL.createObjectURL(file) };
    setGeometryImportDraft(null);
    setGeometryImportErrors({});
    setGeometryImportErrorMessage("");
    setGeometryImportErrorCode(null);
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
  const copyGeometryImportSize = (size) => {
    setGeometryImportDraft((current) => copyGeometryImportDraftSize(current, size));
    setGeometryImportErrors((current) => ({ ...current, sizes: undefined }));
  };
  const renameManualGeometryImportSize = (size) => {
    setGeometryImportDraft((current) => renameGeometryImportDraftSize(current, size));
    setGeometryImportErrors((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => key !== "sizes" && !key.startsWith("sizes.")),
    ));
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
    if (operation.type === "add" || operation.type === "manual") {
      if (bikes.length >= MAX_BIKES) return;
      const base = createComparisonBike(createBikeId(), getPersistableBikeSetup(workspaceBike));
      const importedBike = createBikeFromGeometryImport(base, geometryImportDraft, geometryImportImage);
      const nextIndex = bikes.length;
      setBikes((current) => addWorkspaceBike(current, importedBike));
      setActiveBikeIndex(nextIndex);
      setCompareEnabled(false);
      setIsPresetExperienceMode(false);
    } else {
      const currentBike = bikes[operation.targetIndex];
      if (!currentBike) return;
      const importedBike = createBikeFromGeometryImport(currentBike, geometryImportDraft, geometryImportImage ?? currentBike.geometryImage);
      setBikes((current) => replaceWorkspaceBike(current, operation.targetIndex, importedBike));
      setActiveBikeIndex(operation.targetIndex);
    }
    setWorkspaceTaskMode(null);
    clearImportFlow();
    return validation;
  };
  const startPresetExperience = () => {
    setHasEnteredWorkspace(true);
    setWorkspaceEntryMode(WORKSPACE_ENTRY_MODE.PRESET);
    setWorkspaceTaskMode(null);
    setActivePresetBikeId(DEFAULT_PRESET_BIKE_ID);
    setIsPresetExperienceMode(true);
    setCompareEnabled(false);
  };
  const requestPresetComparison = () => {
    setPendingPresetComparisonId(activePresetBikeId);
  };
  const cancelPresetComparison = () => {
    setPendingPresetComparisonId(null);
  };
  const confirmPresetComparison = () => {
    const bike = instantiatePresetExperienceBike(pendingPresetComparisonBike, createBikeId());
    if (!bike) return;
    shouldPersistSetup.current = true;
    setPendingPresetComparisonId(null);
    setBikes([bike]);
    setActiveBikeIndex(0);
    setCompareEnabled(false);
    setIsPresetExperienceMode(false);
    setWorkspaceTaskMode(null);
  };
  const selectWelcomeImage = (file) => {
    setHasEnteredWorkspace(true);
    setWorkspaceEntryMode(WORKSPACE_ENTRY_MODE.UPLOAD);
    setWorkspaceTaskMode(WORKSPACE_ENTRY_MODE.UPLOAD);
    setIsPresetExperienceMode(false);
    const operation = { type: "add", targetIndex: null };
    setImportOperation(operation);
    selectGeometryImage(file, operation);
  };
  const startManualGeometryImport = () => {
    setHasEnteredWorkspace(true);
    setWorkspaceEntryMode(WORKSPACE_ENTRY_MODE.MANUAL);
    setWorkspaceTaskMode(WORKSPACE_ENTRY_MODE.MANUAL);
    setIsPresetExperienceMode(false);
    const shouldReplace = bikes.length >= MAX_BIKES;
    setImportOperation(shouldReplace
      ? { type: "replace", targetIndex: activeBikeIndex ?? 0 }
      : { type: "manual", targetIndex: null });
    setGeometryImportImage(null);
    setGeometryImportDraft(createManualGeometryImportDraft());
    setGeometryImportErrors({});
    setGeometryImportErrorMessage("");
    setGeometryImportErrorCode(null);
    setGeometryImportStatus("review");
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
    setWorkspaceEntryMode(WORKSPACE_ENTRY_MODE.UPLOAD);
    setWorkspaceTaskMode(WORKSPACE_ENTRY_MODE.UPLOAD);
    setImportOperation(operation);
    selectGeometryImage(file, operation);
  };
  const addComparisonBikeFromImage = (file) => {
    if (bikes.length >= MAX_BIKES) return;
    const operation = { type: "add", targetIndex: null };
    setWorkspaceEntryMode(WORKSPACE_ENTRY_MODE.UPLOAD);
    setWorkspaceTaskMode(WORKSPACE_ENTRY_MODE.UPLOAD);
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
    if (!nextBikes.length) {
      setIsPresetExperienceMode(false);
      setHasEnteredWorkspace(false);
      setWorkspaceEntryMode(WORKSPACE_ENTRY_MODE.PRESET);
      setWorkspaceTaskMode(null);
    }
    setCompareEnabled(false);
    clearImportFlow();
    closeBikeManagement();
  };

  const beginUploadWorkspaceTask = () => {
    clearImportFlow();
    setWorkspaceEntryMode(WORKSPACE_ENTRY_MODE.UPLOAD);
    setWorkspaceTaskMode(WORKSPACE_ENTRY_MODE.UPLOAD);
    setIsPresetExperienceMode(false);
    const shouldReplace = bikes.length >= MAX_BIKES;
    setImportOperation(shouldReplace
      ? { type: "replace", targetIndex: activeBikeIndex ?? 0 }
      : { type: "add", targetIndex: null });
  };
  const performWorkspaceModeChange = (nextMode) => {
    window.history.replaceState({ view: "lab", mode: nextMode }, "", createLabPageUrl(nextMode));
    if (nextMode === WORKSPACE_ENTRY_MODE.PRESET) {
      clearImportFlow();
      startPresetExperience();
      return;
    }
    if (nextMode === WORKSPACE_ENTRY_MODE.UPLOAD) {
      beginUploadWorkspaceTask();
      return;
    }
    clearImportFlow();
    startManualGeometryImport();
  };
  const requestWorkspaceModeChange = (nextMode) => {
    const modeIsAlreadyOpen = nextMode === WORKSPACE_ENTRY_MODE.PRESET
      ? isPresetExperienceMode
      : workspaceTaskMode === nextMode;
    if (modeIsAlreadyOpen) return;
    if (hasUnfinishedGeometryTask(geometryImportStatus)) {
      setPendingWorkspaceMode(nextMode);
      return;
    }
    performWorkspaceModeChange(nextMode);
  };
  const cancelWorkspaceModeChange = () => setPendingWorkspaceMode(null);
  const confirmWorkspaceModeChange = () => {
    const nextMode = pendingWorkspaceMode;
    setPendingWorkspaceMode(null);
    if (nextMode) performWorkspaceModeChange(nextMode);
  };

  const completeLandingTransition = useCallback((transition) => {
    if (transition === "exit") {
      window.history.pushState({ view: "lab" }, "", createLabPageUrl());
      setShowLandingPage(false);
    }
    if (transition === "enter") {
      window.history.pushState({ view: "landing" }, "", createLandingPageUrl());
    }
    setLandingTransition(null);
  }, []);

  const enterLab = () => {
    if (landingTransition) return;
    setLandingTransition("exit");
  };

  const openLandingPage = () => {
    if (showLandingPage) return;
    setShowLandingPage(true);
    setLandingTransition("enter");
  };

  return (
    <>
      {(!showLandingPage || landingTransition === "exit") && (
      <Suspense fallback={<LabLoadingFallback />}>
    <div className={`app-shell${showWelcomeGate ? " app-shell--welcome" : ""}`}>
      <header className="site-header" inert={pendingWorkspaceMode ? true : undefined}>
        <div className="site-header__brand-row">
          <button className="site-header__brand-button" type="button" onClick={openLandingPage} aria-label="返回首页">
            <img className="site-header__logo" src={brandLogo} alt="Bike Geometry Lab" />
          </button>
          {showWorkspaceModeNavigation && (
            <WorkspaceModeNavigation value={workspaceEntryMode} onChange={requestWorkspaceModeChange} />
          )}
          <button
            ref={developerAboutTriggerRef}
            className="site-header__copyright"
            type="button"
            onClick={() => setIsDeveloperAboutOpen(true)}
          >
            ©Design By Sardine
          </button>
        </div>
      </header>
      <main className={`workspace${isStageFullscreen ? " workspace--stage-fullscreen" : ""}${isGeometryWorkspaceActive ? " workspace--geometry-import" : ""}`} id="top" inert={showWelcomeGate || pendingPresetComparisonBike || pendingWorkspaceMode ? true : undefined}>
        <div className="workspace-prism-background" aria-hidden="true"><Prism animationType="rotate" timeScale={0.3} height={6.4} baseWidth={5.7} scale={2.4} hueShift={0} colorFrequency={1} noise={0} glow={0.7} transparent /></div>
        <FrameGeometryPanel
          bike={workspaceBike}
          setFrameSize={setFrameSize}
          setSeatStayStyle={setSeatStayStyle}
          updateComponentSetup={updateComponentSetup}
          geometryImport={{
            status: geometryImportStatus,
            mode: importOperation?.type ?? "add",
            image: geometryImportImage,
            draft: geometryImportDraft,
            errors: geometryImportErrors,
            errorMessage: geometryImportErrorMessage,
            errorCode: geometryImportErrorCode,
            onSelectImage: selectGeometryImage,
            onDraftMetaChange: updateGeometryImportMeta,
            onSelectSize: selectGeometryImportSize,
            onToggleImportSize: toggleGeometryImportCandidateSize,
            onAddSize: addGeometryImportSize,
            onCopySize: copyGeometryImportSize,
            onManualSizeChange: renameManualGeometryImportSize,
            onGeometryFieldChange: updateGeometryImportField,
            onConfirm: confirmGeometryImport,
            onReanalyze: () => geometryImportImage && analyzeGeometryImageRecord(geometryImportImage, importOperation),
            onCancel: clearImportFlow,
            onEdit: startGeometryEdit,
            onStartManual: startManualGeometryImport,
          }}
          workspaceTaskMode={workspaceTaskMode}
          isStageFullscreen={isStageFullscreen}
        />
        <div className="main-stage">
          <BikeVisualizer
            bikes={bikes}
            demoBike={activePresetBike}
            presetExperienceMode={isPresetExperienceMode}
            presetExperienceBikes={orderedPresetExperienceBikes}
            activePresetBikeId={activePresetBikeId}
            activeBikeIndex={isGeometryWorkspaceActive ? null : activeBikeIndex}
            stagePreviewBike={isGeometryImportActive ? importPreviewBike : null}
            frameOnly={isGeometryWorkspaceActive}
            geometryImportMode={isGeometryWorkspaceActive}
            geometryImportPreviewReady={draftPreviewValid}
            geometryImportPreviewIssues={geometryImportPreviewIssues}
            compareEnabled={compareEnabled}
            onActiveBikeChange={setActiveBikeIndex}
            onCompareEnabledChange={setCompareEnabled}
            onAddBike={addComparisonBikeFromImage}
            onManageBike={openBikeManagement}
            onPresetBikeChange={setActivePresetBikeId}
            onRequestPresetComparison={requestPresetComparison}
            isStageFullscreen={isStageFullscreen}
            onToggleStageFullscreen={() => setIsStageFullscreen((current) => !current)}
          />
        </div>
        <BikeSetupPanel fitSetup={workspaceBike.fitSetup} updateFitSetup={updateFitSetup} componentSetup={workspaceBike.componentSetup} updateComponentSetup={updateComponentSetup} isStageFullscreen={isStageFullscreen || isGeometryWorkspaceActive} />
      </main>
      {showWelcomeGate && <WelcomeGate onStartPresetExperience={startPresetExperience} onSelectImage={selectWelcomeImage} onManualEntry={startManualGeometryImport} />}
      <PresetComparisonConfirmModal
        bike={pendingPresetComparisonBike}
        onCancel={cancelPresetComparison}
        onConfirm={confirmPresetComparison}
      />
      <WorkspaceModeConfirmModal
        targetMode={pendingWorkspaceMode}
        onCancel={cancelWorkspaceModeChange}
        onConfirm={confirmWorkspaceModeChange}
      />
      <BikeManagementModal
        bike={managementIndex == null ? null : bikes[managementIndex]}
        stage={managementStage}
        onClose={closeBikeManagement}
        onReplace={replaceManagedBike}
        onRequestDelete={() => setManagementStage("delete")}
        onConfirmDelete={deleteManagedBike}
      />
      <DeveloperAboutModal
        isOpen={isDeveloperAboutOpen}
        onClose={() => setIsDeveloperAboutOpen(false)}
        returnFocusRef={developerAboutTriggerRef}
      />
    </div>
      </Suspense>
      )}
      {showLandingPage && (
        <LandingPage
          onEnterLab={enterLab}
          transitionState={landingTransition}
          onTransitionComplete={completeLandingTransition}
        />
      )}
    </>
  );
}

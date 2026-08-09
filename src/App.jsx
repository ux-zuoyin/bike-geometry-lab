import { useEffect, useMemo, useRef, useState } from "react";
import {
  getTrekDomaneSize,
  toBikeGeometry,
  trekDomane,
} from "./data/bikes.js";
import {
  resolveComponentSetup,
  updateWheelSelection,
  updateWheelSelectionLink,
} from "./config/bikeComponents.js";
import { toGeometryFit } from "./config/fitSetup.js";
import { persistBikeSetup, readPersistedBikeSetup } from "./config/setupPersistence.js";
import { FrameGeometryPanel } from "./components/panels/FrameGeometryPanel.jsx";
import { BikeSetupPanel } from "./components/panels/BikeSetupPanel.jsx";
import { BikeVisualizer } from "./components/visualizer/BikeVisualizer.jsx";
import Prism from "./components/visualizer/Prism.jsx";
import brandLogo from "./assets/brand/logo_bai.png";

export function App() {
  const [initialSetup] = useState(() => readPersistedBikeSetup());
  const [frameState, setFrameState] = useState({
    bikeId: trekDomane.id,
    size: trekDomane.visualBaseSize,
  });
  const [fitSetup, setFitSetup] = useState(() => ({ ...initialSetup.fitSetup }));
  const [componentSetup, setComponentSetup] = useState(() => ({ ...initialSetup.componentSetup }));
  const [isStageFullscreen, setIsStageFullscreen] = useState(false);
  const shouldPersistSetup = useRef(false);

  useEffect(() => {
    if (!shouldPersistSetup.current) return;
    persistBikeSetup({ fitSetup, componentSetup });
  }, [fitSetup, componentSetup]);

  useEffect(() => {
    if (!isStageFullscreen) return undefined;
    const exitOnEscape = (event) => {
      if (event.key === "Escape") setIsStageFullscreen(false);
    };
    window.addEventListener("keydown", exitOnEscape);
    return () => window.removeEventListener("keydown", exitOnEscape);
  }, [isStageFullscreen]);

  const bike = useMemo(() => {
    const sizeData = getTrekDomaneSize(frameState.size);
    return {
      ...trekDomane,
      size: frameState.size,
      sizeData,
      geometry: toBikeGeometry(sizeData),
    };
  }, [frameState.size]);

  const setFrameSize = (size) => setFrameState((current) => ({ ...current, size }));
  const updateFitSetup = (key, value) => {
    shouldPersistSetup.current = true;
    setFitSetup((current) => ({ ...current, [key]: value }));
  };
  const updateComponentSetup = (key, value) => {
    shouldPersistSetup.current = true;
    setComponentSetup((current) => {
      if (key === "frontWheelId") return updateWheelSelection(current, "front", value);
      if (key === "rearWheelId") return updateWheelSelection(current, "rear", value);
      if (key === "linkWheelSelection") return updateWheelSelectionLink(current, value);
      return { ...current, [key]: value };
    });
  };
  const resolvedComponentSetup = useMemo(() => resolveComponentSetup(componentSetup), [componentSetup]);
  const fit = useMemo(() => toGeometryFit(fitSetup), [fitSetup]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <img className="site-header__logo" src={brandLogo} alt="Bike Geometry Lab" />
      </header>
      <main className={`workspace${isStageFullscreen ? " workspace--stage-fullscreen" : ""}`} id="top">
        <div className="workspace-prism-background" aria-hidden="true">
          <Prism
            animationType="rotate"
            timeScale={0.3}
            height={6.4}
            baseWidth={5.7}
            scale={2.4}
            hueShift={0}
            colorFrequency={1}
            noise={0}
            glow={0.7}
            transparent
          />
        </div>
        <FrameGeometryPanel
          bike={bike}
          frameState={frameState}
          setFrameSize={setFrameSize}
          componentSetup={componentSetup}
          updateComponentSetup={updateComponentSetup}
          isStageFullscreen={isStageFullscreen}
        />
        <div className="main-stage">
          <BikeVisualizer
            bike={bike}
            fit={fit}
            componentSetup={resolvedComponentSetup}
            isStageFullscreen={isStageFullscreen}
            onToggleStageFullscreen={() => setIsStageFullscreen((current) => !current)}
          />
        </div>
        <BikeSetupPanel
          fitSetup={fitSetup}
          updateFitSetup={updateFitSetup}
          componentSetup={componentSetup}
          updateComponentSetup={updateComponentSetup}
          isStageFullscreen={isStageFullscreen}
        />
      </main>
    </div>
  );
}

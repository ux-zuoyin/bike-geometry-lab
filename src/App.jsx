import { useEffect, useMemo, useState } from "react";
import { Stack } from "@phosphor-icons/react";
import {
  getTrekDomaneSize,
  toBikeGeometry,
  trekDomane,
} from "./data/bikes.js";
import {
  DEFAULT_COMPONENT_SETUP,
  resolveComponentSetup,
  updateWheelSelection,
  updateWheelSelectionLink,
} from "./config/bikeComponents.js";
import { DEFAULT_FIT_SETUP, toGeometryFit } from "./config/fitSetup.js";
import { FrameGeometryPanel } from "./components/panels/FrameGeometryPanel.jsx";
import { BikeSetupPanel } from "./components/panels/BikeSetupPanel.jsx";
import { BikeVisualizer } from "./components/visualizer/BikeVisualizer.jsx";
import Prism from "./components/visualizer/Prism.jsx";

export function App() {
  const [frameState, setFrameState] = useState({
    bikeId: trekDomane.id,
    size: trekDomane.visualBaseSize,
  });
  const [fitSetup, setFitSetup] = useState({ ...DEFAULT_FIT_SETUP });
  const [componentSetup, setComponentSetup] = useState({ ...DEFAULT_COMPONENT_SETUP });
  const [isStageFullscreen, setIsStageFullscreen] = useState(false);

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
  const updateFitSetup = (key, value) => setFitSetup((current) => ({ ...current, [key]: value }));
  const updateComponentSetup = (key, value) => setComponentSetup((current) => {
    if (key === "frontWheelId") return updateWheelSelection(current, "front", value);
    if (key === "rearWheelId") return updateWheelSelection(current, "rear", value);
    if (key === "linkWheelSelection") return updateWheelSelectionLink(current, value);
    return { ...current, [key]: value };
  });
  const resolvedComponentSetup = useMemo(() => resolveComponentSetup(componentSetup), [componentSetup]);
  const fit = useMemo(() => toGeometryFit(fitSetup), [fitSetup]);

  return (
    <div className={`app-shell${isStageFullscreen ? " app-shell--stage-fullscreen" : ""}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="公路车几何设定首页">
          <span className="brand-symbol"><Stack size={20} weight="bold" /></span>
          <span><strong>公路车几何设定</strong><small>几何与骑行设定工具</small></span>
        </a>
        <div className="topbar-context" aria-label="当前车型">
          <span>当前车型</span>
          <strong>Trek Domane</strong>
          <small>耐力型</small>
        </div>
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
        <FrameGeometryPanel bike={bike} frameState={frameState} setFrameSize={setFrameSize} isStageFullscreen={isStageFullscreen} />
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

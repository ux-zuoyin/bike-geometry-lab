import { useMemo, useState } from "react";
import { Info, Question, SidebarSimple, Stack } from "@phosphor-icons/react";
import {
  defaultFit,
  getTrekDomaneSize,
  toBikeGeometry,
  trekDomane,
} from "./data/bikes.js";
import { DEFAULT_WHEELSET_ID, getWheelset } from "./config/wheelsets.js";
import { FrameGeometryPanel } from "./components/panels/FrameGeometryPanel.jsx";
import { BikeSetupPanel } from "./components/panels/BikeSetupPanel.jsx";
import { BikeVisualizer } from "./components/visualizer/BikeVisualizer.jsx";

export function App() {
  const [frameState, setFrameState] = useState({
    bikeId: trekDomane.id,
    size: trekDomane.visualBaseSize,
  });
  const [bikeSetup, setBikeSetup] = useState({
    ...defaultFit,
    wheelset: DEFAULT_WHEELSET_ID,
  });
  const [isSetupPanelOpen, setIsSetupPanelOpen] = useState(true);

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
  const updateBikeSetup = (key, value) => setBikeSetup((current) => ({ ...current, [key]: value }));
  const wheelset = getWheelset(bikeSetup.wheelset);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Bike Geometry Fit 首页">
          <span className="brand-symbol"><Stack size={20} weight="bold" /></span>
          <span><strong>Bike Geometry Fit</strong><small>Geometry comparison tool</small></span>
        </a>
        <div className="topbar-context" aria-label="当前车型">
          <span>ONLY MODEL</span>
          <strong>Trek Domane</strong>
          <small>Endurance</small>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="setup-panel-control"
            aria-label={isSetupPanelOpen ? "隐藏配件面板" : "显示配件面板"}
            aria-expanded={isSetupPanelOpen}
            onClick={() => setIsSetupPanelOpen((current) => !current)}
          >
            <SidebarSimple size={18} />
            <span>{isSetupPanelOpen ? "隐藏配件" : "显示配件"}</span>
          </button>
          <button type="button" aria-label="关于"><Info size={19} /></button>
          <button type="button" aria-label="帮助"><Question size={19} /></button>
        </div>
      </header>

      <main className={`workspace${isSetupPanelOpen ? "" : " workspace--setup-collapsed"}`} id="top">
        <FrameGeometryPanel bike={bike} frameState={frameState} setFrameSize={setFrameSize} />
        <div className="main-stage">
          <BikeVisualizer bike={bike} fit={bikeSetup} wheelset={wheelset} />
        </div>
        {isSetupPanelOpen && <BikeSetupPanel bikeSetup={bikeSetup} updateBikeSetup={updateBikeSetup} />}
      </main>
    </div>
  );
}

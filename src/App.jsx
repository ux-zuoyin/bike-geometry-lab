import { useMemo, useState } from "react";
import { Info, Question, Stack } from "@phosphor-icons/react";
import {
  defaultFit,
  getTrekDomaneSize,
  toBikeGeometry,
  trekDomane,
} from "./data/bikes.js";
import { DEFAULT_WHEELSET_ID, getWheelset } from "./config/wheelsets.js";
import { IconRail } from "./components/navigation/IconRail.jsx";
import { ControlPanel } from "./components/controls/ControlPanel.jsx";
import { BikeVisualizer } from "./components/visualizer/BikeVisualizer.jsx";

export function App() {
  const [active, setActive] = useState("frame");
  const [selectedSize, setSelectedSize] = useState(trekDomane.visualBaseSize);
  const [fit, setFit] = useState(defaultFit);
  const [bikeSetup, setBikeSetup] = useState({ wheelset: DEFAULT_WHEELSET_ID });

  const bike = useMemo(() => {
    const sizeData = getTrekDomaneSize(selectedSize);
    return {
      ...trekDomane,
      size: selectedSize,
      sizeData,
      geometry: toBikeGeometry(sizeData),
    };
  }, [selectedSize]);

  const updateFit = (key, value) => setFit((current) => ({ ...current, [key]: value }));
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
          <button type="button" aria-label="关于"><Info size={19} /></button>
          <button type="button" aria-label="帮助"><Question size={19} /></button>
        </div>
      </header>

      <main className="workspace" id="top">
        <IconRail active={active} onChange={setActive} />
        <ControlPanel
          active={active}
          fit={fit}
          updateFit={updateFit}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          bike={bike}
          bikeSetup={bikeSetup}
          updateBikeSetup={updateBikeSetup}
        />
        <div className="main-stage">
          <BikeVisualizer bike={bike} fit={fit} wheelset={wheelset} />
        </div>
      </main>
    </div>
  );
}

import { getWheelset, wheelsets } from "../../config/wheelsets.js";
import { wheelsetVisuals } from "../../config/wheelsetVisuals.js";
import { SegmentedControl, Stepper } from "../ui/Stepper.jsx";
import { PanelSection } from "./PanelSection.jsx";

function WheelsetSection({ bikeSetup, updateBikeSetup }) {
  return (
    <PanelSection title="轮组" hint="Wheelset Pair">
      <div className="wheelset-options" role="radiogroup" aria-label="轮组类型">
        {wheelsets.map((wheelset) => {
          const isSelected = bikeSetup.wheelset === wheelset.id;
          const visual = wheelsetVisuals[wheelset.id];
          return (
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`wheelset-card${isSelected ? " is-selected" : ""}`}
              key={wheelset.id}
              onClick={() => updateBikeSetup("wheelset", wheelset.id)}
              data-wheelset-option={wheelset.id}
            >
              <span className="wheelset-card__preview" aria-hidden="true">
                <img src={visual.rear} alt="" />
                <img src={visual.front} alt="" />
              </span>
              <span className="wheelset-card__copy">
                <strong>{wheelset.name}</strong>
                <small>{wheelset.description}</small>
              </span>
              <span className="wheelset-card__state">{isSelected ? "SELECTED" : "SELECT"}</span>
            </button>
          );
        })}
      </div>
      <p className="section-note">仅切换 Figma Wheel Visual；700C 外径、车轴与碟片不变。</p>
    </PanelSection>
  );
}

export function BikeSetupPanel({ bikeSetup, updateBikeSetup }) {
  const selectedWheelset = getWheelset(bikeSetup.wheelset);

  return (
    <aside className="side-panel setup-panel" aria-label="车身配件与设置">
      <header className="panel-heading setup-panel__heading">
        <span>BIKE SETUP / COMPONENTS</span>
        <h2>车身配件</h2>
        <p>配置当前自行车的接触点与视觉部件，不修改车架 Geometry。</p>
        <div className="setup-summary" aria-label="当前配置摘要">
          <span>{selectedWheelset.name}</span>
          <span>{bikeSetup.stemLength} mm Stem</span>
          <span>{bikeSetup.crankLength} mm Crank</span>
        </div>
      </header>

      <div className="side-panel__scroll">
        <WheelsetSection bikeSetup={bikeSetup} updateBikeSetup={updateBikeSetup} />

        <PanelSection title="把组" hint="Cockpit">
          <Stepper label="把立长度" unit="mm" value={bikeSetup.stemLength} min={60} max={150} step={10} onChange={(value) => updateBikeSetup("stemLength", value)} />
          <Stepper label="把立角度" unit="°" value={bikeSetup.stemAngle} min={-17} max={17} step={1} onChange={(value) => updateBikeSetup("stemAngle", value)} />
          <Stepper label="垫圈高度" unit="mm" value={bikeSetup.spacer} min={0} max={60} step={5} onChange={(value) => updateBikeSetup("spacer", value)} />
          <p className="section-note">更新 Handlebar Contact Point，不修改 Frame Reach。</p>
        </PanelSection>

        <PanelSection title="坐垫 / 座杆" hint="Saddle System">
          <Stepper label="坐垫高度" unit="mm" value={bikeSetup.saddleHeight} min={620} max={900} step={5} onChange={(value) => updateBikeSetup("saddleHeight", value)} />
          <Stepper label="坐垫后移" unit="mm" value={bikeSetup.saddleSetback} min={-30} max={60} step={2} onChange={(value) => updateBikeSetup("saddleSetback", value)} />
          <Stepper label="座管偏移" unit="mm" value={bikeSetup.seatpostOffset} min={0} max={35} step={5} onChange={(value) => updateBikeSetup("seatpostOffset", value)} />
          <p className="section-note">更新 Saddle Contact Point；Seat Tube Geometry 保持不变。</p>
        </PanelSection>

        <PanelSection title="曲柄" hint="Crank">
          <SegmentedControl
            label="曲柄长度 mm"
            options={[165, 170, 172.5, 175]}
            value={bikeSetup.crankLength}
            onChange={(value) => updateBikeSetup("crankLength", value)}
          />
          <p className="section-note">五通中心不动，脚踏接触点随曲柄长度更新。</p>
        </PanelSection>
      </div>

      <footer><span className="status-dot" /> Setup retained across frame sizes</footer>
    </aside>
  );
}

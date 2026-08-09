import { useState } from "react";
import { BikeComponents } from "../../config/bikeComponents.js";
import { ColorPalette } from "../ui/ColorPalette.jsx";
import { SegmentedControl, Stepper, Switch } from "../ui/Stepper.jsx";
import { PanelSection } from "./PanelSection.jsx";

const optionsFrom = (resources) => resources.map(({ id, name }) => ({ value: id, label: name }));

function WheelPreview({ wheel }) {
  const layers = wheel.visualLayers ?? [{ visualResource: wheel.visualResource, sourceBounds: { x: 0, y: 0, width: 480, height: 480 } }];
  return (
    <span className="wheel-matrix__thumbnail">
      {layers.map((layer, index) => {
        const style = {
          left: `${layer.sourceBounds.x / 4.8}%`,
          top: `${layer.sourceBounds.y / 4.8}%`,
          width: `${layer.sourceBounds.width / 4.8}%`,
          height: `${layer.sourceBounds.height / 4.8}%`,
        };
        if (layer.shape?.type === "rect") {
          return <span key={layer.figmaNodeId ?? index} style={{ ...style, background: layer.shape.fill, borderRadius: `${layer.shape.radius / 4.8}%` }} />;
        }
        return <img key={layer.figmaNodeId ?? index} src={layer.visualResource} alt="" style={style} />;
      })}
    </span>
  );
}

function WheelCell({ side, wheel, value, updateComponentSetup }) {
  const label = side === "front" ? "前轮" : "后轮";
  const stateKey = side === "front" ? "frontWheelId" : "rearWheelId";
  const isSelected = value === wheel.id;
  return (
    <button
      type="button"
      aria-label={`${label}：${wheel.name}`}
      aria-pressed={isSelected}
      title={`${label} · ${wheel.name}`}
      className={`wheel-matrix__cell${isSelected ? " is-selected" : ""}`}
      onClick={() => updateComponentSetup(stateKey, wheel.id)}
      data-wheel-side={side}
      data-wheel-option={wheel.id}
    >
      <WheelPreview wheel={wheel} />
      {isSelected && <span className="wheel-matrix__check" aria-hidden="true">✓</span>}
    </button>
  );
}

function WheelSection({ componentSetup, updateComponentSetup }) {
  const frontWheel = BikeComponents.Wheel.find((wheel) => wheel.id === componentSetup.frontWheelId) ?? BikeComponents.Wheel[0];
  const rearWheel = BikeComponents.Wheel.find((wheel) => wheel.id === componentSetup.rearWheelId) ?? BikeComponents.Wheel[0];
  const isLinkedPair = componentSetup.linkWheelSelection && frontWheel.id === rearWheel.id;
  const summary = isLinkedPair
    ? `前后 · ${frontWheel.name}`
    : `后 ${rearWheel.name}  /  前 ${frontWheel.name}`;

  return (
    <PanelSection
      title="轮组"
      action={(
        <Switch
          label="前后轮联动"
          checked={componentSetup.linkWheelSelection}
          onChange={(value) => updateComponentSetup("linkWheelSelection", value)}
        />
      )}
    >
      <div className="wheel-matrix__summary" aria-label="当前轮组搭配">
        <span>当前搭配</span>
        <strong>{summary}</strong>
      </div>
      <div className="wheel-matrix" aria-label="前后轮轮组选择器">
        <div className="wheel-matrix__header" aria-hidden="true">
          <span />
          <strong>后轮</strong>
          <strong>前轮</strong>
        </div>
        {BikeComponents.Wheel.map((wheel) => (
          <div className="wheel-matrix__row" key={wheel.id}>
            <strong className="wheel-matrix__label">{wheel.name}</strong>
            <WheelCell side="rear" wheel={wheel} value={componentSetup.rearWheelId} updateComponentSetup={updateComponentSetup} />
            <WheelCell side="front" wheel={wheel} value={componentSetup.frontWheelId} updateComponentSetup={updateComponentSetup} />
          </div>
        ))}
      </div>
    </PanelSection>
  );
}

function ResourceSegment({ resources, value, onChange }) {
  return <SegmentedControl options={optionsFrom(resources)} value={value} onChange={onChange} wrap />;
}

function ColorSection({ componentSetup, updateComponentSetup }) {
  return (
    <PanelSection title="颜色">
      <p className="section-note section-note--lead">设置把带缠绕部分的颜色。</p>
      <div className="color-config">
        <ColorPalette label="把带颜色" value={componentSetup.barTapeColor} onChange={(value) => updateComponentSetup("barTapeColor", value)} />
      </div>
    </PanelSection>
  );
}

function FitSetupEditor({ fitSetup, updateFitSetup }) {
  return (
    <>
      <PanelSection title="把组">
        <Stepper label="垫圈高度" unit="mm" value={fitSetup.spacerHeight} min={0} max={60} step={5} onChange={(value) => updateFitSetup("spacerHeight", value)} />
        <Stepper label="把立长度" unit="mm" value={fitSetup.stemLength} min={60} max={150} step={10} onChange={(value) => updateFitSetup("stemLength", value)} />
        <Stepper label="把立角度" unit="°" value={fitSetup.stemAngle} min={-25} max={17} step={1} onChange={(value) => updateFitSetup("stemAngle", value)} />
        <p className="section-note">把立角度以舵管为基准，仅调整把位，不改变车架 Reach。</p>
      </PanelSection>

      <PanelSection title="坐垫">
        <Stepper label="坐垫高度" unit="mm" value={fitSetup.saddleHeight} min={620} max={900} step={5} onChange={(value) => updateFitSetup("saddleHeight", value)} />
        <Stepper label="坐垫后移" unit="mm" value={fitSetup.saddleSetback} min={-30} max={60} step={2} onChange={(value) => updateFitSetup("saddleSetback", value)} />
        <p className="section-note">坐垫高度与后移量共同决定坐垫接触点。</p>
      </PanelSection>

      <PanelSection title="曲柄长度">
        <SegmentedControl
          label="曲柄长度 mm"
          options={[165, 170, 172.5, 175]}
          value={fitSetup.crankLength}
          onChange={(value) => updateFitSetup("crankLength", value)}
        />
        <p className="section-note">仅调整曲柄长度和踏点位置，不更换曲柄外观。</p>
      </PanelSection>
    </>
  );
}

function ComponentsEditor({ componentSetup, updateComponentSetup }) {
  return (
    <>
      <ColorSection componentSetup={componentSetup} updateComponentSetup={updateComponentSetup} />
      <WheelSection componentSetup={componentSetup} updateComponentSetup={updateComponentSetup} />

      <PanelSection title="外胎">
        <p className="section-note section-note--lead">切换外胎不会改变轮径、车轴或车架几何。</p>
        <ResourceSegment resources={BikeComponents.Tire} value={componentSetup.tireId} onChange={(value) => updateComponentSetup("tireId", value)} />
      </PanelSection>

      <PanelSection title="牙盘组">
        <p className="section-note section-note--lead">切换牙盘不会改变曲柄长度。</p>
        <ResourceSegment resources={BikeComponents.Chainring} value={componentSetup.chainringVisualId} onChange={(value) => updateComponentSetup("chainringVisualId", value)} />
      </PanelSection>

      <PanelSection title="曲柄">
        <p className="section-note section-note--lead">曲柄外观与骑行设定中的曲柄长度相互独立。</p>
        <ResourceSegment resources={BikeComponents.Crank} value={componentSetup.crankVisualId} onChange={(value) => updateComponentSetup("crankVisualId", value)} />
      </PanelSection>

      {BikeComponents.Cassette.length > 1 && (
        <PanelSection title="飞轮">
          <p className="section-note section-note--lead">切换飞轮不会改变后轮位置。</p>
          <ResourceSegment resources={BikeComponents.Cassette} value={componentSetup.cassetteId} onChange={(value) => updateComponentSetup("cassetteId", value)} />
        </PanelSection>
      )}

      <PanelSection title="变速套件">
        <p className="section-note section-note--lead">仅更换变速套件外观，不改变车架几何。</p>
        <ResourceSegment resources={BikeComponents.Drivetrain} value={componentSetup.drivetrainVisualId} onChange={(value) => updateComponentSetup("drivetrainVisualId", value)} />
      </PanelSection>
    </>
  );
}

export function BikeSetupPanel({ fitSetup, updateFitSetup, componentSetup, updateComponentSetup, isStageFullscreen = false }) {
  const [activeTab, setActiveTab] = useState("components");

  return (
    <aside className="side-panel setup-panel" aria-label="自行车设定" aria-hidden={isStageFullscreen} inert={isStageFullscreen ? true : undefined}>
      <header className="panel-heading setup-panel__heading">
        <h2>自行车设定</h2>
        <p>骑行设定与配件选择相互独立。</p>
        <div className="setup-tabs" role="tablist" aria-label="自行车设定">
          <button type="button" role="tab" aria-selected={activeTab === "components"} className={activeTab === "components" ? "is-active" : ""} onClick={() => setActiveTab("components")}>
            <strong>车身配件</strong>
          </button>
          <button type="button" role="tab" aria-selected={activeTab === "fit"} className={activeTab === "fit" ? "is-active" : ""} onClick={() => setActiveTab("fit")}>
            <strong>骑行设定</strong>
          </button>
        </div>
      </header>

      <div className="side-panel__scroll" role="tabpanel" aria-label={activeTab === "fit" ? "骑行设定" : "车身配件"}>
        {activeTab === "components"
          ? <ComponentsEditor componentSetup={componentSetup} updateComponentSetup={updateComponentSetup} />
          : <FitSetupEditor fitSetup={fitSetup} updateFitSetup={updateFitSetup} />}
      </div>

      <footer><span className="status-dot" /> 骑行设定与配件选择已保留</footer>
    </aside>
  );
}

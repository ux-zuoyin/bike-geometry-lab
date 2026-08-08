import { useRef, useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { geometrySizes, moduleItems } from "../../data/bikes.js";
import { ENDURANCE_VISUAL_BASE_SIZE, geometryFieldDefinitions } from "../../data/enduranceGeometry.js";
import { endurancePreset } from "../../config/framePresets/endurance.js";
import { SegmentedControl, Stepper } from "../ui/Stepper.jsx";

function PanelHeader({ active }) {
  const module = moduleItems.find((item) => item.id === active);
  return (
    <header className="panel-heading">
      <span>MODULE {module.index}</span>
      <h2>{module.label}</h2>
      <p>当前唯一车型为 Trek Domane，所有长度数据统一使用 mm。</p>
    </header>
  );
}

function PanelSection({ title, hint, children }) {
  return (
    <section className="control-section">
      <div className="section-title"><h3>{title}</h3>{hint && <span>{hint}</span>}</div>
      {children}
    </section>
  );
}

function FrameControls({ bike, selectedSize, setSelectedSize }) {
  const geometry = bike.geometry;
  const sizeData = bike.sizeData;
  const helpFields = ["reach", "stack", "effectiveTopTube", "chainstay", "wheelbase"];
  return (
    <>
      <PanelSection title="车型" hint="Single Model">
        <div className="model-picker">
          <article className="model-card is-selected" aria-label="Trek Domane Endurance，7 个尺码">
            <span>{bike.categoryLabel}</span>
            <strong>{bike.brand} {bike.model}</strong>
            <small>{geometrySizes.length} sizes</small>
          </article>
        </div>
      </PanelSection>
      <PanelSection title="视觉模板" hint="Figma Source">
        <div className={`archetype-note archetype-note--${endurancePreset.id}`}>
          <strong>{endurancePreset.zhLabel} <em className="is-calibrated">FIGMA SOURCE</em></strong>
          <span>仅使用 Trek Domane Endurance 模板；56 码为零形变视觉基准。</span>
        </div>
      </PanelSection>
      <PanelSection title="尺码" hint="Size">
        <SegmentedControl options={geometrySizes} value={selectedSize} onChange={setSelectedSize} />
        <p className="section-note">切换尺码会更新车架节点、Stack、Reach、Head Tube 与 Wheelbase。</p>
        <div className="geometry-source">
          <span>BASE VISUAL SIZE</span>
          <strong>{ENDURANCE_VISUAL_BASE_SIZE}</strong>
          <small>Figma Visual Template calibrated against Size 56.</small>
        </div>
      </PanelSection>
      <PanelSection title="几何摘要">
        <div className="geometry-grid">
          {[
            ["Stack", sizeData.stackMm],
            ["Reach", sizeData.reachMm],
            ["Head tube", sizeData.headTubeLengthMm],
            ["Wheelbase", sizeData.wheelbaseMm],
          ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>mm</small></div>)}
        </div>
      </PanelSection>
      <PanelSection title="字段说明" hint="Geometry Help">
        <div className="geometry-help-list">
          {helpFields.map((field) => {
            const definition = geometryFieldDefinitions[field];
            return (
              <div className="geometry-help-row" key={field} title={definition.description}>
                <span>{definition.mark}</span>
                <div><strong>{definition.label}</strong><small>{definition.description}</small></div>
                <em>{geometry[field]} {definition.unit}</em>
              </div>
            );
          })}
        </div>
      </PanelSection>
    </>
  );
}

function CockpitControls({ fit, updateFit }) {
  return (
    <>
      <PanelSection title="头管 & 把立" hint="Cockpit">
        <Stepper label="垫圈高度" unit="mm" value={fit.spacer} min={0} max={60} step={5} onChange={(value) => updateFit("spacer", value)} />
        <Stepper label="把立长度" unit="mm" value={fit.stemLength} min={60} max={150} step={10} onChange={(value) => updateFit("stemLength", value)} />
        <Stepper label="把立角度" unit="°" value={fit.stemAngle} min={-17} max={17} step={1} onChange={(value) => updateFit("stemAngle", value)} />
      </PanelSection>
      <div className="live-callout">
        <span className="pulse-dot" />
        <div><strong>Handlebar Contact Point</strong><p>正在由把立长度、角度与垫圈共同驱动。</p></div>
      </div>
    </>
  );
}

function SaddleControls({ fit, updateFit }) {
  return (
    <>
      <PanelSection title="坐垫 & 座管" hint="Saddle">
        <Stepper label="坐垫高度" unit="mm" value={fit.saddleHeight} min={620} max={900} step={5} onChange={(value) => updateFit("saddleHeight", value)} />
        <Stepper label="坐垫后移" unit="mm" value={fit.saddleSetback} min={-30} max={60} step={2} onChange={(value) => updateFit("saddleSetback", value)} />
        <Stepper label="座管偏移" unit="mm" value={fit.seatpostOffset} min={0} max={35} step={5} onChange={(value) => updateFit("seatpostOffset", value)} />
      </PanelSection>
      <p className="panel-explainer">高度沿座管角度移动，后移量只改变坐垫相对夹头的位置。</p>
    </>
  );
}

function CrankControls({ fit, updateFit }) {
  return (
    <PanelSection title="曲柄系统" hint="Crank">
      <SegmentedControl label="曲柄长度 mm" options={[165, 167.5, 170, 172.5, 175]} value={fit.crankLength} onChange={(value) => updateFit("crankLength", value)} />
      <p className="section-note">五通中心保持不动，P 脚踏接触点随长度改变。</p>
    </PanelSection>
  );
}

function DataPanel({ bike }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };
  return (
    <>
      <PanelSection title="Geometry Chart" hint="Source Preview">
        <button type="button" className="upload-zone" onClick={() => inputRef.current?.click()}>
          {preview ? <img src={preview} alt="Geometry Chart 预览" /> : <><UploadSimple size={24} /><strong>上传几何表截图</strong><span>仅预览，不执行 OCR</span></>}
        </button>
        <input ref={inputRef} hidden type="file" accept="image/*" onChange={handleFile} />
      </PanelSection>
      <PanelSection title="当前尺码数据" hint="Normalized mm">
        <pre className="json-preview">{JSON.stringify({
          modelId: bike.id,
          brand: bike.brand,
          model: bike.model,
          category: bike.category,
          visualBaseSize: bike.visualBaseSize,
          sourceNote: bike.sourceNote,
          geometry: bike.sizeData,
        }, null, 2)}</pre>
      </PanelSection>
    </>
  );
}

export function ControlPanel({ active, fit, updateFit, selectedSize, setSelectedSize, bike }) {
  let content;
  if (active === "frame") content = <FrameControls bike={bike} selectedSize={selectedSize} setSelectedSize={setSelectedSize} />;
  if (active === "cockpit") content = <CockpitControls fit={fit} updateFit={updateFit} />;
  if (active === "saddle") content = <SaddleControls fit={fit} updateFit={updateFit} />;
  if (active === "crank") content = <CrankControls fit={fit} updateFit={updateFit} />;
  if (active === "data") content = <DataPanel bike={bike} />;

  return (
    <aside className="control-panel">
      <PanelHeader active={active} />
      <div className="control-panel__scroll">{content}</div>
      <footer><span className="status-dot" /> Trek Domane geometry · mm</footer>
    </aside>
  );
}

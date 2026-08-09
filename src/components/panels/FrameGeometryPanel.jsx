import { useEffect, useState } from "react";
import { geometrySizes } from "../../data/bikes.js";
import { SegmentedControl } from "../ui/Stepper.jsx";
import { PanelSection } from "./PanelSection.jsx";

const GEOMETRY_LANGUAGE_STORAGE_KEY = "bike-fit:geometry-language";

const geometryDetails = [
  { key: "seatTubeLengthMm", unit: "mm", zh: "座管长度", en: "Seat Tube" },
  { key: "seatTubeAngleDeg", unit: "°", zh: "座管角", en: "Seat Tube Angle" },
  { key: "headTubeAngleDeg", unit: "°", zh: "头管角", en: "Head Tube Angle" },
  { key: "effectiveTopTubeMm", unit: "mm", zh: "有效上管", en: "Effective Top Tube" },
  { key: "bbDropMm", unit: "mm", zh: "五通下沉", en: "BB Drop" },
  { key: "chainstayMm", unit: "mm", zh: "后下叉长度", en: "Chainstay" },
  { key: "forkOffsetMm", unit: "mm", zh: "前叉偏移", en: "Fork Offset" },
  { key: "trailMm", unit: "mm", zh: "拖曳距", en: "Trail" },
  { key: "standoverMm", unit: "mm", zh: "跨高", en: "Standover" },
];

export function FrameGeometryPanel({ bike, frameState, setFrameSize, isStageFullscreen = false }) {
  const sizeData = bike.sizeData;
  const [geometryLanguage, setGeometryLanguage] = useState(() => {
    try {
      return window.localStorage.getItem(GEOMETRY_LANGUAGE_STORAGE_KEY) === "en" ? "en" : "zh";
    } catch {
      return "zh";
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(GEOMETRY_LANGUAGE_STORAGE_KEY, geometryLanguage);
    } catch {
      // Storage can be unavailable in privacy-restricted contexts; session state still works.
    }
  }, [geometryLanguage]);

  return (
    <aside className="side-panel frame-panel" aria-label="车架与几何" aria-hidden={isStageFullscreen} inert={isStageFullscreen ? true : undefined}>
      <header className="panel-heading">
        <h2>车架几何</h2>
        <p>选择车型与尺码。几何尺寸采用 Trek Domane 官方数据。</p>
      </header>

      <div className="side-panel__scroll">
        <PanelSection title="车型">
          <article className="model-card is-selected" aria-label="Trek Domane 耐力型，7 个尺码">
            <div className="model-card__identity">
              <strong>{bike.brand} {bike.model}</strong>
              <span>{bike.categoryLabel}</span>
            </div>
            <small>{geometrySizes.length} 个尺码</small>
          </article>
        </PanelSection>

        <PanelSection title="尺码" hint={`已选择 · ${frameState.size}`}>
          <SegmentedControl options={geometrySizes} value={frameState.size} onChange={setFrameSize} />
          <p className="section-note">切换尺码不会改变右侧骑行设定和配件选择。</p>
        </PanelSection>

        <PanelSection title="几何摘要" hint="核心参数">
          <div className="geometry-grid">
            {[
              ["Stack", sizeData.stackMm],
              ["Reach", sizeData.reachMm],
              ["头管长度", sizeData.headTubeLengthMm],
              ["轴距", sizeData.wheelbaseMm],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>mm</small>
              </div>
            ))}
          </div>
        </PanelSection>

        <PanelSection
          title="几何详情"
          hint="官方数据"
          action={(
            <div className="geometry-language-toggle" role="group" aria-label="几何参数语言">
              <button
                type="button"
                className={geometryLanguage === "zh" ? "is-active" : ""}
                aria-pressed={geometryLanguage === "zh"}
                onClick={() => setGeometryLanguage("zh")}
              >
                中文
              </button>
              <button
                type="button"
                className={geometryLanguage === "en" ? "is-active" : ""}
                aria-pressed={geometryLanguage === "en"}
                onClick={() => setGeometryLanguage("en")}
              >
                EN
              </button>
            </div>
          )}
        >
          <dl className="geometry-detail-list">
            {geometryDetails.map(({ key, unit, ...labels }) => (
              <div key={key} data-geometry-field={key}>
                <dt>{labels[geometryLanguage]}</dt>
                <dd><strong>{sizeData[key]}</strong><span>{unit}</span></dd>
              </div>
            ))}
          </dl>
        </PanelSection>
      </div>

      <footer><span className="status-dot" /> Trek Domane 官方几何 · mm / °</footer>
    </aside>
  );
}

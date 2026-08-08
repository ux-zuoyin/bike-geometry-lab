import { geometrySizes } from "../../data/bikes.js";
import { SegmentedControl } from "../ui/Stepper.jsx";
import { PanelSection } from "./PanelSection.jsx";

const geometryDetails = [
  ["Seat Tube", "seatTubeLengthMm", "mm"],
  ["Seat Tube Angle", "seatTubeAngleDeg", "°"],
  ["Head Tube Angle", "headTubeAngleDeg", "°"],
  ["Effective Top Tube", "effectiveTopTubeMm", "mm"],
  ["BB Drop", "bbDropMm", "mm"],
  ["Chainstay", "chainstayMm", "mm"],
  ["Fork Offset", "forkOffsetMm", "mm"],
  ["Trail", "trailMm", "mm"],
  ["Standover", "standoverMm", "mm"],
];

export function FrameGeometryPanel({ bike, frameState, setFrameSize }) {
  const sizeData = bike.sizeData;

  return (
    <aside className="side-panel frame-panel" aria-label="车架与几何">
      <header className="panel-heading">
        <span>FRAME / GEOMETRY</span>
        <h2>车架几何</h2>
        <p>选择正在比较的车架与尺码。所有尺寸来自 Trek Domane Geometry 数据。</p>
      </header>

      <div className="side-panel__scroll">
        <PanelSection title="车型" hint="Current Frame">
          <article className="model-card is-selected" aria-label="Trek Domane Endurance，7 个尺码">
            <span>{bike.categoryLabel}</span>
            <strong>{bike.brand} {bike.model}</strong>
            <small>{geometrySizes.length} sizes</small>
          </article>
        </PanelSection>

        <PanelSection title="尺码" hint={`Selected · ${frameState.size}`}>
          <SegmentedControl options={geometrySizes} value={frameState.size} onChange={setFrameSize} />
          <p className="section-note">只更新车架 Geometry；右侧 Bike Setup 保持不变。</p>
        </PanelSection>

        <PanelSection title="Geometry Summary" hint="Primary">
          <div className="geometry-grid">
            {[
              ["Stack", sizeData.stackMm],
              ["Reach", sizeData.reachMm],
              ["Head Tube", sizeData.headTubeLengthMm],
              ["Wheelbase", sizeData.wheelbaseMm],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>mm</small>
              </div>
            ))}
          </div>
        </PanelSection>

        <PanelSection title="Geometry Details" hint="Official Data">
          <dl className="geometry-detail-list">
            {geometryDetails.map(([label, key, unit]) => (
              <div key={key} data-geometry-field={key}>
                <dt>{label}</dt>
                <dd><strong>{sizeData[key]}</strong><span>{unit}</span></dd>
              </div>
            ))}
          </dl>
        </PanelSection>
      </div>

      <footer><span className="status-dot" /> Trek Domane geometry · mm / degree</footer>
    </aside>
  );
}

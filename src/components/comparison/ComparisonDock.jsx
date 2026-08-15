import { buildBikeGeometry } from "../../lib/geometry/index.js";
import { pointDelta } from "../../lib/geometry/contactPoints.js";
import { toRendererGeometry } from "../../lib/geometry/renderGeometryResolver.js";

const displayMetricValue = (value) => (
  typeof value === "number" && Number.isFinite(value) ? value : "—"
);

const getOfficialGeometry = (bike) => bike.officialGeometry ?? bike.sizeData?.officialGeometry ?? {};
const getRendererGeometry = (bike) => (
  bike.renderGeometry ? toRendererGeometry(bike.renderGeometry) : bike.geometry
);

function Metric({ label, reference, candidate, unit = "mm", invert = false }) {
  const hasBothValues = [reference, candidate].every((value) => (
    typeof value === "number" && Number.isFinite(value)
  ));
  const raw = hasBothValues ? candidate - reference : null;
  const delta = hasBothValues ? Math.round(raw * (invert ? -1 : 1) * 10) / 10 : null;
  return (
    <div className="comparison-metric">
      <span>{label}</span>
      <div><small>基准</small><strong>{displayMetricValue(reference)}</strong></div>
      <div><small>对比</small><strong>{displayMetricValue(candidate)}</strong></div>
      <em className={delta != null && Math.abs(delta) <= 8 ? "is-close" : ""}>Δ {delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta} ${unit}`}</em>
    </div>
  );
}

export function ComparisonDock({ reference, candidate, fit, onOpenRecommendation }) {
  const referenceOfficialGeometry = getOfficialGeometry(reference);
  const candidateOfficialGeometry = getOfficialGeometry(candidate);
  const refBike = buildBikeGeometry(getRendererGeometry(reference), fit);
  const candBike = buildBikeGeometry(getRendererGeometry(candidate), fit);
  const contact = pointDelta(candBike.contacts.handlebar, refBike.contacts.handlebar);
  const hasScoreGeometry = [referenceOfficialGeometry.stack, referenceOfficialGeometry.reach, candidateOfficialGeometry.stack, candidateOfficialGeometry.reach]
    .every((value) => typeof value === "number" && Number.isFinite(value));
  const score = hasScoreGeometry
    ? Math.max(62, Math.round(100 - Math.abs(candidateOfficialGeometry.stack - referenceOfficialGeometry.stack) * 0.75 - Math.abs(candidateOfficialGeometry.reach - referenceOfficialGeometry.reach) * 1.1))
    : null;
  return (
    <section className="comparison-dock">
      <div className="dock-heading">
        <span>实时对比</span>
        <strong>{score == null ? "—" : `${score}%`}</strong>
        <small>几何对比</small>
      </div>
      <div className="dock-metrics">
        <Metric label="STACK" reference={referenceOfficialGeometry.stack} candidate={candidateOfficialGeometry.stack} />
        <Metric label="REACH" reference={referenceOfficialGeometry.reach} candidate={candidateOfficialGeometry.reach} />
        <Metric label="WHEELBASE" reference={referenceOfficialGeometry.wheelbase} candidate={candidateOfficialGeometry.wheelbase} />
        <Metric label="HEAD TUBE" reference={referenceOfficialGeometry.headTubeLength} candidate={candidateOfficialGeometry.headTubeLength} />
      </div>
      <div className="contact-delta">
        <span>把位变化</span>
        <p>X <strong>{contact.x >= 0 ? "+" : ""}{contact.x} mm</strong></p>
        <p>Y <strong>{contact.y >= 0 ? "+" : ""}{contact.y} mm</strong></p>
        <button type="button" onClick={onOpenRecommendation}>查看建议 →</button>
      </div>
    </section>
  );
}

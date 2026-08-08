import { buildBikeGeometry } from "../../lib/geometry/index.js";
import { pointDelta } from "../../lib/geometry/contactPoints.js";

function Metric({ label, reference, candidate, unit = "mm", invert = false }) {
  const raw = candidate - reference;
  const delta = Math.round(raw * (invert ? -1 : 1) * 10) / 10;
  return (
    <div className="comparison-metric">
      <span>{label}</span>
      <div><small>REF</small><strong>{reference}</strong></div>
      <div><small>CAND</small><strong>{candidate}</strong></div>
      <em className={Math.abs(delta) <= 8 ? "is-close" : ""}>Δ {delta > 0 ? "+" : ""}{delta} {unit}</em>
    </div>
  );
}

export function ComparisonDock({ reference, candidate, fit, onOpenRecommendation }) {
  const refBike = buildBikeGeometry(reference.geometry, fit);
  const candBike = buildBikeGeometry(candidate.geometry, fit);
  const contact = pointDelta(candBike.contacts.handlebar, refBike.contacts.handlebar);
  const score = Math.max(62, Math.round(100 - Math.abs(candidate.geometry.stack - reference.geometry.stack) * 0.75 - Math.abs(candidate.geometry.reach - reference.geometry.reach) * 1.1));
  return (
    <section className="comparison-dock">
      <div className="dock-heading">
        <span>LIVE COMPARISON</span>
        <strong>{score}%</strong>
        <small>geometry match</small>
      </div>
      <div className="dock-metrics">
        <Metric label="STACK" reference={reference.geometry.stack} candidate={candidate.geometry.stack} />
        <Metric label="REACH" reference={reference.geometry.reach} candidate={candidate.geometry.reach} />
        <Metric label="WHEELBASE" reference={reference.geometry.wheelbase} candidate={candidate.geometry.wheelbase} />
        <Metric label="HEAD TUBE" reference={reference.geometry.headTube} candidate={candidate.geometry.headTube} />
      </div>
      <div className="contact-delta">
        <span>HANDLEBAR CONTACT</span>
        <p>X <strong>{contact.x >= 0 ? "+" : ""}{contact.x} mm</strong></p>
        <p>Y <strong>{contact.y >= 0 ? "+" : ""}{contact.y} mm</strong></p>
        <button type="button" onClick={onOpenRecommendation}>查看建议 →</button>
      </div>
    </section>
  );
}

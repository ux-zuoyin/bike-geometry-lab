import { PIXELS_PER_MM, WHEEL_RADIUS } from "../../../lib/geometry/frameGeometry.js";
import { circlePoint } from "../../../lib/bikeVisual/pathGeometry.js";
import { BikeBrakeDisc } from "./BikeBrakeDisc.jsx";

export function BikeWheelBase({ center, preset, side }) {
  const radius = WHEEL_RADIUS * PIXELS_PER_MM;
  const rimDepth = preset.wheel.rimDepth;
  const rimCenter = radius - 8 - rimDepth / 2;
  const spokeRadius = radius - rimDepth - 12;
  const spokeCount = preset.wheel.spokes;

  return (
    <g className={`bike-wheel bike-wheel--${side}`}>
      <circle className="bike-wheel__tire" cx={center.x} cy={center.y} r={radius} />
      <circle className="bike-wheel__rim" cx={center.x} cy={center.y} r={rimCenter} style={{ strokeWidth: rimDepth }} />
      <circle className="bike-wheel__rim-edge" cx={center.x} cy={center.y} r={radius - rimDepth - 12} />
      <g className="bike-wheel__spokes">
        {Array.from({ length: spokeCount }).map((_, index) => {
          const angle = (index * Math.PI * 2) / spokeCount;
          const outer = circlePoint(center, spokeRadius, angle);
          const inner = circlePoint(center, 7, angle + (index % 2 ? 0.18 : -0.18));
          return <line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />;
        })}
      </g>
      <circle className="bike-wheel__hub" cx={center.x} cy={center.y} r="7" />
      <circle className="bike-wheel__axle" cx={center.x} cy={center.y} r="2.5" />
      <BikeBrakeDisc center={center} side={side} size={side === "front" ? 18 : 16} />
    </g>
  );
}

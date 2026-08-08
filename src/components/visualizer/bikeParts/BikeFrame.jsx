import { pointAlong, projectedPoints, taperedTubePath } from "../../../lib/bikeVisual/pathGeometry.js";

function Tube({ a, b, widths, className }) {
  return <path className={`bike-silhouette frame-piece ${className}`} d={taperedTubePath(a, b, widths[0], widths[1] ?? widths[0])} />;
}

export function BikeFrame({ points, project, preset }) {
  const p = projectedPoints(points, project);
  const stayAttach = pointAlong(p.seatTop, p.bb, preset.stays.attachRatio);
  return (
    <g className={`bike-frame bike-frame--${preset.id}`}>
      <Tube a={p.rearAxle} b={p.bb} widths={[preset.stays.chainWidth * 0.76, preset.stays.chainWidth]} className="frame-piece--chainstay" />
      <Tube a={p.rearAxle} b={stayAttach} widths={[preset.stays.seatWidth * 0.7, preset.stays.seatWidth]} className="frame-piece--seatstay" />
      <Tube a={p.bb} b={p.seatTop} widths={preset.tubes.seat} className="frame-piece--seat-tube" />
      <Tube a={p.seatTop} b={p.headTop} widths={preset.tubes.top} className="frame-piece--top-tube" />
      <Tube a={p.bb} b={p.headBottom} widths={[preset.tubes.down[1], preset.tubes.down[0]]} className="frame-piece--down-tube" />
      <Tube a={p.headBottom} b={p.headTop} widths={preset.tubes.head} className="frame-piece--head-tube" />
      <circle className="bike-frame__bb" cx={p.bb.x} cy={p.bb.y} r={18 + preset.tubes.down[1] * 0.08} />
      <circle className="bike-frame__bb-cutout" cx={p.bb.x} cy={p.bb.y} r="8" />
      <path className="bike-frame__top-highlight" d={`M ${p.seatTop.x} ${p.seatTop.y - 2} L ${p.headTop.x} ${p.headTop.y - 2}`} />
    </g>
  );
}

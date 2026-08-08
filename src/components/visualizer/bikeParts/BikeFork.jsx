import { offsetPoint, pointAlong, projectedPoints, unitNormal } from "../../../lib/bikeVisual/pathGeometry.js";

export function BikeFork({ points, project, preset }) {
  const p = projectedPoints(points, project);
  const start = p.headBottom;
  const end = p.frontAxle;
  const normal = unitNormal(start, end);
  const control = offsetPoint(pointAlong(start, end, 0.56), normal, preset.fork.curve * 42);
  const s1 = offsetPoint(start, normal, preset.fork.crownWidth / 2);
  const s2 = offsetPoint(start, normal, -preset.fork.crownWidth / 2);
  const e1 = offsetPoint(end, normal, preset.fork.axleWidth / 2);
  const e2 = offsetPoint(end, normal, -preset.fork.axleWidth / 2);
  const c1 = offsetPoint(control, normal, preset.fork.crownWidth * 0.28);
  const c2 = offsetPoint(control, normal, -preset.fork.crownWidth * 0.28);
  return (
    <g className="bike-fork">
      <path className="bike-silhouette bike-fork__leg" d={`M ${s1.x} ${s1.y} Q ${c1.x} ${c1.y} ${e1.x} ${e1.y} L ${e2.x} ${e2.y} Q ${c2.x} ${c2.y} ${s2.x} ${s2.y} Z`} />
      <path className="bike-fork__highlight" d={`M ${start.x - 2} ${start.y + 3} Q ${control.x} ${control.y} ${end.x - 2} ${end.y - 5}`} />
    </g>
  );
}

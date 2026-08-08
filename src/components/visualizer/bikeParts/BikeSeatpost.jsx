import { taperedTubePath } from "../../../lib/bikeVisual/pathGeometry.js";

export function BikeSeatpost({ frame, saddle, project, preset }) {
  const start = project(frame.seatTop);
  const end = project(saddle.rail);
  const rail = project(saddle.rail);
  const width = preset.seatpost.width;
  return (
    <g className={`bike-seatpost bike-seatpost--${preset.id}`}>
      <path className="bike-silhouette" d={taperedTubePath(start, end, width * (1 + preset.seatpost.aero * 0.25), width)} />
      <rect className="bike-seatpost__clamp" x={rail.x - 12} y={rail.y - 4} width="25" height="7" rx="3" />
    </g>
  );
}

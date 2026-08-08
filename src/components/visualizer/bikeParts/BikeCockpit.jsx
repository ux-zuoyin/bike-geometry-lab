import { taperedTubePath } from "../../../lib/bikeVisual/pathGeometry.js";

export function BikeCockpit({ points, project, preset }) {
  const top = project(points.steererTop);
  const end = project(points.stemEnd);
  const hood = project(points.hood);
  const drop = project(points.drop);
  const stemTip = { x: end.x + 9, y: end.y + 1 };
  const barTop = { x: hood.x - 16, y: hood.y - 4 };
  const barEnd = { x: drop.x - 18, y: drop.y + preset.cockpit.dropExtension * 0.12 };
  const hoodWidth = 11 * preset.cockpit.hoodScale;
  const hoodHeight = 13 * preset.cockpit.hoodScale;
  return (
    <g className={`bike-cockpit bike-cockpit--${preset.id}`}>
      <path className="bike-silhouette bike-cockpit__stem" d={taperedTubePath(top, stemTip, preset.cockpit.stemWidth * 0.82, preset.cockpit.stemWidth)} />
      <circle className="bike-cockpit__stem-cap" cx={top.x} cy={top.y} r={preset.cockpit.stemWidth * 0.72} />
      <path
        className="bike-cockpit__bar"
        style={{ strokeWidth: preset.cockpit.barWidth }}
        d={`M ${end.x + 3} ${end.y}
            C ${end.x + 10} ${end.y - 2}, ${barTop.x - 5} ${barTop.y}, ${barTop.x} ${barTop.y}
            L ${hood.x} ${hood.y}
            C ${hood.x + 9} ${hood.y + 7}, ${hood.x + 9} ${hood.y + 20}, ${hood.x + 3} ${hood.y + 28}
            C ${hood.x - 2} ${hood.y + 36}, ${drop.x + 8} ${drop.y + 4}, ${drop.x} ${drop.y}
            C ${drop.x - 7} ${drop.y + 1}, ${barEnd.x + 5} ${barEnd.y} ${barEnd.x} ${barEnd.y - 2}`}
      />
      <path className="bike-silhouette bike-cockpit__hood" d={`M ${hood.x - 9} ${hood.y - 6} Q ${hood.x + 3} ${hood.y - 10} ${hood.x + hoodWidth} ${hood.y - 2} L ${hood.x + 8} ${hood.y + hoodHeight} Q ${hood.x - 1} ${hood.y + 10} ${hood.x - 9} ${hood.y + 4} Z`} />
      <path className="bike-cockpit__lever" d={`M ${hood.x + 6} ${hood.y + 7} Q ${hood.x + 12} ${hood.y + 21} ${hood.x + 7} ${hood.y + 31}`} />
    </g>
  );
}

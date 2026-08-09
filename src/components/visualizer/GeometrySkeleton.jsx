const CONNECTIONS = [
  ["rearAxle", "bottomBracket"],
  ["rearAxle", "seatTubeTop"],
  ["bottomBracket", "seatTubeTop"],
  ["seatTubeTop", "headTubeTop"],
  ["bottomBracket", "headTubeBottom"],
  ["headTubeBottom", "headTubeTop"],
  ["headTubeBottom", "frontAxle"],
  ["seatTubeTop", "saddleAnchor"],
  ["handlebarClamp", "handlebarAnchor"],
];

const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const signed = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}°`;
const COCKPIT_ANCHORS = new Set([
  "headTubeTop",
  "spacerHeadtubeAnchor",
  "spacerBottom",
  "spacerTop",
  "stemSpacerAnchor",
  "stemHandlebarAnchor",
  "handlebarClampAnchor",
  "stemBase",
  "handlebarClamp",
  "stemAnchor",
  "stemEnd",
]);

export function GeometrySkeleton({ anchors, cockpit, project }) {
  const projected = Object.fromEntries(Object.entries(anchors).map(([key, point]) => [key, project(point)]));
  const cockpitPoints = {
    HeadTop: project(cockpit.spacerHeadtubeAnchor),
    SpacerHeadtubeAnchor: project(cockpit.spacerHeadtubeAnchor),
    SpacerTop: project(cockpit.spacerTop),
    StemSpacerAnchor: project(cockpit.stemSpacerAnchor),
    StemBase: project(cockpit.stemBase),
    StemHandlebarAnchor: project(cockpit.stemHandlebarAnchor),
    StemEnd: project(cockpit.stemEnd),
    HandlebarClampAnchor: project(cockpit.handlebarClampAnchor),
    H: project(cockpit.handlebarContact),
  };
  const spacerLabelPoint = midpoint(cockpitPoints.SpacerHeadtubeAnchor, cockpitPoints.SpacerTop);
  const stemLabelPoint = midpoint(cockpitPoints.StemSpacerAnchor, cockpitPoints.StemHandlebarAnchor);
  const connectionPairs = [
    ["HeadTop", "SpacerHeadtubeAnchor"],
    ["SpacerTop", "StemSpacerAnchor"],
    ["StemHandlebarAnchor", "HandlebarClampAnchor"],
  ];

  return (
    <g className="geometry-skeleton" aria-label="几何骨架调试">
      {CONNECTIONS.map(([from, to]) => <line key={`${from}-${to}`} x1={projected[from].x} y1={projected[from].y} x2={projected[to].x} y2={projected[to].y} />)}
      {Object.entries(projected).filter(([key]) => !COCKPIT_ANCHORS.has(key)).map(([key, point]) => (
        <g key={key} className="geometry-skeleton__point">
          <circle cx={point.x} cy={point.y} r="4" />
          <text x={point.x + 6} y={point.y - 6}>{key}</text>
        </g>
      ))}
      <g className="cockpit-geometry-debug" aria-label="把组几何调试">
        <line className="cockpit-geometry-debug__spacer" x1={cockpitPoints.SpacerHeadtubeAnchor.x} y1={cockpitPoints.SpacerHeadtubeAnchor.y} x2={cockpitPoints.SpacerTop.x} y2={cockpitPoints.SpacerTop.y} />
        <line className="cockpit-geometry-debug__stem" x1={cockpitPoints.StemSpacerAnchor.x} y1={cockpitPoints.StemSpacerAnchor.y} x2={cockpitPoints.StemHandlebarAnchor.x} y2={cockpitPoints.StemHandlebarAnchor.y} />
        {Object.entries(cockpitPoints).map(([label, point], index) => (
          <g key={label} data-cockpit-anchor={label}>
            <circle cx={point.x} cy={point.y} r={index % 2 === 0 ? 5 : 3} />
            <text x={point.x + 7} y={point.y - 10 - index * 7}>{label}</text>
          </g>
        ))}
        {connectionPairs.map(([from, to], index) => {
          const error = Math.hypot(cockpitPoints[from].x - cockpitPoints[to].x, cockpitPoints[from].y - cockpitPoints[to].y);
          return (
            <text
              key={`${from}-${to}`}
              x={cockpitPoints[to].x + 8}
              y={cockpitPoints[to].y + 18 + index * 12}
              data-connection-error={`${from}:${to}`}
              data-error-px={error.toFixed(6)}
            >
              {from} = {to} · Δ {error.toFixed(3)} px
            </text>
          );
        })}
        <text x={spacerLabelPoint.x - 6} y={spacerLabelPoint.y - 9}>Spacer {cockpit.userSpacerHeight} mm</text>
        <text x={stemLabelPoint.x} y={stemLabelPoint.y - 10}>Stem {cockpit.stemLength} mm / {signed(cockpit.stemAngle)}</text>
        <text x={cockpitPoints.HandlebarClampAnchor.x + 8} y={cockpitPoints.HandlebarClampAnchor.y + 16}>Effective Pitch {signed(cockpit.effectiveStemPitch)}</text>
      </g>
    </g>
  );
}

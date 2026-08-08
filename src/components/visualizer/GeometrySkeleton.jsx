const CONNECTIONS = [
  ["rearAxle", "bottomBracket"],
  ["rearAxle", "seatTubeTop"],
  ["bottomBracket", "seatTubeTop"],
  ["seatTubeTop", "headTubeTop"],
  ["bottomBracket", "headTubeBottom"],
  ["headTubeBottom", "headTubeTop"],
  ["headTubeBottom", "frontAxle"],
  ["seatTubeTop", "saddleAnchor"],
  ["headTubeTop", "stemAnchor"],
  ["stemAnchor", "stemEnd"],
  ["stemEnd", "handlebarAnchor"],
];

export function GeometrySkeleton({ anchors, project }) {
  const projected = Object.fromEntries(Object.entries(anchors).map(([key, point]) => [key, project(point)]));
  return (
    <g className="geometry-skeleton" aria-label="Geometry Skeleton Debug">
      {CONNECTIONS.map(([from, to]) => <line key={`${from}-${to}`} x1={projected[from].x} y1={projected[from].y} x2={projected[to].x} y2={projected[to].y} />)}
      {Object.entries(projected).map(([key, point]) => (
        <g key={key} className="geometry-skeleton__point">
          <circle cx={point.x} cy={point.y} r="4" />
          <text x={point.x + 6} y={point.y - 6}>{key}</text>
        </g>
      ))}
    </g>
  );
}

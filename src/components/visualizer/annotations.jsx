export function ContactPoint({ point, project, label, kind }) {
  const p = project(point);
  return (
    <g className={`contact-point contact-point--${kind}`}>
      <circle cx={p.x} cy={p.y} r={4.5} />
      <circle className="contact-point__halo" cx={p.x} cy={p.y} r={9} />
      <text x={p.x + 10} y={p.y - 9}>{label}</text>
    </g>
  );
}

export function DimensionLine({ start, end, label, value, orientation = "horizontal", project }) {
  const a = project(start);
  const b = project(end);
  const midX = (a.x + b.x) / 2;
  const midY = (a.y + b.y) / 2;
  return (
    <g className="dimension-line">
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
      {orientation === "horizontal" ? (
        <>
          <line x1={a.x} y1={a.y - 9} x2={a.x} y2={a.y + 9} />
          <line x1={b.x} y1={b.y - 9} x2={b.x} y2={b.y + 9} />
          <text x={midX} y={midY - 9} textAnchor="middle"><tspan>{label}</tspan><tspan dx="8" className="dimension-value">{value}</tspan></text>
        </>
      ) : (
        <>
          <line x1={a.x - 9} y1={a.y} x2={a.x + 9} y2={a.y} />
          <line x1={b.x - 9} y1={b.y} x2={b.x + 9} y2={b.y} />
          <text x={midX + 14} y={midY} dominantBaseline="middle"><tspan>{label}</tspan><tspan x={midX + 14} dy="17" className="dimension-value">{value}</tspan></text>
        </>
      )}
    </g>
  );
}

export function AngleIndicator({ point, project, value, label, align = "start" }) {
  const p = project(point);
  return (
    <g className="angle-label">
      <path d={`M ${p.x - 36} ${p.y} h 30 l -10 -30`} />
      <text x={align === "start" ? p.x : p.x - 8} y={p.y - 7} textAnchor={align}>{value}°</text>
      <text className="angle-label__name" x={p.x - 36} y={p.y + 20}>{label}</text>
    </g>
  );
}

export function RiderSkeleton({ points, project }) {
  const p = Object.fromEntries(Object.entries(points).map(([key, value]) => [key, project(value)]));
  return (
    <g className="rider-skeleton">
      <polyline points={`${p.hip.x},${p.hip.y} ${p.shoulder.x},${p.shoulder.y} ${p.elbow.x},${p.elbow.y} ${p.wrist.x},${p.wrist.y}`} />
      <polyline points={`${p.hip.x},${p.hip.y} ${p.knee.x},${p.knee.y} ${p.ankle.x},${p.ankle.y}`} />
      <line x1={p.shoulder.x} y1={p.shoulder.y} x2={p.hip.x} y2={p.hip.y} />
      {Object.entries(p).map(([key, point]) => <circle key={key} cx={point.x} cy={point.y} r={key === "shoulder" || key === "hip" ? 7 : 5} />)}
      <text x={p.elbow.x + 10} y={p.elbow.y - 8}>118°</text>
      <text x={p.knee.x + 10} y={p.knee.y + 4}>142°</text>
    </g>
  );
}

export function BikeCrankset({ frame, pedal, project }) {
  const bb = project(frame.bb);
  const p = project(pedal);
  const opposite = { x: bb.x - (p.x - bb.x) * 0.56, y: bb.y - (p.y - bb.y) * 0.56 };
  return (
    <g className="bike-crankset">
      <circle className="bike-crankset__ring bike-crankset__ring--outer" cx={bb.x} cy={bb.y} r="29" />
      <circle className="bike-crankset__ring bike-crankset__ring--inner" cx={bb.x} cy={bb.y} r="21" />
      {Array.from({ length: 5 }).map((_, index) => {
        const angle = (index * Math.PI * 2) / 5 - Math.PI / 2;
        return <line key={index} className="bike-crankset__spider" x1={bb.x} y1={bb.y} x2={bb.x + Math.cos(angle) * 20} y2={bb.y + Math.sin(angle) * 20} />;
      })}
      <circle className="bike-crankset__bolt" cx={bb.x} cy={bb.y} r="6" />
      <line className="bike-crankset__arm" x1={bb.x} y1={bb.y} x2={p.x} y2={p.y} />
      <line className="bike-crankset__arm bike-crankset__arm--rear" x1={bb.x} y1={bb.y} x2={opposite.x} y2={opposite.y} />
      <rect className="bike-crankset__pedal" x={p.x - 2} y={p.y - 14} width="6" height="31" rx="2" transform={`rotate(78 ${p.x} ${p.y})`} />
    </g>
  );
}

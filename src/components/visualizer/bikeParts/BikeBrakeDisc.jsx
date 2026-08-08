export function BikeBrakeDisc({ center, size = 18, side = "front" }) {
  return (
    <g className={`bike-brake bike-brake--${side}`}>
      <circle className="bike-brake__rotor" cx={center.x} cy={center.y} r={size} />
      <circle className="bike-brake__inner" cx={center.x} cy={center.y} r={size * 0.42} />
      {Array.from({ length: 10 }).map((_, index) => {
        const angle = (index * Math.PI * 2) / 10;
        return (
          <circle
            key={index}
            className="bike-brake__vent"
            cx={center.x + Math.cos(angle) * size * 0.7}
            cy={center.y + Math.sin(angle) * size * 0.7}
            r={1.4}
          />
        );
      })}
      <rect
        className="bike-brake__caliper"
        x={center.x + (side === "front" ? -17 : 10)}
        y={center.y - 16}
        width="9"
        height="14"
        rx="3"
        transform={`rotate(${side === "front" ? -18 : 16} ${center.x} ${center.y})`}
      />
    </g>
  );
}

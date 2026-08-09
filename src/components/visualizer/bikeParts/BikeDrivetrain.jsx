export function BikeDrivetrain({ frame, project }) {
  const bb = project(frame.bb);
  const rear = project(frame.rearAxle);
  const upperRear = { x: rear.x + 2, y: rear.y - 13 };
  const upperRing = { x: bb.x - 4, y: bb.y - 27 };
  const lowerRing = { x: bb.x - 4, y: bb.y + 27 };
  const jockeyTop = { x: rear.x - 4, y: rear.y + 29 };
  const jockeyBottom = { x: rear.x + 7, y: rear.y + 47 };
  return (
    <g className="bike-drivetrain">
      <path className="bike-drivetrain__chain" d={`M ${upperRear.x} ${upperRear.y} L ${upperRing.x} ${upperRing.y} A 27 27 0 0 1 ${lowerRing.x} ${lowerRing.y} L ${jockeyBottom.x} ${jockeyBottom.y}`} />
      <g className="bike-drivetrain__cassette">
        {[20, 16, 12, 8].map((radius) => <circle key={radius} cx={rear.x} cy={rear.y} r={radius} />)}
      </g>
      <path className="bike-drivetrain__derailleur" d={`M ${rear.x - 2} ${rear.y + 8} Q ${rear.x - 15} ${rear.y + 18} ${jockeyTop.x} ${jockeyTop.y} L ${jockeyBottom.x} ${jockeyBottom.y}`} />
      <circle className="bike-drivetrain__jockey" cx={jockeyTop.x} cy={jockeyTop.y} r="6" />
      <circle className="bike-drivetrain__jockey" cx={jockeyBottom.x} cy={jockeyBottom.y} r="6" />
      <path className="bike-drivetrain__cage" d={`M ${jockeyTop.x} ${jockeyTop.y} L ${jockeyBottom.x} ${jockeyBottom.y}`} />
    </g>
  );
}

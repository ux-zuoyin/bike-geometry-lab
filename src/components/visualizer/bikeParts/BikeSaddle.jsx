export function BikeSaddle({ saddle, project }) {
  const rail = project(saddle.rail);
  const nose = project(saddle.saddleNose);
  const tail = project(saddle.saddleTail);
  const topY = Math.min(tail.y, rail.y, nose.y) - 7;
  return (
    <g className="bike-saddle">
      <path
        className="bike-silhouette bike-saddle__shell"
        d={`M ${tail.x - 8} ${tail.y - 2}
            Q ${tail.x + 6} ${topY - 5} ${rail.x - 18} ${topY - 2}
            C ${rail.x + 14} ${topY - 1} ${nose.x - 20} ${topY + 2} ${nose.x + 4} ${nose.y}
            Q ${nose.x - 6} ${nose.y + 8} ${rail.x + 10} ${rail.y + 9}
            L ${tail.x + 5} ${tail.y + 8}
            Q ${tail.x - 5} ${tail.y + 5} ${tail.x - 8} ${tail.y - 2} Z`}
      />
      <path className="bike-saddle__rail" d={`M ${tail.x + 24} ${tail.y + 8} Q ${rail.x - 3} ${rail.y + 15} ${nose.x - 25} ${nose.y + 7}`} />
    </g>
  );
}

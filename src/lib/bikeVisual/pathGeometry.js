export function pointAlong(a, b, ratio) {
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio,
  };
}

export function unitNormal(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: -dy / length, y: dx / length };
}

export function offsetPoint(point, normal, amount) {
  return { x: point.x + normal.x * amount, y: point.y + normal.y * amount };
}

export function taperedTubePath(a, b, startWidth, endWidth = startWidth) {
  const normal = unitNormal(a, b);
  const a1 = offsetPoint(a, normal, startWidth / 2);
  const a2 = offsetPoint(a, normal, -startWidth / 2);
  const b1 = offsetPoint(b, normal, endWidth / 2);
  const b2 = offsetPoint(b, normal, -endWidth / 2);
  return `M ${a1.x} ${a1.y} L ${b1.x} ${b1.y} L ${b2.x} ${b2.y} L ${a2.x} ${a2.y} Z`;
}

export function projectedPoints(points, project) {
  return Object.fromEntries(Object.entries(points).map(([key, value]) => [key, project(value)]));
}

export function circlePoint(center, radius, angle) {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

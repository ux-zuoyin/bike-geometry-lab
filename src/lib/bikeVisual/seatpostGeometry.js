const distance = (start, end) => Math.hypot(end.x - start.x, end.y - start.y);

const addOffset = (point, offset) => ({
  x: point.x + offset.x,
  y: point.y + offset.y,
});

const difference = (end, start) => ({
  x: end.x - start.x,
  y: end.y - start.y,
});

export function getSeatpostVisualAnchors({
  bottomBracket,
  socketAnchor,
  saddleClampReference,
  saddleVisualReference,
  saddleContactReference,
}) {
  const socketVector = difference(socketAnchor, bottomBracket);
  const socketDistance = Math.hypot(socketVector.x, socketVector.y) || 1;
  const direction = {
    x: socketVector.x / socketDistance,
    y: socketVector.y / socketDistance,
  };
  const saddleHeight = distance(bottomBracket, saddleClampReference);
  const exposedLength = Math.max(0, saddleHeight - socketDistance);
  const seatpostTop = {
    x: socketAnchor.x + direction.x * exposedLength,
    y: socketAnchor.y + direction.y * exposedLength,
  };
  const saddleVisualOffset = difference(saddleVisualReference, saddleClampReference);
  const saddleContactOffset = difference(saddleContactReference, saddleClampReference);
  const socketFromAxis = Math.abs(
    (socketAnchor.x - bottomBracket.x) * (seatpostTop.y - bottomBracket.y)
      - (socketAnchor.y - bottomBracket.y) * (seatpostTop.x - bottomBracket.x),
  ) / Math.max(1, distance(bottomBracket, seatpostTop));

  return {
    direction,
    socketDistance,
    saddleHeight,
    exposedLength,
    axisError: socketFromAxis,
    seatpostBottom: socketAnchor,
    seatpostTop,
    saddleClampAnchor: seatpostTop,
    saddleVisualAnchor: addOffset(seatpostTop, saddleVisualOffset),
    saddleContactPoint: addOffset(seatpostTop, saddleContactOffset),
  };
}

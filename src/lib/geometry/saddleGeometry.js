export const SADDLE_CONTACT_OFFSET = { x: 12, y: 12 };

export function getSaddlePoints(frame, geometry, fit) {
  const seatTubeVector = {
    x: frame.seatTop.x - frame.bb.x,
    y: frame.seatTop.y - frame.bb.y,
  };
  const seatTubeLength = Math.hypot(seatTubeVector.x, seatTubeVector.y) || 1;
  const seatTubeDirection = {
    x: seatTubeVector.x / seatTubeLength,
    y: seatTubeVector.y / seatTubeLength,
  };
  const saddleClampAnchor = {
    x: frame.bb.x + seatTubeDirection.x * fit.saddleHeight,
    y: frame.bb.y + seatTubeDirection.y * fit.saddleHeight,
  };
  const setback = fit.saddleSetback + fit.seatpostOffset * 0.3;
  const saddleVisualAnchor = {
    x: saddleClampAnchor.x - setback,
    y: saddleClampAnchor.y,
  };
  const saddleContactPoint = {
    x: saddleVisualAnchor.x + SADDLE_CONTACT_OFFSET.x,
    y: saddleVisualAnchor.y + SADDLE_CONTACT_OFFSET.y,
  };
  return {
    setupAxisAngle: geometry.seatAngle,
    saddleHeight: fit.saddleHeight,
    setback,
    seatTubeDirection,
    saddleClampAnchor,
    saddleVisualAnchor,
    saddleContactPoint,
    rail: saddleClampAnchor,
    saddleNose: { x: saddleVisualAnchor.x + 92, y: saddleVisualAnchor.y + 4 },
    saddleTail: { x: saddleVisualAnchor.x - 56, y: saddleVisualAnchor.y + 11 },
    saddleContact: saddleContactPoint,
  };
}

const radians = (degrees) => (degrees * Math.PI) / 180;

export function getCockpitPoints(framePoints, geometry, fit) {
  const steer = radians(geometry.headAngle);
  const stem = radians(fit.stemAngle);
  const steererTop = {
    x: framePoints.headTop.x - fit.spacer * Math.cos(steer),
    y: framePoints.headTop.y + fit.spacer * Math.sin(steer),
  };
  const stemEnd = {
    x: steererTop.x + fit.stemLength * Math.cos(stem),
    y: steererTop.y + fit.stemLength * Math.sin(stem),
  };
  const hood = { x: stemEnd.x + 85, y: stemEnd.y + 5 };
  const drop = { x: stemEnd.x + 42, y: stemEnd.y - 96 };
  return { steererTop, stemEnd, hood, drop, handlebarContact: hood };
}

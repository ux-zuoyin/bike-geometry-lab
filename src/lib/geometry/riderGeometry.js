export function getRiderPoints(contacts, body) {
  const hip = { x: contacts.saddle.x + 8, y: contacts.saddle.y + 18 };
  const shoulder = { x: hip.x + body.torso * 3.3, y: hip.y + body.torso * 3.3 };
  const wrist = { x: contacts.handlebar.x, y: contacts.handlebar.y + 8 };
  const elbow = {
    x: shoulder.x + (wrist.x - shoulder.x) * 0.54,
    y: shoulder.y + (wrist.y - shoulder.y) * 0.43 + body.upperArm * 0.42,
  };
  const ankle = { x: contacts.pedal.x, y: contacts.pedal.y };
  const knee = {
    x: hip.x + (ankle.x - hip.x) * 0.55 + body.thigh * 1.8,
    y: hip.y + (ankle.y - hip.y) * 0.48,
  };
  return { hip, shoulder, elbow, wrist, knee, ankle };
}

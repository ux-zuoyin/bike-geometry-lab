import { getFramePoints } from "./frameGeometry.js";
import { getCockpitPoints } from "./cockpitGeometry.js";
import { getSaddlePoints } from "./saddleGeometry.js";
import { getPedalPoint } from "./contactPoints.js";

export function buildBikeGeometry(geometry, fit) {
  const frame = getFramePoints(geometry);
  const cockpit = getCockpitPoints(frame, geometry, fit);
  const saddle = getSaddlePoints(frame, geometry, fit);
  const pedal = getPedalPoint(fit);
  return {
    geometry,
    frame,
    cockpit,
    saddle,
    pedal,
    anchors: {
      bottomBracket: frame.bb,
      rearAxle: frame.rearAxle,
      frontAxle: frame.frontAxle,
      seatTubeTop: frame.seatTop,
      headTubeTop: frame.headTop,
      headTubeBottom: frame.headBottom,
      saddleAnchor: saddle.saddleClampAnchor,
      saddleClampAnchor: saddle.saddleClampAnchor,
      saddleVisualAnchor: saddle.saddleVisualAnchor,
      saddleContactPoint: saddle.saddleContactPoint,
      stemAnchor: cockpit.steererTop,
      stemEnd: cockpit.stemEnd,
      handlebarAnchor: cockpit.handlebarContact,
      pedalAnchor: pedal,
    },
    contacts: {
      saddle: saddle.saddleContactPoint,
      handlebar: cockpit.handlebarContact,
      pedal,
    },
  };
}

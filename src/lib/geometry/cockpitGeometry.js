import { getHandlebarContactOffsetMm } from "../bikeVisual/figmaEnduranceTemplate.js";

const radians = (degrees) => (degrees * Math.PI) / 180;

// The current Figma Cockpit's installed position is the visual/mechanical
// baseline. It is not user-selectable spacer height: the Fit Setup begins at
// 0 mm relative to this fixed stack.
export const BASE_COCKPIT_STACK_HEIGHT_MM = 45;
// Retained as a compatibility export for existing geometry consumers.
export const HEADSET_STACK_HEIGHT = BASE_COCKPIT_STACK_HEIGHT_MM;
const HANDLEBAR_CONTACT_FROM_CLAMP_MM = getHandlebarContactOffsetMm();
const HANDLEBAR_DROP_FROM_CLAMP_MM = Object.freeze({ x: 42, y: -96 });

export function getEffectiveStemPitch(headTubeAngle, stemAngle) {
  return 90 - headTubeAngle + stemAngle;
}

export function getCockpitPoints(framePoints, geometry, fit) {
  const headTubeAngle = radians(geometry.headAngle);
  const userSpacerHeight = fit.spacer;
  const baseCockpitStackHeight = BASE_COCKPIT_STACK_HEIGHT_MM;
  const totalSpacerStackHeight = baseCockpitStackHeight + userSpacerHeight;
  const steererUp = {
    x: -Math.cos(headTubeAngle),
    y: Math.sin(headTubeAngle),
  };
  const spacerHeadtubeAnchor = framePoints.headTop;
  const spacerTop = {
    x: spacerHeadtubeAnchor.x + steererUp.x * totalSpacerStackHeight,
    y: spacerHeadtubeAnchor.y + steererUp.y * totalSpacerStackHeight,
  };
  const stemSpacerAnchor = spacerTop;
  const effectiveStemPitch = getEffectiveStemPitch(geometry.headAngle, fit.stemAngle);
  const effectiveStemPitchRadians = radians(effectiveStemPitch);
  const stemHandlebarAnchor = {
    x: stemSpacerAnchor.x + fit.stemLength * Math.cos(effectiveStemPitchRadians),
    y: stemSpacerAnchor.y + fit.stemLength * Math.sin(effectiveStemPitchRadians),
  };
  const handlebarClampAnchor = stemHandlebarAnchor;

  // H comes from Figma's local hood-contact anchor, then follows the clamp.
  const hood = {
    x: handlebarClampAnchor.x + HANDLEBAR_CONTACT_FROM_CLAMP_MM.x,
    y: handlebarClampAnchor.y + HANDLEBAR_CONTACT_FROM_CLAMP_MM.y,
  };
  const drop = {
    x: handlebarClampAnchor.x + HANDLEBAR_DROP_FROM_CLAMP_MM.x,
    y: handlebarClampAnchor.y + HANDLEBAR_DROP_FROM_CLAMP_MM.y,
  };

  return {
    steererUp,
    headsetStackHeight: baseCockpitStackHeight,
    baseCockpitStackHeight,
    userSpacerHeight,
    totalSpacerStackHeight,
    stemLength: fit.stemLength,
    stemAngle: fit.stemAngle,
    effectiveStemPitch,
    spacerHeadtubeAnchor,
    spacerBottom: spacerHeadtubeAnchor,
    spacerTop,
    stemSpacerAnchor,
    stemHandlebarAnchor,
    handlebarClampAnchor,
    // Compatibility aliases for existing Fit Setup consumers.
    stemBase: stemSpacerAnchor,
    handlebarClamp: handlebarClampAnchor,
    // Compatibility aliases for the generic visual archetype.
    steererTop: stemSpacerAnchor,
    stemEnd: stemHandlebarAnchor,
    hood,
    drop,
    handlebarContact: hood,
  };
}

import { defaultFit } from "../data/bikes.js";

export const STEM_ANGLE_OPTIONS = Object.freeze([
  -17,
  -12,
  -10,
  -8,
  -6,
  0,
  6,
  7,
  8,
  10,
  12,
]);

export const DEFAULT_FIT_SETUP = Object.freeze({
  spacerHeight: 15,
  stemLength: 110,
  stemAngle: -12,
  saddleHeight: 738,
  saddleSetback: 8,
  crankLength: 170,
});

export function toGeometryFit(fitSetup) {
  return Object.freeze({
    ...defaultFit,
    spacer: fitSetup.spacerHeight,
    stemLength: fitSetup.stemLength,
    stemAngle: fitSetup.stemAngle,
    saddleHeight: fitSetup.saddleHeight,
    saddleSetback: fitSetup.saddleSetback,
    crankLength: fitSetup.crankLength,
  });
}

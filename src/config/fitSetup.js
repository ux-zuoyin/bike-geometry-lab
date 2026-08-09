import { defaultFit } from "../data/bikes.js";

export const DEFAULT_FIT_SETUP = Object.freeze({
  spacerHeight: defaultFit.spacer,
  stemLength: defaultFit.stemLength,
  stemAngle: defaultFit.stemAngle,
  saddleHeight: defaultFit.saddleHeight,
  saddleSetback: defaultFit.saddleSetback,
  crankLength: defaultFit.crankLength,
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

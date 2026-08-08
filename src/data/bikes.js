export {
  bikeCatalog,
  bikeGeometryByModel,
  geometrySizes,
  getTrekDomaneSize,
  toBikeGeometry,
  trekDomane,
  trekDomaneGeometryBySize,
} from "./trekDomaneGeometry.js";

export const defaultFit = {
  spacer: 15,
  stemLength: 90,
  stemAngle: 6,
  saddleHeight: 748,
  saddleSetback: 8,
  seatpostOffset: 15,
  crankLength: 172.5,
  body: {
    height: 178,
    torso: 58,
    upperArm: 32,
    forearm: 27,
    thigh: 43,
    lowerLeg: 42,
    inseam: 83,
  },
};

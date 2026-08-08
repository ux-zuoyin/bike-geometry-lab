import { BikeWheelBase } from "./BikeWheelBase.jsx";

export function BikeWheelFront({ point, project, preset }) {
  return <BikeWheelBase center={project(point)} preset={preset} side="front" />;
}

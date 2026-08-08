import { BikeWheelBase } from "./BikeWheelBase.jsx";

export function BikeWheelRear({ point, project, preset }) {
  return <BikeWheelBase center={project(point)} preset={preset} side="rear" />;
}

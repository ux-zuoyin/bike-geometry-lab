import { BikeWheelFront } from "./BikeWheelFront.jsx";
import { BikeWheelRear } from "./BikeWheelRear.jsx";
import { BikeFrame } from "./BikeFrame.jsx";
import { BikeFork } from "./BikeFork.jsx";
import { BikeCockpit } from "./BikeCockpit.jsx";
import { BikeSeatpost } from "./BikeSeatpost.jsx";
import { BikeSaddle } from "./BikeSaddle.jsx";
import { BikeCrankset } from "./BikeCrankset.jsx";
import { BikeDrivetrain } from "./BikeDrivetrain.jsx";
import { EnduranceBikeTemplate } from "../../bike/templates/EnduranceBikeTemplate.jsx";

export function RoadBikeVisual({
  data,
  project,
  preset,
  showFigmaAnchors = false,
  showContactPoints = true,
  componentSetup,
  motionStopped = false,
  frameOnly = false,
}) {
  if (preset.id === "endurance") {
    return (
      <EnduranceBikeTemplate
        data={data}
        project={project}
        showFigmaAnchors={showFigmaAnchors}
        showContactPoints={showContactPoints}
        componentSetup={componentSetup}
        motionStopped={motionStopped}
        frameOnly={frameOnly}
      />
    );
  }

  return (
    <g className={`road-bike road-bike--${preset.id}`}>
      <g className="road-bike__rear-layer">
        <BikeWheelRear point={data.frame.rearAxle} project={project} preset={preset} />
        <BikeWheelFront point={data.frame.frontAxle} project={project} preset={preset} />
      </g>
      <BikeFork points={data.frame} project={project} preset={preset} />
      <BikeFrame points={data.frame} project={project} preset={preset} />
      <BikeSeatpost frame={data.frame} saddle={data.saddle} project={project} preset={preset} />
      <BikeSaddle saddle={data.saddle} project={project} />
      <BikeCockpit points={data.cockpit} project={project} preset={preset} />
      <BikeDrivetrain frame={data.frame} project={project} />
      <BikeCrankset frame={data.frame} pedal={data.pedal} project={project} />
    </g>
  );
}

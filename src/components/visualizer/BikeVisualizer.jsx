import { useEffect, useMemo, useRef, useState } from "react";
import { CornersIn, CornersOut } from "@phosphor-icons/react";
import { buildBikeGeometry } from "../../lib/geometry/index.js";
import {
  BIKE_STAGE_VIEWBOX_HEIGHT,
  BIKE_STAGE_VIEWBOX_WIDTH,
  getBikeStageGroundAlignment,
} from "../../lib/bikeVisual/stageGroundAlignment.js";
import {
  PIXELS_PER_MM,
  REFERENCE_WHEEL_OUTER_DIAMETER_MM,
  RENDERED_WHEEL_DIAMETER_PX,
  WHEEL_RADIUS,
  createProjector,
} from "../../lib/geometry/frameGeometry.js";
import { bikeArchetypes } from "../../config/bikeArchetypes.js";
import { Switch } from "../ui/Stepper.jsx";
import { RoadBikeVisual } from "./bikeParts/RoadBikeVisual.jsx";
import { GeometrySkeleton } from "./GeometrySkeleton.jsx";
import { AngleIndicator, ContactPoint, DimensionLine } from "./annotations.jsx";

const IS_DEVELOPMENT = import.meta.env.DEV;
const REFLECTION_OPACITY = 0.2;
const REFLECTION_GAP_PX = 2;

function BikeVisualOnly({ data, projector, componentSetup, motionStopped }) {
  return (
    <RoadBikeVisual
      data={data}
      project={projector}
      preset={bikeArchetypes.endurance}
      showFigmaAnchors={false}
      showContactPoints={false}
      componentSetup={componentSetup}
      motionStopped={motionStopped}
    />
  );
}

function BikeLayer({ data, projector, showSkeleton, showFigmaAnchors, componentSetup, motionStopped }) {
  return (
    <g className="bike-layer bike-layer--primary">
      <RoadBikeVisual data={data} project={projector} preset={bikeArchetypes.endurance} showFigmaAnchors={showFigmaAnchors} componentSetup={componentSetup} motionStopped={motionStopped} />
      {showSkeleton && <GeometrySkeleton anchors={data.anchors} cockpit={data.cockpit} project={projector} />}
      <ContactPoint point={data.contacts.saddle} project={projector} label="S" kind="saddle" />
    </g>
  );
}

export function BikeVisualizer({ bike, fit, componentSetup, isStageFullscreen, onToggleStageFullscreen }) {
  const [showDimensions, setShowDimensions] = useState(true);
  const [isMotionStopped, setIsMotionStopped] = useState(false);
  const debugParams = IS_DEVELOPMENT ? new URLSearchParams(window.location.search) : null;
  const showSkeleton = debugParams?.has("geometrySkeleton") ?? false;
  const showFigmaAnchors = debugParams?.has("figmaAnchors") ?? false;
  const canvasWrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [stageSize, setStageSize] = useState({
    width: BIKE_STAGE_VIEWBOX_WIDTH,
    height: BIKE_STAGE_VIEWBOX_HEIGHT,
  });
  const data = useMemo(() => buildBikeGeometry(bike.geometry, fit), [bike.geometry, fit]);
  const project = useMemo(() => createProjector(), []);
  const wheelbaseY = bike.geometry.bbDrop - WHEEL_RADIUS - 44;
  const rearAxle = project(data.frame.rearAxle);
  const frontAxle = project(data.frame.frontAxle);
  const wheelOuterRadius = RENDERED_WHEEL_DIAMETER_PX / 2;
  const bikeGroundY = rearAxle.y + wheelOuterRadius;
  const frontWheelBottomY = frontAxle.y + wheelOuterRadius;
  const groundAlignment = getBikeStageGroundAlignment({
    bikeGroundY,
    stageWidth: stageSize.width,
    stageHeight: stageSize.height,
  });
  const reflectionGap = REFLECTION_GAP_PX / groundAlignment.stageScale;
  const reflectionTransform = [
    `translate(0 ${reflectionGap})`,
    `translate(0 ${groundAlignment.stageGroundY})`,
    "scale(1 -1)",
    `translate(0 ${-groundAlignment.stageGroundY})`,
    `translate(0 ${groundAlignment.stageTranslateY})`,
  ].join(" ");

  useEffect(() => {
    const stage = canvasWrapRef.current;
    if (!stage) return undefined;

    const updateStageSize = () => {
      const { width, height } = stage.getBoundingClientRect();
      setStageSize((current) => (
        Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5
          ? current
          : { width, height }
      ));
    };

    updateStageSize();
    const resizeObserver = new ResizeObserver(updateStageSize);
    resizeObserver.observe(stage);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isMotionStopped) canvas.pauseAnimations?.();
    else canvas.unpauseAnimations?.();
  }, [isMotionStopped]);

  return (
    <section className="visualizer" aria-label="Trek Domane 自行车几何可视化">
      <div className="visualizer__header">
        <div className="bike-title">
          <h1><span>{bike.brand.toUpperCase()}</span> <strong>{bike.model}</strong> · {bike.size}码</h1>
          <p>Stack {bike.geometry.stack} mm <span /> Reach {bike.geometry.reach} mm</p>
        </div>
        <button
          type="button"
          className="stage-fullscreen-control"
          aria-pressed={isStageFullscreen}
          onClick={onToggleStageFullscreen}
        >
          {isStageFullscreen ? <CornersIn size={18} /> : <CornersOut size={18} />}
          <span>{isStageFullscreen ? "退出全屏" : "全屏观看"}</span>
        </button>
      </div>

      <div className="canvas-wrap" ref={canvasWrapRef}>
        <svg
          className="bike-canvas"
          ref={canvasRef}
          viewBox="0 0 980 620"
          role="img"
          aria-label={`${bike.brand} ${bike.model} ${bike.size} 自行车几何图`}
          data-motion-stopped={isMotionStopped}
          data-reference-wheel-diameter-mm={REFERENCE_WHEEL_OUTER_DIAMETER_MM}
          data-rendered-wheel-diameter-px={RENDERED_WHEEL_DIAMETER_PX}
          data-pixels-per-mm={PIXELS_PER_MM.toFixed(9)}
          data-wheelbase-wheel-ratio={(bike.geometry.wheelbase / REFERENCE_WHEEL_OUTER_DIAMETER_MM).toFixed(6)}
          data-stage-ground-y={groundAlignment.stageGroundY.toFixed(3)}
          data-stage-ground-y-px={groundAlignment.stageGroundYPx.toFixed(3)}
          data-bike-ground-y={bikeGroundY.toFixed(3)}
          data-front-wheel-bottom-y={frontWheelBottomY.toFixed(3)}
          data-stage-translate-y={groundAlignment.stageTranslateY.toFixed(3)}
          data-reflection-opacity={REFLECTION_OPACITY}
          data-reflection-scale-y="-1"
          data-reflection-gap-px={REFLECTION_GAP_PX}
        >
          <g
            className="bike-reflection"
            aria-hidden="true"
            opacity={REFLECTION_OPACITY}
            transform={reflectionTransform}
            data-reflection-source="BikeVisualOnly"
            data-reflection-transform="scaleY(-1)"
          >
            <BikeVisualOnly
              data={data}
              projector={project}
              componentSetup={componentSetup}
              motionStopped={isMotionStopped}
            />
          </g>

          <g className="stage-content" transform={`translate(0 ${groundAlignment.stageTranslateY})`}>
            <BikeLayer
              data={data}
              projector={project}
              showSkeleton={IS_DEVELOPMENT && showSkeleton}
              showFigmaAnchors={IS_DEVELOPMENT && showFigmaAnchors}
              componentSetup={componentSetup}
              motionStopped={isMotionStopped}
            />

            {showDimensions && (
              <g className="dimensions">
                <DimensionLine
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: bike.geometry.stack }}
                  label="STACK"
                  value={`${bike.geometry.stack} mm`}
                  orientation="vertical"
                  project={project}
                />
                <DimensionLine
                  start={{ x: 0, y: bike.geometry.stack + 64 }}
                  end={{ x: bike.geometry.reach, y: bike.geometry.stack + 64 }}
                  label="REACH"
                  value={`${bike.geometry.reach} mm`}
                  project={project}
                />
                <DimensionLine
                  start={{ x: data.frame.rearAxle.x, y: wheelbaseY }}
                  end={{ x: data.frame.frontAxle.x, y: wheelbaseY }}
                  label="WHEELBASE"
                  value={`${bike.geometry.wheelbase} mm`}
                  project={project}
                />
                <AngleIndicator
                  point={{ x: data.frame.seatTop.x - 150, y: data.frame.seatTop.y - 95 }}
                  value={bike.geometry.seatAngle.toFixed(1)}
                  label="SEAT TUBE"
                  project={project}
                />
                <AngleIndicator
                  point={{ x: data.frame.headTop.x + 245, y: data.frame.headBottom.y - 105 }}
                  value={bike.geometry.headAngle.toFixed(1)}
                  label="HEAD TUBE"
                  align="end"
                  project={project}
                />
              </g>
            )}
            {IS_DEVELOPMENT && (
              <g className="bb-origin">
                <circle cx="430" cy="420" r="4" />
                <line x1="408" y1="420" x2="422" y2="420" />
                <line x1="430" y1="428" x2="430" y2="442" />
                <text x="400" y="449">BB 0,0</text>
              </g>
            )}
          </g>
        </svg>
        <div className="canvas-tools" aria-label="画布显示控制">
          <Switch label="显示尺寸" checked={showDimensions} onChange={setShowDimensions} />
          <Switch label="停止动画" checked={isMotionStopped} onChange={setIsMotionStopped} />
        </div>
      </div>
    </section>
  );
}

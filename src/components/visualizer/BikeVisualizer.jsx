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
import { resolveFrameVisualPreset } from "../../config/bikeArchetypes.js";
import { resolveComponentSetup } from "../../config/bikeComponents.js";
import { toGeometryFit } from "../../config/fitSetup.js";
import { getRenderableComponentSetup } from "../../state/dualBikeState.js";
import { DualBikeControls } from "../comparison/DualBikeControls.jsx";
import { PresetExperienceControls } from "../preset/PresetExperienceControls.jsx";
import { Switch } from "../ui/Stepper.jsx";
import { FullscreenGeometrySummary } from "./FullscreenGeometrySummary.jsx";
import { RoadBikeVisual } from "./bikeParts/RoadBikeVisual.jsx";
import { GeometrySkeleton } from "./GeometrySkeleton.jsx";
import { AngleIndicator, ContactPoint, DimensionLine } from "./annotations.jsx";

const IS_DEVELOPMENT = import.meta.env.DEV;
const REFLECTION_OPACITY = 0.2;
const REFLECTION_GAP_PX = 2;
const getBikeVisualSourceId = (bikeId) => `bike-visual-source-${bikeId}`;

function useBikeRenderModel(bike) {
  return useMemo(() => {
    if (!bike) return null;
    const fit = toGeometryFit(bike.fitSetup);
    return {
      bike,
      data: buildBikeGeometry(bike.geometry, fit),
      componentSetup: resolveComponentSetup(getRenderableComponentSetup(bike)),
    };
  }, [bike]);
}

function BikeRenderer({ model, projector, showSkeleton, showFigmaAnchors, motionStopped, opacity, isPrimary, frameOnly }) {
  const { bike, data, componentSetup } = model;
  const sourceId = getBikeVisualSourceId(bike.id);
  const frameVisualPreset = resolveFrameVisualPreset(bike.category);
  return (
    <g
      className={`bike-layer bike-layer--${isPrimary ? "primary" : "secondary"}`}
      opacity={opacity}
      data-bike-renderer={bike.id}
      data-bike-opacity={opacity}
    >
      <g id={sourceId} data-bike-visual-source={bike.id}>
        <RoadBikeVisual data={data} project={projector} preset={frameVisualPreset} showFigmaAnchors={showFigmaAnchors} showContactPoints={!frameOnly} componentSetup={componentSetup} motionStopped={motionStopped} frameOnly={frameOnly} seatStayStyle={bike.seatStayStyle} />
      </g>
      {showSkeleton && <GeometrySkeleton anchors={data.anchors} cockpit={data.cockpit} project={projector} />}
      {!frameOnly && <ContactPoint point={data.contacts.saddle} project={projector} label="S" kind="saddle" />}
    </g>
  );
}

function GeometryPreviewReference({ point, label, project }) {
  const projected = project(point);
  return (
    <g className="geometry-preview-reference" transform={`translate(${projected.x} ${projected.y})`} aria-label={label}>
      <circle r="8" />
      <circle r="2.5" className="geometry-preview-reference__dot" />
      <line x1="-12" y1="0" x2="-5" y2="0" />
      <line x1="5" y1="0" x2="12" y2="0" />
      <line x1="0" y1="-12" x2="0" y2="-5" />
      <line x1="0" y1="5" x2="0" y2="12" />
      <text x="12" y="-11">{label}</text>
    </g>
  );
}

export function BikeVisualizer({
  bikes,
  demoBike,
  presetExperienceMode = false,
  presetExperienceBikes = [],
  activePresetBikeId,
  activeBikeIndex,
  stagePreviewBike,
  frameOnly = false,
  geometryImportMode = false,
  geometryImportPreviewReady = false,
  geometryImportPreviewIssues = [],
  compareEnabled,
  onActiveBikeChange,
  onCompareEnabledChange,
  onAddBike,
  onManageBike,
  onPresetBikeChange,
  onRequestPresetComparison,
  isStageFullscreen,
  onToggleStageFullscreen,
}) {
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
  const renderBikes = stagePreviewBike
    ? [stagePreviewBike]
    : (geometryImportMode ? [] : (presetExperienceMode ? [demoBike] : (bikes.length ? bikes : [demoBike])));
  const safeActiveIndex = activeBikeIndex != null && renderBikes[activeBikeIndex] ? activeBikeIndex : 0;
  const firstModel = useBikeRenderModel(renderBikes[0]);
  const secondModel = useBikeRenderModel(renderBikes[1] ?? renderBikes[0]);
  const renderModelList = [firstModel, secondModel];
  const primaryModel = renderModelList[safeActiveIndex];
  const secondaryModel = renderModelList[safeActiveIndex === 0 ? 1 : 0];
  const hasRenderablePreview = Boolean(primaryModel);
  const isComparisonVisible = !presetExperienceMode && hasRenderablePreview && bikes.length === 2 && compareEnabled;
  const renderModels = isComparisonVisible ? [secondaryModel, primaryModel] : [primaryModel];
  const bike = primaryModel?.bike ?? null;
  const data = primaryModel?.data ?? null;
  const primarySourceId = bike ? getBikeVisualSourceId(bike.id) : "";
  const project = useMemo(() => createProjector(), []);
  const wheelbaseY = bike ? bike.geometry.bbDrop - WHEEL_RADIUS - 44 : 0;
  const rearAxle = data ? project(data.frame.rearAxle) : null;
  const frontAxle = data ? project(data.frame.frontAxle) : null;
  const wheelOuterRadius = RENDERED_WHEEL_DIAMETER_PX / 2;
  const bikeGroundY = rearAxle ? rearAxle.y + wheelOuterRadius : 0;
  const frontWheelBottomY = frontAxle ? frontAxle.y + wheelOuterRadius : 0;
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
  const previewIssueLabels = geometryImportPreviewIssues.map(({ label }) => label);
  const previewIncompleteMessage = previewIssueLabels.length > 0 && previewIssueLabels.length <= 3
    ? `补充 ${previewIssueLabels.join("、")} 后将自动生成预览。`
    : "补充关键几何数据后将自动生成预览。";

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
    <section className="visualizer" aria-label={bike ? `${bike.brand} ${bike.model} 自行车几何可视化` : "自行车几何可视化"}>
      <div className="visualizer__header">
        {geometryImportMode ? (
          <div className="geometry-preview-heading" aria-label="Geometry Import Mode">
            <strong>Geometry Preview</strong>
            <span>{geometryImportPreviewReady
              ? "仅预览 Frame + Fork · 修改参数后实时更新"
              : "部分几何数据需要确认，预览暂未完全生成。"}</span>
          </div>
        ) : presetExperienceMode ? (
          <PresetExperienceControls
            presets={presetExperienceBikes}
            activePresetBikeId={activePresetBikeId}
            onPresetBikeChange={onPresetBikeChange}
            onRequestComparison={onRequestPresetComparison}
          />
        ) : (
          <DualBikeControls
            bikes={bikes}
            activeBikeIndex={activeBikeIndex}
            compareEnabled={compareEnabled}
            onActiveBikeChange={onActiveBikeChange}
            onCompareEnabledChange={onCompareEnabledChange}
            onAddBike={onAddBike}
            onManageBike={onManageBike}
          />
        )}
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
          aria-label={bike ? `${bike.brand} ${bike.model} ${bike.size} 自行车几何图` : "几何数据待补充"}
          data-motion-stopped={isMotionStopped}
          data-reference-wheel-diameter-mm={REFERENCE_WHEEL_OUTER_DIAMETER_MM}
          data-rendered-wheel-diameter-px={RENDERED_WHEEL_DIAMETER_PX}
          data-pixels-per-mm={PIXELS_PER_MM.toFixed(9)}
          data-wheelbase-wheel-ratio={bike ? (bike.geometry.wheelbase / REFERENCE_WHEEL_OUTER_DIAMETER_MM).toFixed(6) : undefined}
          data-stage-ground-y={groundAlignment.stageGroundY.toFixed(3)}
          data-stage-ground-y-px={groundAlignment.stageGroundYPx.toFixed(3)}
          data-bike-ground-y={bikeGroundY.toFixed(3)}
          data-front-wheel-bottom-y={frontWheelBottomY.toFixed(3)}
          data-stage-translate-y={groundAlignment.stageTranslateY.toFixed(3)}
          data-reflection-opacity={REFLECTION_OPACITY}
          data-reflection-scale-y="-1"
          data-reflection-gap-px={REFLECTION_GAP_PX}
        >
          {!geometryImportMode && hasRenderablePreview && <g
            className="bike-reflection"
            aria-hidden="true"
            opacity={REFLECTION_OPACITY}
            transform={reflectionTransform}
            data-reflection-source="shared-bike-visual-use"
            data-reflection-transform="scaleY(-1)"
          >
            <use
              href={`#${primarySourceId}`}
              style={{
                "--bike-contact-opacity": 0,
                "--bike-debug-opacity": 0,
              }}
              data-reflection-instance="shared-animation-timeline"
            />
          </g>}

          {hasRenderablePreview && <g className="stage-content" transform={`translate(0 ${groundAlignment.stageTranslateY})`}>
            {renderModels.map((model) => {
              const isPrimary = model.bike.id === primaryModel.bike.id;
              return (
                <BikeRenderer
                  key={model.bike.id}
                  model={model}
                  projector={project}
                  showSkeleton={IS_DEVELOPMENT && showSkeleton && isPrimary}
                  showFigmaAnchors={IS_DEVELOPMENT && showFigmaAnchors && isPrimary}
                  motionStopped={isMotionStopped}
                  opacity={isPrimary ? 1 : 0.28}
                  isPrimary={isPrimary}
                  frameOnly={frameOnly}
                />
              );
            })}

            {geometryImportMode && (
              <g className="geometry-preview-references" aria-label="几何参考点">
                <GeometryPreviewReference point={data.frame.bb} label="BB" project={project} />
                <GeometryPreviewReference point={data.frame.rearAxle} label="Rear Axle" project={project} />
                <GeometryPreviewReference point={data.frame.frontAxle} label="Front Axle" project={project} />
              </g>
            )}

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
            {IS_DEVELOPMENT && !geometryImportMode && (
              <g className="bb-origin">
                <circle cx="430" cy="420" r="4" />
                <line x1="408" y1="420" x2="422" y2="420" />
                <line x1="430" y1="428" x2="430" y2="442" />
                <text x="400" y="449">BB 0,0</text>
              </g>
            )}
          </g>}
        </svg>
        {geometryImportMode && !hasRenderablePreview && <div className="geometry-preview-empty" role="status">
          <strong>部分几何数据需要确认</strong>
          <span>{previewIncompleteMessage}</span>
        </div>}
        {hasRenderablePreview && <div className="canvas-tools" aria-label="画布显示控制">
          <Switch label="显示尺寸" checked={showDimensions} onChange={setShowDimensions} />
          {!geometryImportMode && <Switch label="停止动画" checked={isMotionStopped} onChange={setIsMotionStopped} />}
        </div>}
      </div>
      {!geometryImportMode && (
        <FullscreenGeometrySummary
          bikes={presetExperienceMode ? [demoBike] : bikes}
          activeBikeIndex={presetExperienceMode ? 0 : activeBikeIndex}
          compareEnabled={presetExperienceMode ? false : compareEnabled}
          visible={isStageFullscreen}
        />
      )}
    </section>
  );
}

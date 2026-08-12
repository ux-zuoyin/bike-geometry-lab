import { useId } from "react";
import brakeDisc from "../../../assets/bikeTemplates/endurance/brake-disc.svg";
import seatpost from "../../../assets/bikeTemplates/endurance/seatpost.svg";
import saddle from "../../../assets/bikeTemplates/endurance/saddle.svg";
import spacer from "../../../assets/bikeTemplates/endurance/spacer.svg";
import handlebarHood from "../../../assets/bikeTemplates/endurance/handlebar-hood.svg";
import handlebarTapeSource from "../../../assets/bikeTemplates/endurance/handlebar-tape.svg?raw";
import forkSource from "../../../assets/bikeTemplates/endurance/fork.svg?raw";
import allRoundForkSource from "../../../assets/bikeTemplates/allRound/fork.svg?raw";
import frameDownTubeSource from "../../../assets/bikeTemplates/endurance/frame-down-tube.svg?raw";
import allRoundFrameDownTubeSource from "../../../assets/bikeTemplates/allRound/frame-down-tube.svg?raw";
import frameTopTubeSource from "../../../assets/bikeTemplates/endurance/frame-top-tube.svg?raw";
import frameHeadTubeSource from "../../../assets/bikeTemplates/endurance/frame-head-tube.svg?raw";
import allRoundFrameHeadTubeSource from "../../../assets/bikeTemplates/allRound/frame-head-tube.svg?raw";
import frameChainstaySource from "../../../assets/bikeTemplates/endurance/frame-chainstay.svg?raw";
import allRoundFrameChainstaySource from "../../../assets/bikeTemplates/allRound/frame-chainstay.svg?raw";
import frameSeatstaySource from "../../../assets/bikeTemplates/endurance/frame-seatstay.svg?raw";
import allRoundFrameSeatstaySource from "../../../assets/bikeTemplates/allRound/frame-seatstay.svg?raw";
import frameSeatTubeSource from "../../../assets/bikeTemplates/endurance/frame-seat-tube.svg?raw";
import frameBottomBracketSource from "../../../assets/bikeTemplates/endurance/frame-bottom-bracket.svg?raw";
import allRoundFrameBottomBracketSource from "../../../assets/bikeTemplates/allRound/frame-bottom-bracket.svg?raw";
import allRoundSeatpost from "../../../assets/bikeTemplates/allRound/seatpost.svg";
import allRoundSpacer from "../../../assets/bikeTemplates/allRound/spacer.svg";
import allRoundHandlebarHood from "../../../assets/bikeTemplates/allRound/handlebar-hood.svg";
import allRoundHandlebarTapeSource from "../../../assets/bikeTemplates/allRound/handlebar-tape.svg?raw";
import aeroForkSource from "../../../assets/bikeTemplates/aero/fork.svg?raw";
import aeroFrameChainstaySource from "../../../assets/bikeTemplates/aero/frame-chainstay.svg?raw";
import aeroFrameSeatstaySource from "../../../assets/bikeTemplates/aero/frame-seatstay.svg?raw";
import aeroFrameBottomBracketSource from "../../../assets/bikeTemplates/aero/frame-bottom-bracket.svg?raw";
import aeroSeatpost from "../../../assets/bikeTemplates/aero/seatpost.svg";
import aeroSpacer from "../../../assets/bikeTemplates/aero/spacer.svg";
import aeroHandlebarHood from "../../../assets/bikeTemplates/aero/handlebar-hood.svg";
import aeroHandlebarTapeSource from "../../../assets/bikeTemplates/aero/handlebar-tape.svg?raw";
import chain from "../../../assets/bikeTemplates/endurance/chain.svg";
import {
  FIGMA_ENDURANCE_TEMPLATE,
  affineFromThreePoints,
  applyMatrix,
  composeMatrices,
  matrixValue,
  orientedSegmentTransform,
  resolveEnduranceSeatStayAnchor,
  resolveAssetAnchor,
  similarityFromTwoPoints,
  uniformAroundPoint,
} from "../../../lib/bikeVisual/figmaEnduranceTemplate.js";
import {
  FIGMA_ALL_ROUND_TEMPLATE,
  resolveAllRoundAssetAnchor,
} from "../../../lib/bikeVisual/figmaAllRoundTemplate.js";
import {
  FIGMA_AERO_TEMPLATE,
  resolveAeroAssetAnchor,
} from "../../../lib/bikeVisual/figmaAeroTemplate.js";
import {
  AERO_VISUAL_CONFIG,
  getAeroDownTubeShape,
  getAeroSeatTubeVisualTop,
  getAeroVisualAnchors,
} from "../../../lib/bikeVisual/aeroFrameGeometry.js";
import { getSeatpostVisualAnchors } from "../../../lib/bikeVisual/seatpostGeometry.js";
import {
  ALL_ROUND_SEAT_TUBE_BOTTOM_SOURCE_HALF_WIDTH_PX,
  ALL_ROUND_SEAT_TUBE_TOP_SOURCE_HALF_WIDTH_PX,
  getAllRoundSeatTubeShape,
} from "../../../lib/bikeVisual/seatTubeGeometry.js";
import {
  ALL_ROUND_DOWN_TUBE_MASK_CLEARANCE_PX,
  ALL_ROUND_DOWN_TUBE_MIN_WHEEL_CLEARANCE_PX,
  getDownTubeVisualJoints,
} from "../../../lib/bikeVisual/downTubeGeometry.js";
import {
  ALL_ROUND_HEAD_TUBE_SOURCE_HALF_WIDTH_PX,
  ALL_ROUND_TOP_TUBE_HEAD_SOURCE_HALF_WIDTH_PX,
  ALL_ROUND_TOP_TUBE_SEAT_SOURCE_HALF_WIDTH_PX,
  TOP_TUBE_VISUAL_REFERENCES,
  fitTopTubeJointsToHeadTubeBoundary,
  getAllRoundTopTubeShape,
  getTopTubeVisualJoints,
  pointLineDistance,
} from "../../../lib/bikeVisual/topTubeGeometry.js";
import {
  PREVIEW_MOTION_CONFIG,
  getRotationAnimation,
  oppositePointAround,
} from "../../../lib/bikeVisual/previewMotion.js";
import { RENDERED_WHEEL_DIAMETER_PX, getFramePoints } from "../../../lib/geometry/frameGeometry.js";
import {
  ENDURANCE_VISUAL_BASE_GEOMETRY,
  ENDURANCE_VISUAL_BASE_SIZE,
  getEnduranceVisualDelta,
} from "../../../data/enduranceGeometry.js";
import { DEFAULT_COMPONENT_SETUP, resolveComponentSetup } from "../../../config/bikeComponents.js";
import { normalizeEnduranceSeatStayStyle } from "../../../config/framePresets/endurance.js";

const { anchors: sourceAnchors, layers } = FIGMA_ENDURANCE_TEMPLATE;
const { anchors: allRoundSourceAnchors, layers: allRoundLayers } = FIGMA_ALL_ROUND_TEMPLATE;
const { anchors: aeroSourceAnchors, layers: aeroLayers } = FIGMA_AERO_TEMPLATE;
const wheelDiameter = RENDERED_WHEEL_DIAMETER_PX;
const figmaShapeScale = wheelDiameter / layers.rearWheel.width;
const BASE_CRANK_LENGTH_MM = 172.5;
const PROGRAMMATIC_STEM_THICKNESS_PX = 18;
const PROGRAMMATIC_STEM_CORNER_RADIUS_PX = 4;
const PROGRAMMATIC_STEM_LEFT_OVERLAP_PX = 12;
const FORK_HEAD_GAP_PX = 6;
const colorizedAssetCache = new Map();
const assetAnchors = Object.fromEntries(
  Object.keys(FIGMA_ENDURANCE_TEMPLATE.assetAnchors).map((name) => [
    name,
    resolveAssetAnchor(FIGMA_ENDURANCE_TEMPLATE, name),
  ]),
);
const allRoundAssetAnchors = Object.fromEntries(
  Object.keys(FIGMA_ALL_ROUND_TEMPLATE.assetAnchors).map((name) => [
    name,
    resolveAllRoundAssetAnchor(name),
  ]),
);
const aeroAssetAnchors = Object.fromEntries(
  Object.keys(FIGMA_AERO_TEMPLATE.assetAnchors).map((name) => [
    name,
    resolveAeroAssetAnchor(name),
  ]),
);

const identityMatrixError = (matrix) => Math.max(
  Math.abs(matrix.a - 1),
  Math.abs(matrix.b),
  Math.abs(matrix.c),
  Math.abs(matrix.d - 1),
  Math.abs(matrix.e),
  Math.abs(matrix.f),
);

function colorizedSvgAsset(source, sourceFill, color) {
  const cacheKey = `${sourceFill}:${color}:${source}`;
  if (colorizedAssetCache.has(cacheKey)) return colorizedAssetCache.get(cacheKey);
  const colorizedSource = source.replaceAll(`fill="${sourceFill}"`, `fill="${color}"`);
  const asset = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(colorizedSource)}`;
  colorizedAssetCache.set(cacheKey, asset);
  return asset;
}

function TemplateAsset({ asset, layer, transform, className, renderLayer }) {
  return (
    <image
      href={asset}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      preserveAspectRatio="none"
      transform={transform ? matrixValue(transform) : undefined}
      className={className}
      data-figma-node-id={layer.figmaNodeId ?? layer.nodeId}
      data-render-layer={renderLayer}
    />
  );
}

function ResourceLayer({ layer, box, transform, className }) {
  if (layer.shape?.type === "rect") {
    return (
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={layer.shape.radius * (box.width / layer.sourceBounds.width)}
        fill={layer.shape.fill}
        transform={transform ? matrixValue(transform) : undefined}
        className={className}
        data-figma-node-id={layer.figmaNodeId}
      />
    );
  }
  return <TemplateAsset asset={layer.visualResource} layer={{ ...box, figmaNodeId: layer.figmaNodeId }} transform={transform} className={className} />;
}

function MotionLayer({ children, center, durationSeconds, phaseOffset = 0, renderLayer, syncGroup }) {
  const rotation = getRotationAnimation(center);
  return (
    <g
      className="figma-bike__motion-layer"
      data-render-layer={renderLayer}
      data-motion-enabled="true"
      data-motion-origin-x={center.x}
      data-motion-origin-y={center.y}
      data-motion-duration={durationSeconds}
      data-motion-phase-offset={phaseOffset}
      data-motion-sync-group={syncGroup}
    >
      <animateTransform
        key={`${renderLayer}-${center.x}-${center.y}`}
        attributeName="transform"
        type="rotate"
        from={rotation.from}
        to={rotation.to}
        dur={`${durationSeconds}s`}
        repeatCount="indefinite"
        calcMode="linear"
      />
      {children}
    </g>
  );
}

function PedalContactMarker({ point }) {
  return (
    <g className="contact-point contact-point--pedal" data-pedal-contact-marker="true" style={{ opacity: "var(--bike-contact-opacity, 1)" }}>
      <circle cx={point.x} cy={point.y} r={4.5} />
      <circle className="contact-point__halo" cx={point.x} cy={point.y} r={9} />
      <text x={point.x + 10} y={point.y - 9}>P</text>
    </g>
  );
}

function ProgrammaticStem({ start, end }) {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.hypot(deltaX, deltaY);
  const angleDeg = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

  return (
    <rect
      x={start.x - PROGRAMMATIC_STEM_LEFT_OVERLAP_PX}
      y={start.y - PROGRAMMATIC_STEM_THICKNESS_PX / 2}
      width={length + PROGRAMMATIC_STEM_LEFT_OVERLAP_PX}
      height={PROGRAMMATIC_STEM_THICKNESS_PX}
      rx={PROGRAMMATIC_STEM_CORNER_RADIUS_PX}
      ry={PROGRAMMATIC_STEM_CORNER_RADIUS_PX}
      fill="#191919"
      transform={`rotate(${angleDeg} ${start.x} ${start.y})`}
      className="figma-bike__component figma-bike__stem"
      data-stem-visual-source="programmatic-rounded-rect"
      data-stem-thickness-px={PROGRAMMATIC_STEM_THICKNESS_PX}
      data-stem-corner-radius-px={PROGRAMMATIC_STEM_CORNER_RADIUS_PX}
      data-stem-left-overlap-px={PROGRAMMATIC_STEM_LEFT_OVERLAP_PX}
    />
  );
}

function HandlebarContactMarker({ point }) {
  return (
    <g className="contact-point contact-point--handlebar" data-handlebar-contact-marker="true" style={{ opacity: "var(--bike-contact-opacity, 1)" }}>
      <circle cx={point.x} cy={point.y} r={4.5} />
      <circle className="contact-point__halo" cx={point.x} cy={point.y} r={9} />
      <text x={point.x + 10} y={point.y - 9}>H</text>
    </g>
  );
}

function FixedRotor({ axle, asset, layer, project, renderLayer }) {
  const center = project(axle);
  const rotorTransform = uniformAroundPoint(
    { x: layer.x + layer.width / 2, y: layer.y + layer.height / 2 },
    center,
    figmaShapeScale,
  );

  return (
    <MotionLayer
      center={center}
      durationSeconds={PREVIEW_MOTION_CONFIG.wheelDurationSeconds}
      renderLayer={renderLayer}
      syncGroup="wheels"
    >
      <TemplateAsset asset={asset} layer={layer} transform={rotorTransform} className="figma-bike__rotor" />
    </MotionLayer>
  );
}

function FixedWheel({ axle, wheel, tire, layer, project, renderLayer, side }) {
  const center = project(axle);
  const wheelBox = {
    ...layer,
    x: center.x - wheelDiameter / 2,
    y: center.y - wheelDiameter / 2,
    width: wheelDiameter,
    height: wheelDiameter,
  };
  const tireLayers = tire.visualLayers ?? [{
    visualResource: tire.visualResource,
    sourceBounds: { x: 0, y: 0, width: 480, height: 480 },
  }];
  const wheelLayers = wheel.visualLayers ?? [{
    visualResource: wheel.visualResource,
    sourceBounds: { x: 0, y: 0, width: 480, height: 480 },
  }];
  const resolveWheelLayerBox = (sourceBounds) => {
    const scale = wheelDiameter / 480;
    return {
      ...layer,
      x: wheelBox.x + sourceBounds.x * scale,
      y: wheelBox.y + sourceBounds.y * scale,
      width: sourceBounds.width * scale,
      height: sourceBounds.height * scale,
    };
  };

  return (
    <g
      data-wheel-id={wheel.id}
      data-tire-id={tire.id}
      data-wheel-side={side}
      data-wheel-center-source="geometry-axle"
      data-source-wheel-center={`${wheel.wheelCenterAnchor.x},${wheel.wheelCenterAnchor.y}`}
    >
      <MotionLayer
        center={center}
        durationSeconds={PREVIEW_MOTION_CONFIG.wheelDurationSeconds}
        renderLayer={renderLayer}
        syncGroup="wheels"
      >
        {wheelLayers.map((wheelLayer, index) => (
          <ResourceLayer
            key={`${wheel.id}-${wheelLayer.figmaNodeId ?? index}`}
            layer={wheelLayer}
            box={resolveWheelLayerBox(wheelLayer.sourceBounds)}
            className="figma-bike__wheel-asset figma-bike__wheel"
          />
        ))}
        {tireLayers.map((tireLayer, index) => (
          <TemplateAsset
            key={`${tire.id}-${index}`}
            asset={tireLayer.visualResource}
            layer={resolveWheelLayerBox(tireLayer.sourceBounds)}
            className="figma-bike__wheel-asset figma-bike__tire"
          />
        ))}
      </MotionLayer>
    </g>
  );
}

function FixedCassette({ cassette, center, renderLayer }) {
  const cassetteTransform = uniformAroundPoint(cassette.visualAnchor, center, figmaShapeScale);
  const cassetteLayers = cassette.visualLayers ?? [{
    visualResource: cassette.visualResource,
    sourceBounds: cassette.sourceBounds,
    figmaNodeId: cassette.figmaNodeId,
  }];
  return (
    <MotionLayer
      center={center}
      durationSeconds={PREVIEW_MOTION_CONFIG.wheelDurationSeconds}
      renderLayer={renderLayer}
      syncGroup="wheels"
    >
      <g
        className="figma-bike__component figma-bike__cassette"
        data-cassette-id={cassette.id}
        data-cassette-center-source="geometry-rear-axle"
        data-source-cassette-center={`${cassette.visualAnchor.x},${cassette.visualAnchor.y}`}
      >
        {cassetteLayers.map((cassetteLayer, index) => (
          <ResourceLayer
            key={`${cassette.id}-${cassetteLayer.figmaNodeId ?? index}`}
            layer={cassetteLayer}
            box={cassetteLayer.sourceBounds}
            transform={cassetteTransform}
            className="figma-bike__cassette-layer"
          />
        ))}
      </g>
    </MotionLayer>
  );
}

function FigmaAnchorDebug({ matrices, parentAnchors, topTubeVisualAnchors, downTubeVisualAnchors, cockpitVisualAnchors, seatpostAnchors, seatpostAssetAnchors, forkVisualTop, forkAssetAnchors, headTubeDebug }) {
  const pairs = [
    {
      key: "seatpost",
      parentLabel: "SeatpostSocketAnchor",
      childLabel: "SeatpostBottom",
      parent: seatpostAnchors.seatpostBottom,
      child: applyMatrix(matrices.seatpost, seatpostAssetAnchors.seatpostBottom),
    },
    {
      key: "seatpost-top",
      parentLabel: "SaddleClampAnchor",
      childLabel: "SeatpostTop",
      parent: seatpostAnchors.saddleClampAnchor,
      child: applyMatrix(matrices.seatpost, seatpostAssetAnchors.seatpostTop),
    },
    {
      key: "spacer-bottom",
      parentLabel: "SpacerBottomAnchor",
      childLabel: "SpacerVisualBottom",
      parent: cockpitVisualAnchors.spacerBottomAnchor,
      child: applyMatrix(matrices.spacer, assetAnchors.spacerHeadtubeAnchor),
    },
    {
      key: "spacer-stem",
      parentLabel: "SpacerTopAnchor",
      childLabel: "StemBaseAnchor",
      parent: cockpitVisualAnchors.spacerTopAnchor,
      child: cockpitVisualAnchors.stemBaseAnchor,
    },
    {
      key: "spacer-top",
      parentLabel: "SpacerTopAnchor",
      childLabel: "SpacerVisualTop",
      parent: cockpitVisualAnchors.spacerTopAnchor,
      child: applyMatrix(matrices.spacer, assetAnchors.spacerVisualAxisEnd),
    },
    {
      key: "stem-base",
      parentLabel: "StemBaseAnchor",
      childLabel: "ProgrammaticStemStart",
      parent: cockpitVisualAnchors.stemBaseAnchor,
      child: cockpitVisualAnchors.stemBaseAnchor,
    },
    {
      key: "stem-handlebar",
      parentLabel: "StemHandlebarAnchor",
      childLabel: "HandlebarClampAnchor",
      parent: cockpitVisualAnchors.stemHandlebarAnchor,
      child: applyMatrix(matrices.handlebar, assetAnchors.handlebarClampAnchor),
    },
    {
      key: "fork",
      parentLabel: "ForkVisualTop",
      childLabel: "ForkTop",
      parent: forkVisualTop,
      child: applyMatrix(matrices.fork, forkAssetAnchors.forkTop),
    },
    {
      key: "head-tube-top",
      parentLabel: "HeadTop",
      childLabel: "HeadTubeTop",
      parent: parentAnchors.headTop,
      child: applyMatrix(matrices.headTube, sourceAnchors.headTubeTop),
    },
    {
      key: "head-tube-bottom",
      parentLabel: "HeadBottom",
      childLabel: "HeadTubeBottom",
      parent: parentAnchors.headBottom,
      child: applyMatrix(matrices.headTube, sourceAnchors.headTubeBottom),
    },
    {
      key: "top-tube-rear",
      parentLabel: "TopTubeSeatJoint",
      childLabel: "TopTubeSeatCenter",
      parent: topTubeVisualAnchors.topTubeSeatJoint,
      child: applyMatrix(matrices.topTube, topTubeVisualAnchors.sourceSeatJoint),
    },
    {
      key: "top-tube-front",
      parentLabel: "TopTubeHeadJoint",
      childLabel: "TopTubeHeadCenter",
      parent: topTubeVisualAnchors.topTubeHeadJoint,
      child: applyMatrix(matrices.topTube, topTubeVisualAnchors.sourceHeadJoint),
    },
    {
      key: "down-tube-rear",
      parentLabel: "DownTubeBbJoint",
      childLabel: "DownTubeRear",
      parent: downTubeVisualAnchors.downTubeBbJoint,
      child: applyMatrix(matrices.downTube, sourceAnchors.bottomBracket),
    },
    {
      key: "down-tube-front",
      parentLabel: "DownTubeHeadJoint",
      childLabel: "DownTubeFront",
      parent: downTubeVisualAnchors.downTubeHeadJoint,
      child: applyMatrix(matrices.downTube, sourceAnchors.headTubeBottom),
    },
  ];
  return (
    <g className="figma-anchor-debug" aria-label="Figma 配件连接锚点" data-render-layer="anchors" style={{ opacity: "var(--bike-debug-opacity, 1)" }}>
      <g
        className="head-tube-debug"
        data-base-visual-size={ENDURANCE_VISUAL_BASE_SIZE}
        data-head-tube-length-mm={headTubeDebug.lengthMm.toFixed(3)}
        data-head-tube-length-px={headTubeDebug.lengthPx.toFixed(3)}
        data-geometry-scale={headTubeDebug.geometryScale.toFixed(6)}
        data-head-tube-angle={headTubeDebug.angle.toFixed(1)}
        data-head-tube-visual-scale={headTubeDebug.visualScale.toFixed(6)}
        data-head-tube-angle-correction={headTubeDebug.angleCorrection.toFixed(1)}
        data-head-tube-delta-identity-error={headTubeDebug.deltaIdentityError.toFixed(9)}
      >
        <line
          x1={parentAnchors.headTop.x}
          y1={parentAnchors.headTop.y}
          x2={parentAnchors.headBottom.x}
          y2={parentAnchors.headBottom.y}
        />
        <circle cx={parentAnchors.headTop.x} cy={parentAnchors.headTop.y} r="4" />
        <circle cx={parentAnchors.headBottom.x} cy={parentAnchors.headBottom.y} r="4" />
        <text x={headTubeDebug.labelPoint.x + 9} y={headTubeDebug.labelPoint.y}>
          Head Tube {headTubeDebug.lengthMm.toFixed(0)} mm · {headTubeDebug.angle.toFixed(1)}°
        </text>
      </g>
      <g
        className="saddle-system-debug"
        data-exposed-seatpost-length={seatpostAnchors.exposedLength.toFixed(3)}
        data-seatpost-axis-error={seatpostAnchors.axisError.toFixed(6)}
      >
        <polyline
          data-seatpost-axis-line="BB:SeatpostSocketAnchor:SeatpostTop"
          points={`${parentAnchors.bottomBracket.x},${parentAnchors.bottomBracket.y} ${seatpostAnchors.seatpostBottom.x},${seatpostAnchors.seatpostBottom.y} ${seatpostAnchors.seatpostTop.x},${seatpostAnchors.seatpostTop.y}`}
        />
        {[
          ["BB", parentAnchors.bottomBracket],
          ["SeatpostSocketAnchor", seatpostAnchors.seatpostBottom],
          ["SeatpostTop", seatpostAnchors.seatpostTop],
          ["SaddleClampAnchor", seatpostAnchors.saddleClampAnchor],
          ["SaddleContactPoint", seatpostAnchors.saddleContactPoint],
        ].map(([label, point]) => (
          <g key={label} transform={`translate(${point.x} ${point.y})`} data-saddle-anchor={label}>
            <circle className="saddle-system-debug__point" r="4" />
            <text x="7" y="-7">{label}</text>
          </g>
        ))}
      </g>
      {pairs.map(({ key, parentLabel, childLabel, parent, child }) => {
        const error = Math.hypot(parent.x - child.x, parent.y - child.y);
        return (
          <g key={key} data-anchor-pair={`${parentLabel}:${childLabel}`} data-anchor-error={error.toFixed(6)}>
            <line x1={parent.x} y1={parent.y} x2={child.x} y2={child.y} />
            <circle className="figma-anchor-debug__parent" cx={parent.x} cy={parent.y} r="6" />
            <circle className="figma-anchor-debug__child" cx={child.x} cy={child.y} r="3" />
            <text x={parent.x + 9} y={parent.y - 8}>{parentLabel} = {childLabel} · Δ {error.toFixed(3)} px</text>
          </g>
        );
      })}
    </g>
  );
}

export function RoadFrameRenderer({
  data,
  project,
  showFigmaAnchors = false,
  showContactPoints = true,
  componentSetup,
  motionStopped = false,
  frameOnly = false,
  seatStayStyle = "mid",
  frameVisualPreset = "endurance",
  topTubeStyle = "sloped",
  topTubeFigmaNodeId = "2:886",
  downTubeStyle = "endurance",
}) {
  const rendererId = useId().replaceAll(":", "");
  const allRoundClearanceMaskId = `all-round-down-tube-clearance-${rendererId}`;
  const components = componentSetup ?? resolveComponentSetup(DEFAULT_COMPONENT_SETUP);
  const isAllRound = frameVisualPreset === "allRound";
  const isAero = frameVisualPreset === "aero";
  const usesProgrammaticRoadTubes = isAllRound || isAero;
  const activeSeatStayStyle = isAero ? null : normalizeEnduranceSeatStayStyle(seatStayStyle);
  const activeSeatStayAnchor = isAero ? null : resolveEnduranceSeatStayAnchor(activeSeatStayStyle);
  const topTubeLayer = isAero
    ? aeroLayers.frameTopTube
    : (isAllRound ? allRoundLayers.frameTopTube : { ...layers.frameTopTube, nodeId: topTubeFigmaNodeId });
  const downTubeSource = isAllRound ? allRoundFrameDownTubeSource : frameDownTubeSource;
  const downTubeLayer = isAllRound ? allRoundLayers.frameDownTube : layers.frameDownTube;
  const activeTemplate = isAero
    ? FIGMA_AERO_TEMPLATE
    : (isAllRound ? FIGMA_ALL_ROUND_TEMPLATE : FIGMA_ENDURANCE_TEMPLATE);
  const activeSourceAnchors = activeTemplate.anchors;
  const seatTubeLayer = isAero ? aeroLayers.frameSeatTube : (isAllRound ? allRoundLayers.frameSeatTube : layers.frameSeatTube);
  const bottomBracketLayer = isAero ? aeroLayers.frameBottomBracket : (isAllRound ? allRoundLayers.frameBottomBracket : layers.frameBottomBracket);
  const headTubeLayer = isAero ? aeroLayers.frameHeadTube : (isAllRound ? allRoundLayers.frameHeadTube : layers.frameHeadTube);
  const chainstayLayer = isAero ? aeroLayers.frameChainstay : (isAllRound ? allRoundLayers.frameChainstay : layers.frameChainstay);
  const seatstayLayer = isAero ? aeroLayers.frameSeatstay : (isAllRound ? allRoundLayers.frameSeatstay : layers.frameSeatstay);
  const forkLayer = isAero ? aeroLayers.fork : (isAllRound ? allRoundLayers.fork : layers.fork);
  const activeForkAssetAnchors = isAero ? aeroAssetAnchors : (isAllRound ? allRoundAssetAnchors : assetAnchors);
  const activeSeatpostAssetAnchors = isAero ? aeroAssetAnchors : (isAllRound ? allRoundAssetAnchors : assetAnchors);
  const activeSeatpostLayer = isAero ? aeroLayers.seatpost : (isAllRound ? allRoundLayers.seatpost : layers.seatpost);
  const activeSeatpostAsset = isAero ? aeroSeatpost : (isAllRound ? allRoundSeatpost : seatpost);
  const activeCockpitAssetAnchors = isAero ? aeroAssetAnchors : (isAllRound ? allRoundAssetAnchors : assetAnchors);
  const activeSpacerLayer = isAero ? aeroLayers.spacer : (isAllRound ? allRoundLayers.spacer : layers.spacer);
  const activeHandlebarHoodLayer = isAero ? aeroLayers.handlebarHood : (isAllRound ? allRoundLayers.handlebarHood : layers.handlebarHood);
  const activeHandlebarTapeLayer = isAero ? aeroLayers.handlebarTape : (isAllRound ? allRoundLayers.handlebarTape : layers.handlebarTape);
  const activeSpacerAsset = isAero ? aeroSpacer : (isAllRound ? allRoundSpacer : spacer);
  const activeHandlebarHoodAsset = isAero ? aeroHandlebarHood : (isAllRound ? allRoundHandlebarHood : handlebarHood);
  const activeHandlebarTapeSource = isAero ? aeroHandlebarTapeSource : (isAllRound ? allRoundHandlebarTapeSource : handlebarTapeSource);
  const frameAssets = {
    downTube: colorizedSvgAsset(downTubeSource, "black", components.frameColor),
    topTube: usesProgrammaticRoadTubes ? null : colorizedSvgAsset(frameTopTubeSource, "black", components.frameColor),
    headTube: colorizedSvgAsset(isAllRound ? allRoundFrameHeadTubeSource : frameHeadTubeSource, "black", components.frameColor),
    chainstay: colorizedSvgAsset(isAllRound ? allRoundFrameChainstaySource : frameChainstaySource, "black", components.frameColor),
    seatstay: colorizedSvgAsset(isAllRound ? allRoundFrameSeatstaySource : frameSeatstaySource, "black", components.frameColor),
    seatTube: usesProgrammaticRoadTubes ? null : colorizedSvgAsset(frameSeatTubeSource, "black", components.frameColor),
    bottomBracket: colorizedSvgAsset(isAllRound ? allRoundFrameBottomBracketSource : frameBottomBracketSource, "black", components.frameColor),
    aeroChainstay: colorizedSvgAsset(aeroFrameChainstaySource, "black", components.frameColor),
    aeroSeatstay: colorizedSvgAsset(aeroFrameSeatstaySource, "black", components.frameColor),
    aeroBottomBracket: colorizedSvgAsset(aeroFrameBottomBracketSource, "black", components.frameColor),
  };
  const forkAsset = colorizedSvgAsset(
    isAero ? aeroForkSource : (isAllRound ? allRoundForkSource : forkSource),
    "black",
    components.forkColor,
  );
  const handlebarTapeAsset = colorizedSvgAsset(activeHandlebarTapeSource, "#D9D9D9", components.barTapeColor);
  const projected = Object.fromEntries(
    Object.entries(data.anchors).map(([key, point]) => [key, project(point)]),
  );

  const baseFrame = getFramePoints(ENDURANCE_VISUAL_BASE_GEOMETRY);
  const baseProjected = {
    bottomBracket: project(baseFrame.bb),
    rearAxle: project(baseFrame.rearAxle),
    frontAxle: project(baseFrame.frontAxle),
    seatTubeTop: project(baseFrame.seatTop),
    headTubeTop: project(baseFrame.headTop),
    headTubeBottom: project(baseFrame.headBottom),
  };
  const visualDelta = getEnduranceVisualDelta(data.geometry);

  const baseFrameBodyMatrix = affineFromThreePoints(
    [sourceAnchors.bottomBracket, sourceAnchors.rearAxle, sourceAnchors.seatTubeTop],
    [baseProjected.bottomBracket, baseProjected.rearAxle, baseProjected.seatTubeTop],
  );
  const frameBodyDeltaMatrix = affineFromThreePoints(
    [baseProjected.bottomBracket, baseProjected.rearAxle, baseProjected.seatTubeTop],
    [projected.bottomBracket, projected.rearAxle, projected.seatTubeTop],
  );
  const frameBodyMatrix = composeMatrices(frameBodyDeltaMatrix, baseFrameBodyMatrix);
  const seatStayRearAxle = isAero ? null : applyMatrix(frameBodyMatrix, sourceAnchors.rearAxle);
  const seatStayConnection = isAero ? null : applyMatrix(frameBodyMatrix, activeSeatStayAnchor.point);
  const seatStayMatrix = isAero ? null : orientedSegmentTransform(
    sourceAnchors.rearAxle,
    sourceAnchors.seatStayHighConnection,
    seatStayRearAxle,
    seatStayConnection,
    figmaShapeScale,
  );
  const mappedSeatStayRearAxle = isAero ? null : applyMatrix(seatStayMatrix, sourceAnchors.rearAxle);
  const mappedSeatStayConnection = isAero ? null : applyMatrix(seatStayMatrix, sourceAnchors.seatStayHighConnection);
  const seatStayRearAxleErrorPx = isAero ? null : Math.hypot(
    mappedSeatStayRearAxle.x - seatStayRearAxle.x,
    mappedSeatStayRearAxle.y - seatStayRearAxle.y,
  );
  const seatStayConnectionErrorPx = isAero ? null : Math.hypot(
    mappedSeatStayConnection.x - seatStayConnection.x,
    mappedSeatStayConnection.y - seatStayConnection.y,
  );
  const parentAnchors = {
    bottomBracket: applyMatrix(frameBodyMatrix, sourceAnchors.bottomBracket),
    seatpostSocketAnchor: applyMatrix(frameBodyMatrix, sourceAnchors.seatpostSocketAnchor),
    headTop: projected.headTubeTop,
    headBottom: projected.headTubeBottom,
  };
  const geometrySeatpostAnchors = getSeatpostVisualAnchors({
    bottomBracket: parentAnchors.bottomBracket,
    socketAnchor: parentAnchors.seatpostSocketAnchor,
    saddleClampReference: projected.saddleClampAnchor,
    saddleVisualReference: projected.saddleVisualAnchor,
    saddleContactReference: projected.saddleContactPoint,
  });
  const aeroVisualAnchors = getAeroVisualAnchors({
    bottomBracket: parentAnchors.bottomBracket,
    rearAxle: projected.rearAxle,
    seatCluster: parentAnchors.seatpostSocketAnchor,
    headTop: parentAnchors.headTop,
    headBottom: parentAnchors.headBottom,
  });
  const seatpostAnchors = geometrySeatpostAnchors;
  const aeroChainstayMatrix = orientedSegmentTransform(
    aeroSourceAnchors.rearAxle,
    aeroSourceAnchors.bottomBracket,
    projected.rearAxle,
    parentAnchors.bottomBracket,
    figmaShapeScale,
  );
  const aeroSeatstayMatrix = orientedSegmentTransform(
    aeroSourceAnchors.rearAxle,
    aeroSourceAnchors.seatStayAeroConnection,
    projected.rearAxle,
    aeroVisualAnchors.seatStayJoint,
    figmaShapeScale,
  );
  const aeroBottomBracketMatrix = uniformAroundPoint(
    aeroSourceAnchors.bottomBracket,
    parentAnchors.bottomBracket,
    figmaShapeScale,
  );
  const mappedAeroChainstayBb = applyMatrix(aeroChainstayMatrix, aeroSourceAnchors.bottomBracket);
  const mappedAeroSeatstayJoint = applyMatrix(aeroSeatstayMatrix, aeroSourceAnchors.seatStayAeroConnection);
  const mappedAeroBottomBracketCenter = applyMatrix(
    aeroBottomBracketMatrix,
    aeroSourceAnchors.bottomBracket,
  );
  const aeroChainstayBbJointErrorPx = Math.hypot(
    mappedAeroChainstayBb.x - parentAnchors.bottomBracket.x,
    mappedAeroChainstayBb.y - parentAnchors.bottomBracket.y,
  );
  const aeroSeatstayJointErrorPx = Math.hypot(
    mappedAeroSeatstayJoint.x - aeroVisualAnchors.seatStayJoint.x,
    mappedAeroSeatstayJoint.y - aeroVisualAnchors.seatStayJoint.y,
  );
  const aeroBottomBracketCenterErrorPx = Math.hypot(
    mappedAeroBottomBracketCenter.x - parentAnchors.bottomBracket.x,
    mappedAeroBottomBracketCenter.y - parentAnchors.bottomBracket.y,
  );
  const headTubeLengthMm = Math.hypot(
    data.frame.headBottom.x - data.frame.headTop.x,
    data.frame.headBottom.y - data.frame.headTop.y,
  );
  const headTubeLengthPx = Math.hypot(
    parentAnchors.headBottom.x - parentAnchors.headTop.x,
    parentAnchors.headBottom.y - parentAnchors.headTop.y,
  );
  const headTubeDebug = {
    lengthMm: headTubeLengthMm,
    lengthPx: headTubeLengthPx,
    geometryScale: headTubeLengthPx / headTubeLengthMm,
    angle: data.geometry.headAngle,
    visualScale: visualDelta.headTubeScale,
    angleCorrection: visualDelta.headAngle,
    labelPoint: {
      x: (parentAnchors.headTop.x + parentAnchors.headBottom.x) / 2,
      y: (parentAnchors.headTop.y + parentAnchors.headBottom.y) / 2,
    },
  };
  const forkAxisDelta = {
    x: projected.frontAxle.x - parentAnchors.headBottom.x,
    y: projected.frontAxle.y - parentAnchors.headBottom.y,
  };
  const forkAxisLength = Math.hypot(forkAxisDelta.x, forkAxisDelta.y) || 1;
  const forkVisualTop = {
    x: parentAnchors.headBottom.x + forkAxisDelta.x / forkAxisLength * FORK_HEAD_GAP_PX,
    y: parentAnchors.headBottom.y + forkAxisDelta.y / forkAxisLength * FORK_HEAD_GAP_PX,
  };
  const forkMatrix = orientedSegmentTransform(
    activeForkAssetAnchors.forkTop,
    activeForkAssetAnchors.forkAxle,
    forkVisualTop,
    projected.frontAxle,
    figmaShapeScale,
  );
  const mappedForkTop = applyMatrix(forkMatrix, activeForkAssetAnchors.forkTop);
  const mappedForkAxle = applyMatrix(forkMatrix, activeForkAssetAnchors.forkAxle);
  const forkAxleErrorPx = Math.hypot(
    mappedForkAxle.x - projected.frontAxle.x,
    mappedForkAxle.y - projected.frontAxle.y,
  );
  const baseHeadTubeMatrix = orientedSegmentTransform(
    sourceAnchors.headTubeTop,
    sourceAnchors.headTubeBottom,
    baseProjected.headTubeTop,
    baseProjected.headTubeBottom,
    figmaShapeScale,
  );
  const headTubeDeltaMatrix = orientedSegmentTransform(
    baseProjected.headTubeTop,
    baseProjected.headTubeBottom,
    parentAnchors.headTop,
    parentAnchors.headBottom,
    1,
  );
  const enduranceHeadTubeMatrix = composeMatrices(headTubeDeltaMatrix, baseHeadTubeMatrix);
  const aeroHeadTubeMatrix = orientedSegmentTransform(
    aeroSourceAnchors.headTop,
    aeroSourceAnchors.headBottom,
    parentAnchors.headTop,
    parentAnchors.headBottom,
    figmaShapeScale,
  );
  const allRoundHeadTubeMatrix = orientedSegmentTransform(
    allRoundSourceAnchors.headTubeTop,
    allRoundSourceAnchors.headTubeBottom,
    parentAnchors.headTop,
    parentAnchors.headBottom,
    figmaShapeScale,
  );
  const headTubeMatrix = isAero
    ? aeroHeadTubeMatrix
    : (isAllRound ? allRoundHeadTubeMatrix : enduranceHeadTubeMatrix);
  headTubeDebug.deltaIdentityError = identityMatrixError(headTubeDeltaMatrix);
  const activeHeadTubeSourceTop = isAero ? aeroSourceAnchors.headTop : allRoundSourceAnchors.headTubeTop;
  const activeHeadTubeSourceBottom = isAero ? aeroSourceAnchors.headBottom : allRoundSourceAnchors.headTubeBottom;
  const sourceHeadTubeAxis = {
    x: activeHeadTubeSourceTop.x - activeHeadTubeSourceBottom.x,
    y: activeHeadTubeSourceTop.y - activeHeadTubeSourceBottom.y,
  };
  const sourceHeadTubeAxisLength = Math.hypot(sourceHeadTubeAxis.x, sourceHeadTubeAxis.y) || 1;
  const sourceHeadTubeNormal = {
    x: -sourceHeadTubeAxis.y / sourceHeadTubeAxisLength,
    y: sourceHeadTubeAxis.x / sourceHeadTubeAxisLength,
  };
  const headTubeSourceHalfWidthPx = isAero
    ? AERO_VISUAL_CONFIG.headTubeHalfWidthSourcePx
    : ALL_ROUND_HEAD_TUBE_SOURCE_HALF_WIDTH_PX;
  const mappedHeadTubeHalfWidthVector = {
    x: (
      headTubeMatrix.a * sourceHeadTubeNormal.x
      + headTubeMatrix.c * sourceHeadTubeNormal.y
    ) * headTubeSourceHalfWidthPx,
    y: (
      headTubeMatrix.b * sourceHeadTubeNormal.x
      + headTubeMatrix.d * sourceHeadTubeNormal.y
    ) * headTubeSourceHalfWidthPx,
  };
  const programmaticHeadTubeHalfWidthPx = Math.hypot(
    mappedHeadTubeHalfWidthVector.x,
    mappedHeadTubeHalfWidthVector.y,
  );
  const topTubeSeatHalfWidthPx = (
    isAero
      ? AERO_VISUAL_CONFIG.topTubeSeatHalfWidthSourcePx
      : ALL_ROUND_TOP_TUBE_SEAT_SOURCE_HALF_WIDTH_PX
  ) * figmaShapeScale;
  const topTubeHeadHalfWidthPx = (
    isAero
      ? AERO_VISUAL_CONFIG.topTubeHeadHalfWidthSourcePx
      : ALL_ROUND_TOP_TUBE_HEAD_SOURCE_HALF_WIDTH_PX
  ) * figmaShapeScale;
  const programmaticAeroHeadTubeShape = isAero
    ? getAllRoundSeatTubeShape({
      bottomBracket: parentAnchors.headBottom,
      seatTubeTop: parentAnchors.headTop,
      towardPoint: aeroVisualAnchors.topTubeSeatJoint,
      topHalfWidthPx: programmaticHeadTubeHalfWidthPx,
      bottomHalfWidthPx: programmaticHeadTubeHalfWidthPx,
    })
    : null;
  const fittedAeroTopTubeJoints = isAero
    ? fitTopTubeJointsToHeadTubeBoundary({
      bottomBracket: parentAnchors.bottomBracket,
      seatCluster: parentAnchors.seatpostSocketAnchor,
      headBottom: parentAnchors.headBottom,
      headTop: parentAnchors.headTop,
      topTubeSeatJoint: aeroVisualAnchors.topTubeSeatJoint,
      topTubeHeadJoint: aeroVisualAnchors.topTubeHeadJoint,
      headTubeBoundaryStart: programmaticAeroHeadTubeShape.headwardBottom,
      headTubeBoundaryEnd: programmaticAeroHeadTubeShape.headwardTop,
      topTubeSeatHalfWidthPx,
      topTubeHeadHalfWidthPx,
      headTubeEndInsetPx: AERO_VISUAL_CONFIG.headTubeJunctionOverlapPx,
    })
    : null;

  const baseTopTubeMatrix = orientedSegmentTransform(
    sourceAnchors.seatTubeTop,
    sourceAnchors.headTubeTop,
    baseProjected.seatTubeTop,
    baseProjected.headTubeTop,
    figmaShapeScale,
  );
  const topTubeDeltaMatrix = orientedSegmentTransform(
    baseProjected.seatTubeTop,
    baseProjected.headTubeTop,
    parentAnchors.seatpostSocketAnchor,
    parentAnchors.headTop,
    1,
  );
  const enduranceTopTubeMatrix = composeMatrices(topTubeDeltaMatrix, baseTopTubeMatrix);
  const standardTopTubeJoints = getTopTubeVisualJoints({
    category: frameVisualPreset,
    bottomBracket: parentAnchors.bottomBracket,
    seatCluster: parentAnchors.seatpostSocketAnchor,
    headTop: parentAnchors.headTop,
    headBottom: parentAnchors.headBottom,
  });
  const topTubeSeatJoint = isAero
    ? fittedAeroTopTubeJoints.topTubeSeatJoint
    : standardTopTubeJoints.topTubeSeatJoint;
  const topTubeHeadJoint = isAero
    ? fittedAeroTopTubeJoints.topTubeHeadJoint
    : standardTopTubeJoints.topTubeHeadJoint;
  const topTubeJointFallback = isAero ? false : standardTopTubeJoints.usedFallback;
  const topTubeReference = TOP_TUBE_VISUAL_REFERENCES[frameVisualPreset]
    ?? TOP_TUBE_VISUAL_REFERENCES.endurance;
  const topTubeSourceSeatJoint = isAero || isAllRound
    ? activeSourceAnchors.topTubeSeatJoint
    : {
      x: topTubeLayer.x + topTubeReference.sourceSeatCenter.x,
      y: topTubeLayer.y + topTubeReference.sourceSeatCenter.y,
    };
  const topTubeSourceHeadJoint = isAero || isAllRound
    ? activeSourceAnchors.topTubeHeadJoint
    : {
      x: topTubeLayer.x + topTubeReference.sourceHeadCenter.x,
      y: topTubeLayer.y + topTubeReference.sourceHeadCenter.y,
    };
  const visualTopTubeMatrix = orientedSegmentTransform(
    topTubeSourceSeatJoint,
    topTubeSourceHeadJoint,
    topTubeSeatJoint,
    topTubeHeadJoint,
    figmaShapeScale,
  );
  const topTubeMatrix = usesProgrammaticRoadTubes
    ? visualTopTubeMatrix
    : enduranceTopTubeMatrix;
  const mappedTopTubeSeatJoint = applyMatrix(topTubeMatrix, usesProgrammaticRoadTubes
    ? topTubeSourceSeatJoint
    : sourceAnchors.seatTubeTop);
  const mappedTopTubeHeadJoint = applyMatrix(topTubeMatrix, usesProgrammaticRoadTubes
    ? topTubeSourceHeadJoint
    : sourceAnchors.headTubeTop);
  const topTubeSeatJointErrorPx = Math.hypot(
    mappedTopTubeSeatJoint.x - topTubeSeatJoint.x,
    mappedTopTubeSeatJoint.y - topTubeSeatJoint.y,
  );
  const topTubeHeadJointErrorPx = Math.hypot(
    mappedTopTubeHeadJoint.x - topTubeHeadJoint.x,
    mappedTopTubeHeadJoint.y - topTubeHeadJoint.y,
  );
  const topTubeSeatLineErrorPx = pointLineDistance(
    topTubeSeatJoint,
    parentAnchors.bottomBracket,
    parentAnchors.seatpostSocketAnchor,
  );
  const topTubeHeadLineErrorPx = pointLineDistance(
    topTubeHeadJoint,
    parentAnchors.headBottom,
    parentAnchors.headTop,
  );
  const seatTubeTopHalfWidthPx = (
    isAero
      ? AERO_VISUAL_CONFIG.seatTubeTopHalfWidthSourcePx
      : ALL_ROUND_SEAT_TUBE_TOP_SOURCE_HALF_WIDTH_PX
  ) * figmaShapeScale;
  const seatTubeBottomHalfWidthPx = (
    isAero
      ? AERO_VISUAL_CONFIG.seatTubeBottomHalfWidthSourcePx
      : ALL_ROUND_SEAT_TUBE_BOTTOM_SOURCE_HALF_WIDTH_PX
  ) * figmaShapeScale;
  const aeroSeatTubeVisualTop = isAero
    ? getAeroSeatTubeVisualTop({
      bottomBracket: parentAnchors.bottomBracket,
      geometrySeatTubeTop: parentAnchors.seatpostSocketAnchor,
      topTubeSeatJoint,
    })
    : null;
  const seatTubeVisualTop = isAero
    ? aeroSeatTubeVisualTop.point
    : parentAnchors.seatpostSocketAnchor;
  const programmaticSeatTubeShape = usesProgrammaticRoadTubes
    ? getAllRoundSeatTubeShape({
      bottomBracket: parentAnchors.bottomBracket,
      seatTubeTop: seatTubeVisualTop,
      towardPoint: topTubeHeadJoint,
      topHalfWidthPx: seatTubeTopHalfWidthPx,
      bottomHalfWidthPx: seatTubeBottomHalfWidthPx,
    })
    : null;
  const programmaticTopTubeShape = usesProgrammaticRoadTubes
    ? getAllRoundTopTubeShape({
      bottomBracket: parentAnchors.bottomBracket,
      seatCluster: parentAnchors.seatpostSocketAnchor,
      seatTubeBoundaryStart: programmaticSeatTubeShape.headwardBottom,
      seatTubeBoundaryEnd: programmaticSeatTubeShape.headwardTop,
      headBottom: parentAnchors.headBottom,
      headTop: parentAnchors.headTop,
      topTubeSeatJoint,
      topTubeHeadJoint,
      headTubeHalfWidthPx: programmaticHeadTubeHalfWidthPx,
      headTubeBoundaryStart: isAero ? programmaticAeroHeadTubeShape.headwardBottom : undefined,
      headTubeBoundaryEnd: isAero ? programmaticAeroHeadTubeShape.headwardTop : undefined,
      headTubeSeamOverlapPx: isAero ? AERO_VISUAL_CONFIG.headTubeJunctionOverlapPx : 0,
      topTubeSeatHalfWidthPx,
      topTubeHeadHalfWidthPx,
    })
    : null;

  const baseDownTubeMatrix = orientedSegmentTransform(
    sourceAnchors.bottomBracket,
    sourceAnchors.headTubeBottom,
    baseProjected.bottomBracket,
    baseProjected.headTubeBottom,
    figmaShapeScale,
  );
  const downTubeDeltaMatrix = orientedSegmentTransform(
    baseProjected.bottomBracket,
    baseProjected.headTubeBottom,
    parentAnchors.bottomBracket,
    parentAnchors.headBottom,
    1,
  );
  const enduranceDownTubeMatrix = composeMatrices(downTubeDeltaMatrix, baseDownTubeMatrix);
  const standardDownTubeJoints = getDownTubeVisualJoints({
    category: frameVisualPreset,
    bottomBracket: parentAnchors.bottomBracket,
    headBottom: parentAnchors.headBottom,
    headTop: parentAnchors.headTop,
    frontAxle: projected.frontAxle,
    frontWheelOuterRadius: wheelDiameter / 2,
  });
  const downTubeBbJoint = parentAnchors.bottomBracket;
  const downTubeHeadJoint = isAero
    ? aeroVisualAnchors.downTubeHeadJoint
    : standardDownTubeJoints.downTubeHeadJoint;
  const downTubeSourceBbJoint = isAero || isAllRound ? activeSourceAnchors.bottomBracket : sourceAnchors.bottomBracket;
  const downTubeSourceHeadJoint = isAero || isAllRound ? activeSourceAnchors.downTubeHeadJoint : sourceAnchors.headTubeBottom;
  const aeroDownTubeShape = isAero
    ? getAeroDownTubeShape({
      bottomBracket: parentAnchors.bottomBracket,
      downTubeHeadJoint,
      headBottom: parentAnchors.headBottom,
      headTop: parentAnchors.headTop,
      headTubeSeatwardBoundaryStart: programmaticAeroHeadTubeShape.headwardBottom,
      headTubeSeatwardBoundaryEnd: programmaticAeroHeadTubeShape.headwardTop,
      bbHalfWidthPx: AERO_VISUAL_CONFIG.downTubeBbHalfWidthSourcePx * figmaShapeScale,
      headHalfWidthPx: AERO_VISUAL_CONFIG.downTubeHeadHalfWidthSourcePx * figmaShapeScale,
      maximumBoundaryRatio: Math.min(
        fittedAeroTopTubeJoints.upperBoundaryRatio,
        fittedAeroTopTubeJoints.lowerBoundaryRatio,
      ) - AERO_VISUAL_CONFIG.headTubeJunctionOverlapPx / Math.hypot(
        programmaticAeroHeadTubeShape.headwardTop.x - programmaticAeroHeadTubeShape.headwardBottom.x,
        programmaticAeroHeadTubeShape.headwardTop.y - programmaticAeroHeadTubeShape.headwardBottom.y,
      ),
    })
    : null;
  const downTubeVisualHeadTarget = isAero
    ? aeroDownTubeShape.fittedHeadJoint
    : downTubeHeadJoint;
  const visualDownTubeMatrix = orientedSegmentTransform(
    downTubeSourceBbJoint,
    downTubeSourceHeadJoint,
    downTubeBbJoint,
    downTubeVisualHeadTarget,
    figmaShapeScale,
  );
  const downTubeMatrix = isAllRound || isAero
    ? visualDownTubeMatrix
    : enduranceDownTubeMatrix;
  const mappedDownTubeBbJoint = applyMatrix(downTubeMatrix, downTubeSourceBbJoint);
  const mappedDownTubeHeadJoint = applyMatrix(downTubeMatrix, downTubeSourceHeadJoint);
  const downTubeBbJointErrorPx = Math.hypot(
    mappedDownTubeBbJoint.x - downTubeBbJoint.x,
    mappedDownTubeBbJoint.y - downTubeBbJoint.y,
  );
  const downTubeHeadJointErrorPx = Math.hypot(
    mappedDownTubeHeadJoint.x - downTubeVisualHeadTarget.x,
    mappedDownTubeHeadJoint.y - downTubeVisualHeadTarget.y,
  );
  const downTubeHeadLineErrorPx = pointLineDistance(
    downTubeHeadJoint,
    parentAnchors.headBottom,
    parentAnchors.headTop,
  );
  const seatpostMatrix = orientedSegmentTransform(
    activeSeatpostAssetAnchors.seatpostBottom,
    activeSeatpostAssetAnchors.seatpostTop,
    seatpostAnchors.seatpostBottom,
    seatpostAnchors.seatpostTop,
    figmaShapeScale,
  );
  const saddleMatrix = uniformAroundPoint(sourceAnchors.saddleAnchor, seatpostAnchors.saddleVisualAnchor, figmaShapeScale);
  const spacerMatrix = orientedSegmentTransform(
    activeCockpitAssetAnchors.spacerHeadtubeAnchor,
    activeCockpitAssetAnchors.spacerVisualAxisEnd,
    projected.spacerHeadtubeAnchor,
    projected.spacerTop,
    figmaShapeScale,
  );
  const handlebarMatrix = uniformAroundPoint(
    activeCockpitAssetAnchors.handlebarClampAnchor,
    projected.handlebarClampAnchor,
    figmaShapeScale,
  );
  const handlebarContactPoint = applyMatrix(handlebarMatrix, activeSourceAnchors.handlebarAnchor);
  const mappedStemBaseAnchor = projected.stemSpacerAnchor;
  const mappedStemHandlebarAnchor = projected.stemHandlebarAnchor;
  const mappedHandlebarClampAnchor = applyMatrix(handlebarMatrix, activeCockpitAssetAnchors.handlebarClampAnchor);
  const stemBaseDisplacementPx = Math.hypot(
    mappedStemBaseAnchor.x - projected.stemSpacerAnchor.x,
    mappedStemBaseAnchor.y - projected.stemSpacerAnchor.y,
  );
  const stemRenderedLengthMm = Math.hypot(
    mappedStemHandlebarAnchor.x - mappedStemBaseAnchor.x,
    mappedStemHandlebarAnchor.y - mappedStemBaseAnchor.y,
  ) / (RENDERED_WHEEL_DIAMETER_PX / 686);
  const handlebarClampErrorPx = Math.hypot(
    mappedHandlebarClampAnchor.x - mappedStemHandlebarAnchor.x,
    mappedHandlebarClampAnchor.y - mappedStemHandlebarAnchor.y,
  );
  const crankSourceBase = {
    x: components.crank.sourceBounds.x + components.crank.visualAnchor.x,
    y: components.crank.sourceBounds.y + components.crank.visualAnchor.y,
  };
  const crankSourcePedal = {
    x: components.crank.sourceBounds.x + components.crank.pedalAnchor.x,
    y: components.crank.sourceBounds.y + components.crank.pedalAnchor.y,
  };
  const driveCrankMatrix = orientedSegmentTransform(
    crankSourceBase,
    crankSourcePedal,
    projected.bottomBracket,
    projected.pedalAnchor,
    figmaShapeScale,
  );
  const crankSourceAngleDeg = Math.atan2(
    crankSourcePedal.y - crankSourceBase.y,
    crankSourcePedal.x - crankSourceBase.x,
  ) * 180 / Math.PI;
  const crankTargetAngleDeg = Math.atan2(
    projected.pedalAnchor.y - projected.bottomBracket.y,
    projected.pedalAnchor.x - projected.bottomBracket.x,
  ) * 180 / Math.PI;
  const chainringCrankAlignmentAngleDeg = crankTargetAngleDeg - crankSourceAngleDeg;
  const oppositePedal = oppositePointAround(projected.bottomBracket, projected.pedalAnchor);
  const nonDriveCrankMirrorAxisX = components.crank.sourceBounds.x + components.crank.sourceBounds.width / 2;
  const nonDriveCrankLocalMirrorMatrix = {
    a: -1,
    b: 0,
    c: 0,
    d: 1,
    e: nonDriveCrankMirrorAxisX * 2,
    f: 0,
  };
  const mirroredCrankSourceBase = applyMatrix(nonDriveCrankLocalMirrorMatrix, crankSourceBase);
  const mirroredCrankSourcePedal = applyMatrix(nonDriveCrankLocalMirrorMatrix, crankSourcePedal);
  const nonDriveCrankPlacementMatrix = orientedSegmentTransform(
    mirroredCrankSourceBase,
    mirroredCrankSourcePedal,
    projected.bottomBracket,
    oppositePedal,
    figmaShapeScale,
  );
  const nonDriveCrankMatrix = composeMatrices(
    nonDriveCrankPlacementMatrix,
    nonDriveCrankLocalMirrorMatrix,
  );
  const mappedNonDriveCrankBase = applyMatrix(nonDriveCrankMatrix, crankSourceBase);
  const mappedNonDriveCrankPedal = applyMatrix(nonDriveCrankMatrix, crankSourcePedal);
  const nonDriveCrankBaseErrorPx = Math.hypot(
    mappedNonDriveCrankBase.x - projected.bottomBracket.x,
    mappedNonDriveCrankBase.y - projected.bottomBracket.y,
  );
  const nonDriveCrankPedalErrorPx = Math.hypot(
    mappedNonDriveCrankPedal.x - oppositePedal.x,
    mappedNonDriveCrankPedal.y - oppositePedal.y,
  );
  const drivetrainMatrix = similarityFromTwoPoints(
    sourceAnchors.rearAxle,
    sourceAnchors.bottomBracket,
    projected.rearAxle,
    projected.bottomBracket,
  );
  const chainringSourceAnchor = {
    x: components.chainring.sourceBounds.x + components.chainring.visualAnchor.x,
    y: components.chainring.sourceBounds.y + components.chainring.visualAnchor.y,
  };
  const bbMatrix = uniformAroundPoint(chainringSourceAnchor, projected.bottomBracket, figmaShapeScale);
  const drivetrainSourceAnchor = {
    x: components.drivetrain.sourceBounds.x + components.drivetrain.visualAnchor.x,
    y: components.drivetrain.sourceBounds.y + components.drivetrain.visualAnchor.y,
  };
  const rearMatrix = uniformAroundPoint(drivetrainSourceAnchor, projected.rearAxle, figmaShapeScale);
  const matrices = {
    fork: forkMatrix,
    seatpost: seatpostMatrix,
    spacer: spacerMatrix,
    handlebar: handlebarMatrix,
    headTube: headTubeMatrix,
    topTube: topTubeMatrix,
    downTube: downTubeMatrix,
  };
  const crankLengthMm = Math.hypot(
    data.pedal.x - data.frame.bb.x,
    data.pedal.y - data.frame.bb.y,
  );

  return (
    <g
      className="figma-bike-template"
      data-template={`figma-${frameVisualPreset}-v1`}
      data-source-node={activeTemplate.templateNodeId}
      data-frame-visual-baseline-size={ENDURANCE_VISUAL_BASE_SIZE}
      data-frame-mapping="geometry-anchors-plus-visual-template"
      data-frame-visual-preset={frameVisualPreset}
      data-top-tube-style={topTubeStyle}
      data-top-tube-figma-node={topTubeFigmaNodeId}
      data-top-tube-seat-joint={`${topTubeSeatJoint.x.toFixed(3)},${topTubeSeatJoint.y.toFixed(3)}`}
      data-top-tube-head-joint={`${topTubeHeadJoint.x.toFixed(3)},${topTubeHeadJoint.y.toFixed(3)}`}
      data-top-tube-seat-line-error-px={topTubeSeatLineErrorPx.toFixed(9)}
      data-top-tube-head-line-error-px={topTubeHeadLineErrorPx.toFixed(9)}
      data-top-tube-seat-joint-error-px={topTubeSeatJointErrorPx.toFixed(9)}
      data-top-tube-head-joint-error-px={topTubeHeadJointErrorPx.toFixed(9)}
      data-top-tube-joint-fallback={topTubeJointFallback ? "true" : "false"}
      data-top-tube-runtime-source={usesProgrammaticRoadTubes ? "programmatic-closed-path" : "figma-svg"}
      data-top-tube-upper-seat-intersection={usesProgrammaticRoadTubes ? `${programmaticTopTubeShape.upperSeatIntersection.x.toFixed(3)},${programmaticTopTubeShape.upperSeatIntersection.y.toFixed(3)}` : undefined}
      data-top-tube-lower-seat-intersection={usesProgrammaticRoadTubes ? `${programmaticTopTubeShape.lowerSeatIntersection.x.toFixed(3)},${programmaticTopTubeShape.lowerSeatIntersection.y.toFixed(3)}` : undefined}
      data-top-tube-upper-head-intersection={usesProgrammaticRoadTubes ? `${programmaticTopTubeShape.upperHeadIntersection.x.toFixed(3)},${programmaticTopTubeShape.upperHeadIntersection.y.toFixed(3)}` : undefined}
      data-top-tube-lower-head-intersection={usesProgrammaticRoadTubes ? `${programmaticTopTubeShape.lowerHeadIntersection.x.toFixed(3)},${programmaticTopTubeShape.lowerHeadIntersection.y.toFixed(3)}` : undefined}
      data-top-tube-seat-boundary={usesProgrammaticRoadTubes ? "programmatic-seat-tube-headward-edge" : undefined}
      data-top-tube-head-tube-half-width-px={usesProgrammaticRoadTubes ? programmaticHeadTubeHalfWidthPx.toFixed(6) : undefined}
      data-top-tube-head-overlap-px={isAero ? AERO_VISUAL_CONFIG.headTubeJunctionOverlapPx : undefined}
      data-aero-top-tube-head-fit-adjustment-px={isAero ? fittedAeroTopTubeJoints.adjustmentPx.toFixed(6) : undefined}
      data-aero-top-tube-upper-head-boundary-ratio={isAero ? fittedAeroTopTubeJoints.upperBoundaryRatio.toFixed(9) : undefined}
      data-aero-top-tube-lower-head-boundary-ratio={isAero ? fittedAeroTopTubeJoints.lowerBoundaryRatio.toFixed(9) : undefined}
      data-aero-top-tube-head-cap-inset-px={isAero ? fittedAeroTopTubeJoints.headTubeEndInsetPx.toFixed(6) : undefined}
      data-head-tube-runtime-source={isAero ? "programmatic-closed-path" : "figma-svg"}
      data-head-tube-seatward-boundary-start={isAero ? `${programmaticAeroHeadTubeShape.headwardBottom.x.toFixed(3)},${programmaticAeroHeadTubeShape.headwardBottom.y.toFixed(3)}` : undefined}
      data-head-tube-seatward-boundary-end={isAero ? `${programmaticAeroHeadTubeShape.headwardTop.x.toFixed(3)},${programmaticAeroHeadTubeShape.headwardTop.y.toFixed(3)}` : undefined}
      data-seat-tube-runtime-source={usesProgrammaticRoadTubes ? "programmatic-tapered-path" : "figma-svg"}
      data-seat-tube-top-half-width-px={usesProgrammaticRoadTubes ? seatTubeTopHalfWidthPx.toFixed(6) : undefined}
      data-seat-tube-bottom-half-width-px={usesProgrammaticRoadTubes ? seatTubeBottomHalfWidthPx.toFixed(6) : undefined}
      data-seat-tube-headward-top={usesProgrammaticRoadTubes ? `${programmaticSeatTubeShape.headwardTop.x.toFixed(3)},${programmaticSeatTubeShape.headwardTop.y.toFixed(3)}` : undefined}
      data-seat-tube-headward-bottom={usesProgrammaticRoadTubes ? `${programmaticSeatTubeShape.headwardBottom.x.toFixed(3)},${programmaticSeatTubeShape.headwardBottom.y.toFixed(3)}` : undefined}
      data-down-tube-style={downTubeStyle}
      data-down-tube-bb-joint={`${downTubeBbJoint.x.toFixed(3)},${downTubeBbJoint.y.toFixed(3)}`}
      data-down-tube-head-joint={`${downTubeHeadJoint.x.toFixed(3)},${downTubeHeadJoint.y.toFixed(3)}`}
      data-down-tube-runtime-source={isAero ? "programmatic-closed-path" : "figma-svg"}
      data-down-tube-upper-head-intersection={isAero ? `${aeroDownTubeShape.upperHeadIntersection.x.toFixed(3)},${aeroDownTubeShape.upperHeadIntersection.y.toFixed(3)}` : undefined}
      data-down-tube-lower-head-intersection={isAero ? `${aeroDownTubeShape.lowerHeadIntersection.x.toFixed(3)},${aeroDownTubeShape.lowerHeadIntersection.y.toFixed(3)}` : undefined}
      data-down-tube-upper-head-boundary-ratio={isAero ? aeroDownTubeShape.upperBoundaryRatio.toFixed(9) : undefined}
      data-down-tube-lower-head-boundary-ratio={isAero ? aeroDownTubeShape.lowerBoundaryRatio.toFixed(9) : undefined}
      data-down-tube-head-visual-target={isAero ? `${downTubeVisualHeadTarget.x.toFixed(3)},${downTubeVisualHeadTarget.y.toFixed(3)}` : undefined}
      data-down-tube-head-overlap-px={isAero ? aeroDownTubeShape.seamOverlapPx.toFixed(6) : undefined}
      data-down-tube-head-cap-inset-px={isAero ? aeroDownTubeShape.headCapInsetPx.toFixed(6) : undefined}
      data-down-tube-head-fit-adjustment-px={isAero ? aeroDownTubeShape.adjustmentPx.toFixed(6) : undefined}
      data-aero-down-tube-bb-half-width-px={isAero ? (AERO_VISUAL_CONFIG.downTubeBbHalfWidthSourcePx * figmaShapeScale).toFixed(6) : undefined}
      data-aero-down-tube-head-half-width-px={isAero ? (AERO_VISUAL_CONFIG.downTubeHeadHalfWidthSourcePx * figmaShapeScale).toFixed(6) : undefined}
      data-down-tube-head-line-error-px={downTubeHeadLineErrorPx.toFixed(9)}
      data-down-tube-bb-joint-error-px={downTubeBbJointErrorPx.toFixed(9)}
      data-down-tube-head-joint-error-px={downTubeHeadJointErrorPx.toFixed(9)}
      data-down-tube-wheel-clearance-px={isAllRound ? standardDownTubeJoints.clearance.estimatedClearancePx.toFixed(6) : undefined}
      data-down-tube-wheel-clearance-target-px={isAllRound ? ALL_ROUND_DOWN_TUBE_MIN_WHEEL_CLEARANCE_PX : undefined}
      data-down-tube-wheel-effective-clearance-px={isAllRound ? standardDownTubeJoints.clearance.effectiveClearancePx.toFixed(6) : undefined}
      data-down-tube-head-joint-ratio={isAllRound ? standardDownTubeJoints.clearance.headJointRatio.toFixed(3) : undefined}
      data-down-tube-head-half-width-px={isAllRound ? standardDownTubeJoints.clearance.headHalfWidthPx.toFixed(3) : undefined}
      data-down-tube-path-retreat-px={isAllRound ? standardDownTubeJoints.clearance.pathRetreatPx.toFixed(6) : undefined}
      data-seat-stay-style={activeSeatStayStyle ?? undefined}
      data-seat-stay-anchor={activeSeatStayAnchor?.key}
      data-seat-stay-rear-axle={seatStayRearAxle ? `${seatStayRearAxle.x.toFixed(3)},${seatStayRearAxle.y.toFixed(3)}` : undefined}
      data-seat-stay-connection={seatStayConnection ? `${seatStayConnection.x.toFixed(3)},${seatStayConnection.y.toFixed(3)}` : undefined}
      data-seat-stay-rear-axle-error-px={seatStayRearAxleErrorPx?.toFixed(9)}
      data-seat-stay-connection-error-px={seatStayConnectionErrorPx?.toFixed(9)}
      data-stack-delta={visualDelta.stack}
      data-reach-delta={visualDelta.reach}
      data-head-tube-delta={visualDelta.headTube}
      data-head-angle-delta={visualDelta.headAngle.toFixed(1)}
      data-seat-tube-delta={visualDelta.seatTube}
      data-seat-angle-delta={visualDelta.seatAngle.toFixed(1)}
      data-effective-top-tube-delta={visualDelta.effectiveTopTube}
      data-wheelbase-delta={visualDelta.wheelbase}
      data-head-tube-visual-scale={visualDelta.headTubeScale.toFixed(6)}
      data-frame-body-delta-identity-error={identityMatrixError(frameBodyDeltaMatrix).toFixed(9)}
      data-head-tube-delta-identity-error={identityMatrixError(headTubeDeltaMatrix).toFixed(9)}
      data-top-tube-delta-identity-error={identityMatrixError(topTubeDeltaMatrix).toFixed(9)}
      data-down-tube-delta-identity-error={identityMatrixError(downTubeDeltaMatrix).toFixed(9)}
      data-preview-motion={motionStopped ? "stopped" : "running"}
      data-front-wheel-id={components.frontWheel.id}
      data-rear-wheel-id={components.rearWheel.id}
      data-tire-id={components.tire.id}
      data-chainring-id={components.chainring.id}
      data-crank-id={components.crank.id}
      data-cassette-id={components.cassette.id}
      data-drivetrain-id={components.drivetrain.id}
      data-frame-color={components.frameColor}
      data-fork-color={components.forkColor}
      data-bar-tape-color={components.barTapeColor}
      data-crank-length-mm={crankLengthMm.toFixed(3)}
      data-crank-visual-base-length={BASE_CRANK_LENGTH_MM}
      data-crank-length-ratio={(crankLengthMm / BASE_CRANK_LENGTH_MM).toFixed(6)}
      data-pedal-center={`${projected.pedalAnchor.x.toFixed(3)},${projected.pedalAnchor.y.toFixed(3)}`}
      data-user-spacer-height={data.cockpit.userSpacerHeight}
      data-base-cockpit-stack-height={data.cockpit.baseCockpitStackHeight}
      data-total-spacer-stack-height={data.cockpit.totalSpacerStackHeight}
      data-stem-length={data.cockpit.stemLength}
      data-stem-base-displacement-px={stemBaseDisplacementPx.toFixed(9)}
      data-stem-rendered-length-mm={stemRenderedLengthMm.toFixed(6)}
      data-handlebar-clamp-error-px={handlebarClampErrorPx.toFixed(9)}
      data-stem-angle={data.cockpit.stemAngle}
      data-effective-stem-pitch={data.cockpit.effectiveStemPitch.toFixed(1)}
      data-spacer-visual-bottom-anchor={`${projected.spacerHeadtubeAnchor.x.toFixed(3)},${projected.spacerHeadtubeAnchor.y.toFixed(3)}`}
      data-spacer-visual-top-anchor={`${projected.spacerTop.x.toFixed(3)},${projected.spacerTop.y.toFixed(3)}`}
      data-stem-visual-base-anchor={`${projected.stemSpacerAnchor.x.toFixed(3)},${projected.stemSpacerAnchor.y.toFixed(3)}`}
      data-stem-visual-handlebar-anchor={`${projected.stemHandlebarAnchor.x.toFixed(3)},${projected.stemHandlebarAnchor.y.toFixed(3)}`}
      data-handlebar-contact-anchor={`${handlebarContactPoint.x.toFixed(3)},${handlebarContactPoint.y.toFixed(3)}`}
      data-spacer-headtube-anchor={`${data.cockpit.spacerHeadtubeAnchor.x.toFixed(3)},${data.cockpit.spacerHeadtubeAnchor.y.toFixed(3)}`}
      data-spacer-top={`${data.cockpit.spacerTop.x.toFixed(3)},${data.cockpit.spacerTop.y.toFixed(3)}`}
      data-stem-spacer-anchor={`${data.cockpit.stemSpacerAnchor.x.toFixed(3)},${data.cockpit.stemSpacerAnchor.y.toFixed(3)}`}
      data-stem-handlebar-anchor={`${data.cockpit.stemHandlebarAnchor.x.toFixed(3)},${data.cockpit.stemHandlebarAnchor.y.toFixed(3)}`}
      data-handlebar-clamp-anchor={`${data.cockpit.handlebarClampAnchor.x.toFixed(3)},${data.cockpit.handlebarClampAnchor.y.toFixed(3)}`}
      data-stem-base={`${data.cockpit.stemBase.x.toFixed(3)},${data.cockpit.stemBase.y.toFixed(3)}`}
      data-handlebar-clamp={`${data.cockpit.handlebarClamp.x.toFixed(3)},${data.cockpit.handlebarClamp.y.toFixed(3)}`}
      data-fork-head-gap-px={FORK_HEAD_GAP_PX}
      data-fork-visual-top={`${mappedForkTop.x.toFixed(3)},${mappedForkTop.y.toFixed(3)}`}
      data-fork-axle-error-px={forkAxleErrorPx.toFixed(9)}
      data-aero-runtime={isAero ? "v1-stable-standard-topology" : undefined}
      data-aero-seat-tube-axis={isAero ? "bb-to-seat-cluster" : undefined}
      data-aero-seat-tube-geometry-top={isAero ? `${parentAnchors.seatpostSocketAnchor.x.toFixed(3)},${parentAnchors.seatpostSocketAnchor.y.toFixed(3)}` : undefined}
      data-aero-seat-tube-visual-top={isAero ? `${seatTubeVisualTop.x.toFixed(3)},${seatTubeVisualTop.y.toFixed(3)}` : undefined}
      data-aero-seat-tube-visual-extension-px={isAero ? aeroSeatTubeVisualTop.extensionPx.toFixed(6) : undefined}
      data-aero-seat-tube-joint-overlap-px={isAero ? aeroSeatTubeVisualTop.jointOverlapPx.toFixed(6) : undefined}
      data-aero-seatpost-axis={isAero ? "seat-cluster-to-saddle-anchor" : undefined}
      data-aero-seat-stay-joint={isAero ? `${aeroVisualAnchors.seatStayJoint.x.toFixed(3)},${aeroVisualAnchors.seatStayJoint.y.toFixed(3)}` : undefined}
      data-aero-seat-stay-joint-error-px={isAero ? aeroSeatstayJointErrorPx.toFixed(9) : undefined}
      data-aero-chainstay-bb-joint-error-px={isAero ? aeroChainstayBbJointErrorPx.toFixed(9) : undefined}
      data-aero-bb-transform={isAero ? "rigid-uniform-from-bb-center" : undefined}
      data-aero-bb-center-error-px={isAero ? aeroBottomBracketCenterErrorPx.toFixed(9) : undefined}
    >
      {isAllRound && (
        <defs>
          <mask id={allRoundClearanceMaskId} maskUnits="userSpaceOnUse">
            <rect x="-1000" y="-1000" width="3000" height="3000" fill="white" />
            <circle
              cx={projected.frontAxle.x}
              cy={projected.frontAxle.y}
              r={wheelDiameter / 2 + ALL_ROUND_DOWN_TUBE_MASK_CLEARANCE_PX}
              fill="black"
            />
          </mask>
        </defs>
      )}
      {/* SVG render order follows the reversed Figma layer panel, except the
          user-prioritized chainring and drive crank render above all production parts. */}
      {!frameOnly && <>
      <MotionLayer center={projected.bottomBracket} durationSeconds={PREVIEW_MOTION_CONFIG.crankDurationSeconds} phaseOffset={180} renderLayer="non-drive-crank" syncGroup="crankset">
        <g
          data-non-drive-crank-mirror="scaleX(-1)"
          data-non-drive-crank-mirror-axis-x={nonDriveCrankMirrorAxisX}
          data-non-drive-crank-base-error-px={nonDriveCrankBaseErrorPx.toFixed(9)}
          data-non-drive-crank-pedal-error-px={nonDriveCrankPedalErrorPx.toFixed(9)}
        >
          <TemplateAsset asset={components.crank.visualResource} layer={components.crank.sourceBounds} transform={nonDriveCrankMatrix} className="figma-bike__component figma-bike__non-drive-crank" />
        </g>
      </MotionLayer>
      <FixedRotor axle={data.frame.frontAxle} asset={brakeDisc} layer={layers.frontRotor} project={project} renderLayer="front-rotor" />
      <FixedWheel axle={data.frame.rearAxle} wheel={components.rearWheel} tire={components.tire} layer={layers.rearWheel} project={project} renderLayer="rear-wheel" side="rear" />
      <FixedCassette cassette={components.cassette} center={projected.rearAxle} renderLayer="cassette" />
      <FixedWheel axle={data.frame.frontAxle} wheel={components.frontWheel} tire={components.tire} layer={layers.frontWheel} project={project} renderLayer="front-wheel" side="front" />
      <TemplateAsset asset={activeSeatpostAsset} layer={activeSeatpostLayer} transform={seatpostMatrix} className={`figma-bike__component figma-bike__seatpost${isAero ? " figma-bike__seatpost--aero" : ""}`} renderLayer="seatpost" />
      <TemplateAsset asset={saddle} layer={layers.saddle} transform={saddleMatrix} className="figma-bike__component figma-bike__saddle" renderLayer="saddle" />
      <g className="figma-bike__cockpit" data-render-layer="cockpit">
        {data.cockpit.totalSpacerStackHeight > 0 && (
          <TemplateAsset asset={activeSpacerAsset} layer={activeSpacerLayer} transform={spacerMatrix} className="figma-bike__component figma-bike__spacer" />
        )}
        <ProgrammaticStem start={projected.stemSpacerAnchor} end={projected.stemHandlebarAnchor} />
        <g className="figma-bike__handlebar-assembly" data-handlebar-position-binding="shared-handlebar-matrix">
          <TemplateAsset asset={activeHandlebarHoodAsset} layer={activeHandlebarHoodLayer} transform={handlebarMatrix} className="figma-bike__component figma-bike__handlebar figma-bike__handlebar-hood" />
          <TemplateAsset asset={handlebarTapeAsset} layer={activeHandlebarTapeLayer} transform={handlebarMatrix} className="figma-bike__component figma-bike__handlebar figma-bike__handlebar-tape" />
        </g>
      </g>
      </>}
      <TemplateAsset asset={forkAsset} layer={forkLayer} transform={forkMatrix} className="figma-bike__fork" renderLayer="fork" />
      <g className="figma-bike__frame-stack" data-render-layer="frame" data-frame-color={components.frameColor}>
        {isAero ? <>
          <path
            d={aeroDownTubeShape.path}
            fill={components.frameColor}
            className="figma-bike__frame-part figma-bike__down-tube figma-bike__down-tube--aero-programmatic"
            data-render-layer="down-tube-programmatic-aero"
            data-shape-points="bb-upper head-upper head-lower bb-lower"
          />
          <path
            d={programmaticTopTubeShape.path}
            fill={components.frameColor}
            className="figma-bike__frame-part figma-bike__top-tube figma-bike__top-tube--aero-programmatic"
            data-render-layer="top-tube-programmatic-aero"
            data-shape-points="seat-upper head-upper head-lower seat-lower"
          />
          <path
            d={programmaticAeroHeadTubeShape.path}
            fill={components.frameColor}
            className="figma-bike__frame-part figma-bike__head-tube figma-bike__head-tube--aero-programmatic"
            data-render-layer="head-tube-programmatic-aero"
            data-shape-points="bottom-seatward top-seatward top-frontward bottom-frontward"
          />
          <TemplateAsset asset={frameAssets.aeroChainstay} layer={aeroLayers.frameChainstay} transform={aeroChainstayMatrix} className="figma-bike__frame-part figma-bike__chainstay figma-bike__chainstay--aero" />
          <TemplateAsset asset={frameAssets.aeroSeatstay} layer={aeroLayers.frameSeatstay} transform={aeroSeatstayMatrix} className="figma-bike__frame-part figma-bike__seatstay figma-bike__seatstay--aero" />
          <path
            d={programmaticSeatTubeShape.path}
            fill={components.frameColor}
            className="figma-bike__frame-part figma-bike__seat-tube figma-bike__seat-tube--aero-programmatic"
            data-render-layer="seat-tube-programmatic-aero"
            data-shape-points="bb-headward top-headward top-rearward bb-rearward"
          />
          <TemplateAsset asset={frameAssets.aeroBottomBracket} layer={aeroLayers.frameBottomBracket} transform={aeroBottomBracketMatrix} className="figma-bike__frame-part figma-bike__bottom-bracket figma-bike__bottom-bracket--aero" />
        </> : <>
          {isAllRound ? (
            <g
              mask={`url(#${allRoundClearanceMaskId})`}
              data-all-round-down-tube-clearance-mask={ALL_ROUND_DOWN_TUBE_MASK_CLEARANCE_PX}
            >
              <TemplateAsset asset={frameAssets.downTube} layer={downTubeLayer} transform={downTubeMatrix} className="figma-bike__frame-part figma-bike__down-tube figma-bike__down-tube--all-round" />
            </g>
          ) : (
            <TemplateAsset asset={frameAssets.downTube} layer={downTubeLayer} transform={downTubeMatrix} className="figma-bike__frame-part figma-bike__down-tube" />
          )}
          {isAllRound ? (
            <path
              d={programmaticTopTubeShape.path}
              fill={components.frameColor}
              className="figma-bike__frame-part figma-bike__top-tube figma-bike__top-tube--all-round-programmatic"
              data-render-layer="top-tube-programmatic-all-round"
              data-shape-points="seat-upper head-upper head-lower seat-lower"
            />
          ) : (
            <TemplateAsset asset={frameAssets.topTube} layer={topTubeLayer} transform={topTubeMatrix} className="figma-bike__frame-part figma-bike__top-tube" />
          )}
          <TemplateAsset asset={frameAssets.headTube} layer={headTubeLayer} transform={headTubeMatrix} className="figma-bike__frame-part figma-bike__head-tube" />
          <TemplateAsset asset={frameAssets.chainstay} layer={chainstayLayer} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__chainstay" />
          <TemplateAsset asset={frameAssets.seatstay} layer={seatstayLayer} transform={seatStayMatrix} className="figma-bike__frame-part figma-bike__seatstay" />
          {isAllRound ? (
            <path
              d={programmaticSeatTubeShape.path}
              fill={components.frameColor}
              className="figma-bike__frame-part figma-bike__seat-tube figma-bike__seat-tube--all-round-programmatic"
              data-render-layer="seat-tube-programmatic-all-round"
              data-shape-points="bb-headward top-headward top-rearward bb-rearward"
            />
          ) : (
            <TemplateAsset asset={frameAssets.seatTube} layer={seatTubeLayer} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__seat-tube" />
          )}
          <TemplateAsset asset={frameAssets.bottomBracket} layer={bottomBracketLayer} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__bottom-bracket" />
        </>}
      </g>
      {!frameOnly && <>
      <TemplateAsset asset={chain} layer={layers.chain} transform={drivetrainMatrix} className="figma-bike__component figma-bike__chain" renderLayer="chain" />
      <TemplateAsset asset={components.drivetrain.visualResource} layer={components.drivetrain.sourceBounds} transform={rearMatrix} className="figma-bike__component figma-bike__drivetrain" renderLayer="drivetrain" />
      <MotionLayer center={projected.bottomBracket} durationSeconds={PREVIEW_MOTION_CONFIG.crankDurationSeconds} renderLayer="chainring" syncGroup="crankset">
        <g
          transform={`rotate(${chainringCrankAlignmentAngleDeg} ${projected.bottomBracket.x} ${projected.bottomBracket.y})`}
          data-chainring-crank-alignment-angle={chainringCrankAlignmentAngleDeg.toFixed(6)}
          data-chainring-alignment-source="drive-crank-axis"
        >
          <TemplateAsset asset={components.chainring.visualResource} layer={components.chainring.sourceBounds} transform={bbMatrix} className="figma-bike__component figma-bike__chainring" />
        </g>
      </MotionLayer>
      <MotionLayer center={projected.bottomBracket} durationSeconds={PREVIEW_MOTION_CONFIG.crankDurationSeconds} renderLayer="drive-crank" syncGroup="crankset">
        <TemplateAsset asset={components.crank.visualResource} layer={components.crank.sourceBounds} transform={driveCrankMatrix} className="figma-bike__component figma-bike__drive-crank" />
        {showContactPoints && <PedalContactMarker point={projected.pedalAnchor} />}
      </MotionLayer>
      {showFigmaAnchors && (
        <FigmaAnchorDebug
          matrices={matrices}
          parentAnchors={parentAnchors}
          topTubeVisualAnchors={{
            topTubeSeatJoint,
            topTubeHeadJoint,
            sourceSeatJoint: isAllRound || isAero ? topTubeSourceSeatJoint : sourceAnchors.seatTubeTop,
            sourceHeadJoint: isAllRound || isAero ? topTubeSourceHeadJoint : sourceAnchors.headTubeTop,
          }}
          downTubeVisualAnchors={{ downTubeBbJoint, downTubeHeadJoint }}
          cockpitVisualAnchors={{
            spacerTopAnchor: projected.spacerTop,
            spacerBottomAnchor: projected.spacerHeadtubeAnchor,
            stemBaseAnchor: projected.stemSpacerAnchor,
            stemHandlebarAnchor: projected.stemHandlebarAnchor,
          }}
          seatpostAnchors={seatpostAnchors}
          seatpostAssetAnchors={activeSeatpostAssetAnchors}
          forkVisualTop={forkVisualTop}
          forkAssetAnchors={activeForkAssetAnchors}
          headTubeDebug={headTubeDebug}
        />
      )}
      {showContactPoints && (
        <g className="contact-point-overlay" data-render-layer="contact-points">
          <HandlebarContactMarker point={handlebarContactPoint} />
        </g>
      )}
      </>}
    </g>
  );
}

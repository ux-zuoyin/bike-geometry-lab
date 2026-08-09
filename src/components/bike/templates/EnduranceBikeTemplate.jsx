import brakeDisc from "../../../assets/bikeTemplates/endurance/brake-disc.svg";
import seatpost from "../../../assets/bikeTemplates/endurance/seatpost.svg";
import saddle from "../../../assets/bikeTemplates/endurance/saddle.svg";
import spacer from "../../../assets/bikeTemplates/endurance/spacer.svg";
import handlebarHood from "../../../assets/bikeTemplates/endurance/handlebar-hood.svg";
import handlebarTapeSource from "../../../assets/bikeTemplates/endurance/handlebar-tape.svg?raw";
import forkSource from "../../../assets/bikeTemplates/endurance/fork.svg?raw";
import frameDownTubeSource from "../../../assets/bikeTemplates/endurance/frame-down-tube.svg?raw";
import frameTopTubeSource from "../../../assets/bikeTemplates/endurance/frame-top-tube.svg?raw";
import frameHeadTubeSource from "../../../assets/bikeTemplates/endurance/frame-head-tube.svg?raw";
import frameChainstaySource from "../../../assets/bikeTemplates/endurance/frame-chainstay.svg?raw";
import frameSeatstaySource from "../../../assets/bikeTemplates/endurance/frame-seatstay.svg?raw";
import frameSeatTubeSource from "../../../assets/bikeTemplates/endurance/frame-seat-tube.svg?raw";
import frameBottomBracketSource from "../../../assets/bikeTemplates/endurance/frame-bottom-bracket.svg?raw";
import chain from "../../../assets/bikeTemplates/endurance/chain.svg";
import {
  FIGMA_ENDURANCE_TEMPLATE,
  affineFromThreePoints,
  applyMatrix,
  composeMatrices,
  matrixValue,
  orientedSegmentTransform,
  resolveAssetAnchor,
  similarityFromTwoPoints,
  uniformAroundPoint,
} from "../../../lib/bikeVisual/figmaEnduranceTemplate.js";
import { getSeatpostVisualAnchors } from "../../../lib/bikeVisual/seatpostGeometry.js";
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

const { anchors: sourceAnchors, layers } = FIGMA_ENDURANCE_TEMPLATE;
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

function FigmaAnchorDebug({ matrices, parentAnchors, cockpitVisualAnchors, seatpostAnchors, forkVisualTop, headTubeDebug }) {
  const pairs = [
    {
      key: "seatpost",
      parentLabel: "SeatpostSocketAnchor",
      childLabel: "SeatpostBottom",
      parent: parentAnchors.seatpostSocketAnchor,
      child: applyMatrix(matrices.seatpost, assetAnchors.seatpostBottom),
    },
    {
      key: "seatpost-top",
      parentLabel: "SaddleClampAnchor",
      childLabel: "SeatpostTop",
      parent: seatpostAnchors.saddleClampAnchor,
      child: applyMatrix(matrices.seatpost, assetAnchors.seatpostTop),
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
      child: applyMatrix(matrices.fork, assetAnchors.forkTop),
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
      parentLabel: "SeatCluster",
      childLabel: "TopTubeRear",
      parent: parentAnchors.seatpostSocketAnchor,
      child: applyMatrix(matrices.topTube, sourceAnchors.seatTubeTop),
    },
    {
      key: "top-tube-front",
      parentLabel: "HeadTop",
      childLabel: "TopTubeFront",
      parent: parentAnchors.headTop,
      child: applyMatrix(matrices.topTube, sourceAnchors.headTubeTop),
    },
    {
      key: "down-tube-rear",
      parentLabel: "BB",
      childLabel: "DownTubeRear",
      parent: parentAnchors.bottomBracket,
      child: applyMatrix(matrices.downTube, sourceAnchors.bottomBracket),
    },
    {
      key: "down-tube-front",
      parentLabel: "HeadBottom",
      childLabel: "DownTubeFront",
      parent: parentAnchors.headBottom,
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
          points={`${parentAnchors.bottomBracket.x},${parentAnchors.bottomBracket.y} ${parentAnchors.seatpostSocketAnchor.x},${parentAnchors.seatpostSocketAnchor.y} ${seatpostAnchors.seatpostTop.x},${seatpostAnchors.seatpostTop.y}`}
        />
        {[
          ["BB", parentAnchors.bottomBracket],
          ["SeatpostSocketAnchor", parentAnchors.seatpostSocketAnchor],
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

export function EnduranceBikeTemplate({
  data,
  project,
  showFigmaAnchors = false,
  showContactPoints = true,
  componentSetup,
  motionStopped = false,
}) {
  const components = componentSetup ?? resolveComponentSetup(DEFAULT_COMPONENT_SETUP);
  const frameAssets = {
    downTube: colorizedSvgAsset(frameDownTubeSource, "black", components.frameColor),
    topTube: colorizedSvgAsset(frameTopTubeSource, "black", components.frameColor),
    headTube: colorizedSvgAsset(frameHeadTubeSource, "black", components.frameColor),
    chainstay: colorizedSvgAsset(frameChainstaySource, "black", components.frameColor),
    seatstay: colorizedSvgAsset(frameSeatstaySource, "black", components.frameColor),
    seatTube: colorizedSvgAsset(frameSeatTubeSource, "black", components.frameColor),
    bottomBracket: colorizedSvgAsset(frameBottomBracketSource, "black", components.frameColor),
  };
  const forkAsset = colorizedSvgAsset(forkSource, "black", components.forkColor);
  const handlebarTapeAsset = colorizedSvgAsset(handlebarTapeSource, "#D9D9D9", components.barTapeColor);
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
  const parentAnchors = {
    bottomBracket: applyMatrix(frameBodyMatrix, sourceAnchors.bottomBracket),
    seatpostSocketAnchor: applyMatrix(frameBodyMatrix, sourceAnchors.seatpostSocketAnchor),
    headTop: projected.headTubeTop,
    headBottom: projected.headTubeBottom,
  };
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
  const seatpostAnchors = getSeatpostVisualAnchors({
    bottomBracket: parentAnchors.bottomBracket,
    socketAnchor: parentAnchors.seatpostSocketAnchor,
    saddleClampReference: projected.saddleClampAnchor,
    saddleVisualReference: projected.saddleVisualAnchor,
    saddleContactReference: projected.saddleContactPoint,
  });
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
    assetAnchors.forkTop,
    assetAnchors.forkAxle,
    forkVisualTop,
    projected.frontAxle,
    figmaShapeScale,
  );
  const mappedForkTop = applyMatrix(forkMatrix, assetAnchors.forkTop);
  const mappedForkAxle = applyMatrix(forkMatrix, assetAnchors.forkAxle);
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
  const headTubeMatrix = composeMatrices(headTubeDeltaMatrix, baseHeadTubeMatrix);
  headTubeDebug.deltaIdentityError = identityMatrixError(headTubeDeltaMatrix);

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
  const topTubeMatrix = composeMatrices(topTubeDeltaMatrix, baseTopTubeMatrix);

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
  const downTubeMatrix = composeMatrices(downTubeDeltaMatrix, baseDownTubeMatrix);
  const seatpostMatrix = orientedSegmentTransform(
    assetAnchors.seatpostBottom,
    assetAnchors.seatpostTop,
    parentAnchors.seatpostSocketAnchor,
    seatpostAnchors.seatpostTop,
    figmaShapeScale,
  );
  const saddleMatrix = uniformAroundPoint(sourceAnchors.saddleAnchor, seatpostAnchors.saddleVisualAnchor, figmaShapeScale);
  const spacerMatrix = orientedSegmentTransform(
    assetAnchors.spacerHeadtubeAnchor,
    assetAnchors.spacerVisualAxisEnd,
    projected.spacerHeadtubeAnchor,
    projected.spacerTop,
    figmaShapeScale,
  );
  const handlebarMatrix = uniformAroundPoint(
    assetAnchors.handlebarClampAnchor,
    projected.handlebarClampAnchor,
    figmaShapeScale,
  );
  const handlebarContactPoint = applyMatrix(handlebarMatrix, sourceAnchors.handlebarAnchor);
  const mappedStemBaseAnchor = projected.stemSpacerAnchor;
  const mappedStemHandlebarAnchor = projected.stemHandlebarAnchor;
  const mappedHandlebarClampAnchor = applyMatrix(handlebarMatrix, assetAnchors.handlebarClampAnchor);
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
      data-template="figma-endurance-v1"
      data-source-node="1:823"
      data-frame-visual-baseline-size={ENDURANCE_VISUAL_BASE_SIZE}
      data-frame-mapping="split-geometry-anchors"
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
    >
      {/* SVG render order follows the reversed Figma layer panel, except the
          user-prioritized chainring and drive crank render above all production parts. */}
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
      <TemplateAsset asset={seatpost} layer={layers.seatpost} transform={seatpostMatrix} className="figma-bike__component figma-bike__seatpost" renderLayer="seatpost" />
      <TemplateAsset asset={saddle} layer={layers.saddle} transform={saddleMatrix} className="figma-bike__component figma-bike__saddle" renderLayer="saddle" />
      <g className="figma-bike__cockpit" data-render-layer="cockpit">
        {data.cockpit.totalSpacerStackHeight > 0 && (
          <TemplateAsset asset={spacer} layer={layers.spacer} transform={spacerMatrix} className="figma-bike__component figma-bike__spacer" />
        )}
        <ProgrammaticStem start={projected.stemSpacerAnchor} end={projected.stemHandlebarAnchor} />
        <g className="figma-bike__handlebar-assembly" data-handlebar-position-binding="shared-handlebar-matrix">
          <TemplateAsset asset={handlebarHood} layer={layers.handlebarHood} transform={handlebarMatrix} className="figma-bike__component figma-bike__handlebar figma-bike__handlebar-hood" />
          <TemplateAsset asset={handlebarTapeAsset} layer={layers.handlebarTape} transform={handlebarMatrix} className="figma-bike__component figma-bike__handlebar figma-bike__handlebar-tape" />
        </g>
      </g>
      <TemplateAsset asset={forkAsset} layer={layers.fork} transform={forkMatrix} className="figma-bike__fork" renderLayer="fork" />
      <g className="figma-bike__frame-stack" data-render-layer="frame" data-frame-color={components.frameColor}>
        <TemplateAsset asset={frameAssets.downTube} layer={layers.frameDownTube} transform={downTubeMatrix} className="figma-bike__frame-part figma-bike__down-tube" />
        <TemplateAsset asset={frameAssets.topTube} layer={layers.frameTopTube} transform={topTubeMatrix} className="figma-bike__frame-part figma-bike__top-tube" />
        <TemplateAsset asset={frameAssets.headTube} layer={layers.frameHeadTube} transform={headTubeMatrix} className="figma-bike__frame-part figma-bike__head-tube" />
        <TemplateAsset asset={frameAssets.chainstay} layer={layers.frameChainstay} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__chainstay" />
        <TemplateAsset asset={frameAssets.seatstay} layer={layers.frameSeatstay} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__seatstay" />
        <TemplateAsset asset={frameAssets.seatTube} layer={layers.frameSeatTube} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__seat-tube" />
        <TemplateAsset asset={frameAssets.bottomBracket} layer={layers.frameBottomBracket} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__bottom-bracket" />
      </g>
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
          cockpitVisualAnchors={{
            spacerTopAnchor: projected.spacerTop,
            spacerBottomAnchor: projected.spacerHeadtubeAnchor,
            stemBaseAnchor: projected.stemSpacerAnchor,
            stemHandlebarAnchor: projected.stemHandlebarAnchor,
          }}
          seatpostAnchors={seatpostAnchors}
          forkVisualTop={forkVisualTop}
          headTubeDebug={headTubeDebug}
        />
      )}
      {showContactPoints && (
        <g className="contact-point-overlay" data-render-layer="contact-points">
          <HandlebarContactMarker point={handlebarContactPoint} />
        </g>
      )}
    </g>
  );
}

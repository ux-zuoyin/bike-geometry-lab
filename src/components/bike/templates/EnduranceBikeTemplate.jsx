import frontRotor from "../../../assets/bikeTemplates/endurance/front-rotor.svg";
import rearRotor from "../../../assets/bikeTemplates/endurance/rear-rotor.svg";
import cassette from "../../../assets/bikeTemplates/endurance/cassette.svg";
import wheel from "../../../assets/bikeTemplates/endurance/wheel.svg";
import seatpost from "../../../assets/bikeTemplates/endurance/seatpost.svg";
import saddle from "../../../assets/bikeTemplates/endurance/saddle.svg";
import stem from "../../../assets/bikeTemplates/endurance/stem.svg";
import handlebar from "../../../assets/bikeTemplates/endurance/handlebar.svg";
import fork from "../../../assets/bikeTemplates/endurance/fork.svg";
import frameDownTube from "../../../assets/bikeTemplates/endurance/frame-down-tube.svg";
import frameTopTube from "../../../assets/bikeTemplates/endurance/frame-top-tube.svg";
import frameHeadTube from "../../../assets/bikeTemplates/endurance/frame-head-tube.svg";
import frameChainstay from "../../../assets/bikeTemplates/endurance/frame-chainstay.svg";
import frameSeatstay from "../../../assets/bikeTemplates/endurance/frame-seatstay.svg";
import frameSeatTube from "../../../assets/bikeTemplates/endurance/frame-seat-tube.svg";
import frameBottomBracket from "../../../assets/bikeTemplates/endurance/frame-bottom-bracket.svg";
import chainring from "../../../assets/bikeTemplates/endurance/chainring.svg";
import driveCrank from "../../../assets/bikeTemplates/endurance/drive-crank.svg";
import nonDriveCrank from "../../../assets/bikeTemplates/endurance/non-drive-crank.svg";
import chain from "../../../assets/bikeTemplates/endurance/chain.svg";
import derailleur from "../../../assets/bikeTemplates/endurance/derailleur.svg";
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
import { getFramePoints, PROJECT_SCALE, WHEEL_RADIUS } from "../../../lib/geometry/frameGeometry.js";
import {
  ENDURANCE_VISUAL_BASE_GEOMETRY,
  ENDURANCE_VISUAL_BASE_SIZE,
  getEnduranceVisualDelta,
} from "../../../data/enduranceGeometry.js";

const { anchors: sourceAnchors, layers } = FIGMA_ENDURANCE_TEMPLATE;
const wheelDiameter = WHEEL_RADIUS * 2 * PROJECT_SCALE;
const wheelScale = wheelDiameter / layers.rearWheel.width;
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
      data-figma-node-id={layer.nodeId}
      data-render-layer={renderLayer}
    />
  );
}

function MotionLayer({ children, center, durationSeconds, enabled, phaseOffset = 0, renderLayer, syncGroup }) {
  const rotation = getRotationAnimation(center);
  return (
    <g
      className="figma-bike__motion-layer"
      data-render-layer={renderLayer}
      data-motion-enabled={enabled ? "true" : "false"}
      data-motion-origin-x={center.x}
      data-motion-origin-y={center.y}
      data-motion-duration={durationSeconds}
      data-motion-phase-offset={phaseOffset}
      data-motion-sync-group={syncGroup}
    >
      {enabled && (
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
      )}
      {children}
    </g>
  );
}

function FixedRotor({ axle, asset, layer, motionEnabled, project, renderLayer }) {
  const center = project(axle);
  const rotorTransform = uniformAroundPoint(
    { x: layer.x + layer.width / 2, y: layer.y + layer.height / 2 },
    center,
    wheelScale,
  );

  return (
    <MotionLayer
      center={center}
      durationSeconds={PREVIEW_MOTION_CONFIG.wheelDurationSeconds}
      enabled={motionEnabled}
      renderLayer={renderLayer}
      syncGroup="wheels"
    >
      <TemplateAsset asset={asset} layer={layer} transform={rotorTransform} className="figma-bike__rotor" />
    </MotionLayer>
  );
}

function FixedWheel({ axle, layer, motionEnabled, project, renderLayer }) {
  const center = project(axle);
  const wheelBox = {
    ...layer,
    x: center.x - wheelDiameter / 2,
    y: center.y - wheelDiameter / 2,
    width: wheelDiameter,
    height: wheelDiameter,
  };

  return (
    <MotionLayer
      center={center}
      durationSeconds={PREVIEW_MOTION_CONFIG.wheelDurationSeconds}
      enabled={motionEnabled}
      renderLayer={renderLayer}
      syncGroup="wheels"
    >
      <TemplateAsset asset={wheel} layer={wheelBox} className="figma-bike__wheel-asset" />
    </MotionLayer>
  );
}

function FigmaAnchorDebug({ matrices, parentAnchors, seatpostAnchors, headTubeDebug }) {
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
      key: "stem",
      parentLabel: "HeadTop",
      childLabel: "StemBase",
      parent: parentAnchors.headTop,
      child: applyMatrix(matrices.stem, assetAnchors.stemBase),
    },
    {
      key: "fork",
      parentLabel: "HeadBottom",
      childLabel: "ForkTop",
      parent: parentAnchors.headBottom,
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
    <g className="figma-anchor-debug" aria-label="Figma component connection anchors" data-render-layer="anchors">
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

export function EnduranceBikeTemplate({ data, motionEnabled = false, project, showFigmaAnchors = false }) {
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
  const forkMatrix = orientedSegmentTransform(
    assetAnchors.forkTop,
    assetAnchors.forkAxle,
    parentAnchors.headBottom,
    projected.frontAxle,
    wheelScale,
  );
  const baseHeadTubeMatrix = orientedSegmentTransform(
    sourceAnchors.headTubeTop,
    sourceAnchors.headTubeBottom,
    baseProjected.headTubeTop,
    baseProjected.headTubeBottom,
    wheelScale,
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
    wheelScale,
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
    wheelScale,
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
    wheelScale,
  );
  const saddleMatrix = uniformAroundPoint(sourceAnchors.saddleAnchor, seatpostAnchors.saddleVisualAnchor, wheelScale);
  const stemMatrix = orientedSegmentTransform(
    assetAnchors.stemBase,
    assetAnchors.stemClamp,
    parentAnchors.headTop,
    projected.stemEnd,
    wheelScale,
  );
  const handlebarMatrix = similarityFromTwoPoints(
    assetAnchors.handlebarClamp,
    sourceAnchors.handlebarAnchor,
    projected.stemEnd,
    projected.handlebarAnchor,
  );
  const driveCrankMatrix = similarityFromTwoPoints(
    sourceAnchors.bottomBracket,
    sourceAnchors.drivePedal,
    projected.bottomBracket,
    projected.pedalAnchor,
  );
  const oppositePedal = oppositePointAround(projected.bottomBracket, projected.pedalAnchor);
  const nonDriveCrankMatrix = similarityFromTwoPoints(
    sourceAnchors.bottomBracket,
    sourceAnchors.nonDrivePedal,
    projected.bottomBracket,
    oppositePedal,
  );
  const drivetrainMatrix = similarityFromTwoPoints(
    sourceAnchors.rearAxle,
    sourceAnchors.bottomBracket,
    projected.rearAxle,
    projected.bottomBracket,
  );
  const bbMatrix = uniformAroundPoint(sourceAnchors.bottomBracket, projected.bottomBracket, wheelScale);
  const rearMatrix = uniformAroundPoint(sourceAnchors.rearAxle, projected.rearAxle, wheelScale);
  const matrices = {
    fork: forkMatrix,
    seatpost: seatpostMatrix,
    stem: stemMatrix,
    headTube: headTubeMatrix,
    topTube: topTubeMatrix,
    downTube: downTubeMatrix,
  };

  return (
    <g
      className="figma-bike-template"
      data-template="figma-endurance-v1"
      data-source-node="1:823"
      data-frame-visual-baseline-size="56"
      data-frame-mapping="split-geometry-anchors"
      data-stack-delta={visualDelta.stack}
      data-reach-delta={visualDelta.reach}
      data-head-tube-delta={visualDelta.headTube}
      data-head-angle-delta={visualDelta.headAngle.toFixed(1)}
      data-wheelbase-delta={visualDelta.wheelbase}
      data-head-tube-visual-scale={visualDelta.headTubeScale.toFixed(6)}
      data-frame-body-delta-identity-error={identityMatrixError(frameBodyDeltaMatrix).toFixed(9)}
      data-head-tube-delta-identity-error={identityMatrixError(headTubeDeltaMatrix).toFixed(9)}
      data-top-tube-delta-identity-error={identityMatrixError(topTubeDeltaMatrix).toFixed(9)}
      data-down-tube-delta-identity-error={identityMatrixError(downTubeDeltaMatrix).toFixed(9)}
      data-preview-motion={motionEnabled ? "on" : "off"}
    >
      {/* SVG render order is intentionally reversed from Figma layer panel.
          Do not reorder without checking the Figma EnduranceBike source. */}
      <FixedRotor axle={data.frame.frontAxle} asset={frontRotor} layer={layers.frontRotor} motionEnabled={motionEnabled} project={project} renderLayer="front-rotor" />
      <FixedRotor axle={data.frame.rearAxle} asset={rearRotor} layer={layers.rearRotor} motionEnabled={motionEnabled} project={project} renderLayer="rear-rotor" />
      <TemplateAsset asset={cassette} layer={layers.cassette} transform={rearMatrix} className="figma-bike__component figma-bike__cassette" renderLayer="cassette" />
      <MotionLayer center={projected.bottomBracket} durationSeconds={PREVIEW_MOTION_CONFIG.crankDurationSeconds} enabled={motionEnabled} phaseOffset={180} renderLayer="non-drive-crank" syncGroup="crankset">
        <TemplateAsset asset={nonDriveCrank} layer={layers.nonDriveCrank} transform={nonDriveCrankMatrix} className="figma-bike__component figma-bike__non-drive-crank" />
      </MotionLayer>
      <FixedWheel axle={data.frame.rearAxle} layer={layers.rearWheel} motionEnabled={motionEnabled} project={project} renderLayer="rear-wheel" />
      <FixedWheel axle={data.frame.frontAxle} layer={layers.frontWheel} motionEnabled={motionEnabled} project={project} renderLayer="front-wheel" />
      <TemplateAsset asset={seatpost} layer={layers.seatpost} transform={seatpostMatrix} className="figma-bike__component figma-bike__seatpost" renderLayer="seatpost" />
      <TemplateAsset asset={saddle} layer={layers.saddle} transform={saddleMatrix} className="figma-bike__component figma-bike__saddle" renderLayer="saddle" />
      <g className="figma-bike__cockpit" data-render-layer="cockpit">
        <TemplateAsset asset={stem} layer={layers.stem} transform={stemMatrix} className="figma-bike__component figma-bike__stem" />
        <TemplateAsset asset={handlebar} layer={layers.handlebar} transform={handlebarMatrix} className="figma-bike__component figma-bike__handlebar" />
      </g>
      <TemplateAsset asset={fork} layer={layers.fork} transform={forkMatrix} className="figma-bike__fork" renderLayer="fork" />
      <g className="figma-bike__frame-stack" data-render-layer="frame">
        <TemplateAsset asset={frameDownTube} layer={layers.frameDownTube} transform={downTubeMatrix} className="figma-bike__frame-part figma-bike__down-tube" />
        <TemplateAsset asset={frameTopTube} layer={layers.frameTopTube} transform={topTubeMatrix} className="figma-bike__frame-part figma-bike__top-tube" />
        <TemplateAsset asset={frameHeadTube} layer={layers.frameHeadTube} transform={headTubeMatrix} className="figma-bike__frame-part figma-bike__head-tube" />
        <TemplateAsset asset={frameChainstay} layer={layers.frameChainstay} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__chainstay" />
        <TemplateAsset asset={frameSeatstay} layer={layers.frameSeatstay} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__seatstay" />
        <TemplateAsset asset={frameSeatTube} layer={layers.frameSeatTube} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__seat-tube" />
        <TemplateAsset asset={frameBottomBracket} layer={layers.frameBottomBracket} transform={frameBodyMatrix} className="figma-bike__frame-part figma-bike__bottom-bracket" />
      </g>
      <MotionLayer center={projected.bottomBracket} durationSeconds={PREVIEW_MOTION_CONFIG.crankDurationSeconds} enabled={motionEnabled} renderLayer="chainring" syncGroup="crankset">
        <TemplateAsset asset={chainring} layer={layers.chainring} transform={bbMatrix} className="figma-bike__component figma-bike__chainring" />
      </MotionLayer>
      <MotionLayer center={projected.bottomBracket} durationSeconds={PREVIEW_MOTION_CONFIG.crankDurationSeconds} enabled={motionEnabled} renderLayer="drive-crank" syncGroup="crankset">
        <TemplateAsset asset={driveCrank} layer={layers.driveCrank} transform={driveCrankMatrix} className="figma-bike__component figma-bike__drive-crank" />
      </MotionLayer>
      <TemplateAsset asset={chain} layer={layers.chain} transform={drivetrainMatrix} className="figma-bike__component figma-bike__chain" renderLayer="chain" />
      <TemplateAsset asset={derailleur} layer={layers.derailleur} transform={rearMatrix} className="figma-bike__component figma-bike__derailleur" renderLayer="derailleur" />
      {showFigmaAnchors && (
        <FigmaAnchorDebug
          matrices={matrices}
          parentAnchors={parentAnchors}
          seatpostAnchors={seatpostAnchors}
          headTubeDebug={headTubeDebug}
        />
      )}
    </g>
  );
}

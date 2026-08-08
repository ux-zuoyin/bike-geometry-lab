import { useMemo, useState } from "react";
import { Crosshair, MagnifyingGlassMinus, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { buildBikeGeometry } from "../../lib/geometry/index.js";
import { createProjector, WHEEL_RADIUS } from "../../lib/geometry/frameGeometry.js";
import { bikeArchetypes } from "../../config/bikeArchetypes.js";
import { PREVIEW_MOTION_CONFIG } from "../../lib/bikeVisual/previewMotion.js";
import { Switch } from "../ui/Stepper.jsx";
import { RoadBikeVisual } from "./bikeParts/RoadBikeVisual.jsx";
import { GeometrySkeleton } from "./GeometrySkeleton.jsx";
import { AngleIndicator, ContactPoint, DimensionLine } from "./annotations.jsx";

const IS_DEVELOPMENT = import.meta.env.DEV;

function BikeLayer({ data, motionEnabled, projector, showSkeleton, showFigmaAnchors }) {
  return (
    <g className="bike-layer bike-layer--primary">
      <RoadBikeVisual data={data} motionEnabled={motionEnabled} project={projector} preset={bikeArchetypes.endurance} showFigmaAnchors={showFigmaAnchors} />
      {showSkeleton && <GeometrySkeleton anchors={data.anchors} project={projector} />}
      <ContactPoint point={data.contacts.saddle} project={projector} label="S" kind="saddle" />
      <ContactPoint point={data.contacts.handlebar} project={projector} label="H" kind="handlebar" />
      <ContactPoint point={data.contacts.pedal} project={projector} label="P" kind="pedal" />
    </g>
  );
}

export function BikeVisualizer({ bike, fit }) {
  const [showDimensions, setShowDimensions] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showFigmaAnchors, setShowFigmaAnchors] = useState(false);
  const [previewMotion, setPreviewMotion] = useState(PREVIEW_MOTION_CONFIG.enabledByDefault);
  const data = useMemo(() => buildBikeGeometry(bike.geometry, fit), [bike.geometry, fit]);
  const project = createProjector();
  const wheelbaseY = bike.geometry.bbDrop - WHEEL_RADIUS - 44;

  return (
    <section className="visualizer" aria-label="Trek Domane 自行车几何可视化">
      <div className="visualizer__header">
        <div className="bike-title">
          <span className="eyebrow">TREK DOMANE · ENDURANCE · 7 SIZES</span>
          <h1>{bike.brand} <strong>{bike.model}</strong></h1>
          <p>Size {bike.size} <span /> Stack {bike.geometry.stack} mm <span /> Reach {bike.geometry.reach} mm</p>
        </div>
        <div className="canvas-tools">
          <span className="visual-base-chip">FIGMA BASE · SIZE {bike.visualBaseSize}</span>
          <Switch label="Preview Motion" checked={previewMotion} onChange={setPreviewMotion} />
          <Switch label="显示尺寸" checked={showDimensions} onChange={setShowDimensions} />
        </div>
      </div>

      <div className="canvas-wrap">
        <svg className="bike-canvas" viewBox="0 0 980 620" role="img" aria-label={`${bike.brand} ${bike.model} ${bike.size} 自行车几何图`}>
          <defs>
            <pattern id="microGrid" width="22" height="22" patternUnits="userSpaceOnUse">
              <path d="M 22 0 L 0 0 0 22" fill="none" stroke="#edf0ef" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="980" height="620" fill="url(#microGrid)" opacity="0.45" />
          <g className="zoom-group" style={{ transform: `translate(490px, 310px) scale(${zoom}) translate(-490px, -310px)` }}>
            <BikeLayer
              data={data}
              motionEnabled={previewMotion}
              projector={project}
              showSkeleton={IS_DEVELOPMENT && showSkeleton}
              showFigmaAnchors={IS_DEVELOPMENT && showFigmaAnchors}
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
          </g>
          <g className="bb-origin">
            <circle cx="430" cy="420" r="4" />
            <line x1="408" y1="420" x2="422" y2="420" />
            <line x1="430" y1="428" x2="430" y2="442" />
            <text x="400" y="449">BB 0,0</text>
          </g>
        </svg>
        <div className="zoom-tools" aria-label="画布缩放">
          <button type="button" aria-label="缩小" onClick={() => setZoom((value) => Math.max(0.82, value - 0.06))}><MagnifyingGlassMinus size={18} /></button>
          <button type="button" aria-label="重置缩放" onClick={() => setZoom(1)}><Crosshair size={18} /></button>
          <button type="button" aria-label="放大" onClick={() => setZoom((value) => Math.min(1.18, value + 0.06))}><MagnifyingGlassPlus size={18} /></button>
          <span>{Math.round(zoom * 100)}%</span>
        </div>
        {IS_DEVELOPMENT && (
          <div className="visual-debug-tools" aria-label="Endurance visual calibration tools">
            <span>DEVELOPMENT · VISUAL CALIBRATION</span>
            <Switch label="Show Geometry Skeleton" checked={showSkeleton} onChange={setShowSkeleton} />
            <Switch label="Show Geometry Anchors" checked={showFigmaAnchors} onChange={setShowFigmaAnchors} />
          </div>
        )}
      </div>
    </section>
  );
}

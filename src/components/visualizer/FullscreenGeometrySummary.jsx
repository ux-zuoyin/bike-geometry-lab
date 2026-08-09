const SUMMARY_METRICS = Object.freeze([
  { key: "stackMm", label: "Stack", unit: "mm" },
  { key: "reachMm", label: "Reach", unit: "mm" },
  { key: "headTubeLengthMm", label: "头管长度", unit: "mm" },
  { key: "wheelbaseMm", label: "轴距", unit: "mm" },
]);

const DETAIL_METRICS = Object.freeze([
  { key: "seatTubeLengthMm", label: "座管长度", unit: "mm" },
  { key: "seatTubeAngleDeg", label: "座管角", unit: "°" },
  { key: "headTubeAngleDeg", label: "头管角", unit: "°" },
  { key: "effectiveTopTubeMm", label: "有效上管", unit: "mm" },
  { key: "bbDropMm", label: "五通下沉", unit: "mm" },
  { key: "chainstayMm", label: "后下叉长度", unit: "mm" },
  { key: "forkOffsetMm", label: "前叉偏移", unit: "mm" },
  { key: "trailMm", label: "拖曳距", unit: "mm" },
]);

function displayValue(value) {
  if (value == null || value === "") return "—";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(1);
}

function GeometryDataSection({ title, metrics, displayedBikes, activeBikeIndex }) {
  return (
    <section className="fullscreen-geometry-summary__section">
      <h3>{title}</h3>
      <dl className="fullscreen-geometry-summary__metric-list">
        {metrics.map(({ key, label, unit }) => (
          <div className="fullscreen-geometry-summary__metric-row" key={key}>
            <dt>{label}</dt>
            {displayedBikes.map(({ bike, bikeIndex }) => {
              const display = displayValue(bike.sizeData?.[key]);
              const isMissing = display === "—";
              return (
                <dd
                  className={`fullscreen-geometry-summary__metric-value${bikeIndex === activeBikeIndex ? " is-primary" : " is-secondary"}${isMissing ? " is-missing" : ""}`}
                  aria-label={`${bike.brand} ${bike.model} ${label} ${display}${isMissing ? "" : unit}`}
                  key={bike.id}
                >
                  <strong>{display}</strong>
                  {!isMissing && <small>{unit}</small>}
                </dd>
              );
            })}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function FullscreenGeometrySummary({ bikes, activeBikeIndex, compareEnabled, visible }) {
  if (!bikes.length) return null;

  const safeActiveIndex = activeBikeIndex != null && bikes[activeBikeIndex] ? activeBikeIndex : 0;
  const isComparison = bikes.length === 2 && compareEnabled;
  const displayedBikes = isComparison
    ? bikes.map((bike, bikeIndex) => ({ bike, bikeIndex }))
    : [{ bike: bikes[safeActiveIndex], bikeIndex: safeActiveIndex }];

  return (
    <aside
      className={`fullscreen-geometry-summary${isComparison ? " is-comparison" : " is-single"}${visible ? " is-visible" : ""}`}
      aria-label="全屏几何摘要"
      aria-hidden={!visible}
    >
      <div className={`fullscreen-geometry-summary__data-grid${isComparison ? " is-comparison" : " is-single"}`}>
        <GeometryDataSection title="几何摘要" metrics={SUMMARY_METRICS} displayedBikes={displayedBikes} activeBikeIndex={safeActiveIndex} />
        <GeometryDataSection title="几何详情" metrics={DETAIL_METRICS} displayedBikes={displayedBikes} activeBikeIndex={safeActiveIndex} />
      </div>
    </aside>
  );
}

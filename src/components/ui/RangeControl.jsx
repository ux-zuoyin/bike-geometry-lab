import { useId } from "react";

function decimalPlaces(value) {
  const [, fraction = ""] = String(value).split(".");
  return fraction.length;
}

export function RangeControl({ label, unit, value, min, max, step = 1, signed = false, onChange }) {
  const inputId = useId();
  const progress = max === min ? 0 : (value - min) / (max - min) * 100;
  const hasZeroMarker = min < 0 && max > 0;
  const zeroPosition = hasZeroMarker ? (0 - min) / (max - min) * 100 : 0;
  const precision = decimalPlaces(step);
  const displayValue = signed && value > 0 ? `+${value}` : value;

  const update = (next) => {
    const numericValue = Number(next);
    if (!Number.isFinite(numericValue)) return;
    const clampedValue = Math.min(max, Math.max(min, numericValue));
    onChange(Number(clampedValue.toFixed(precision)));
  };

  return (
    <div className="range-control" data-range-control={label}>
      <div className="range-control__header">
        <label className="range-control__label" htmlFor={inputId}>{label}</label>
        <div className="range-control__precision" aria-label={`${label} 精确调整`}>
          <button type="button" aria-label={`${label} 减少`} disabled={value <= min} onClick={() => update(value - step)}>−</button>
          <output htmlFor={inputId} aria-live="polite">
            <strong>{displayValue}</strong>
            <span>{unit}</span>
          </output>
          <button type="button" aria-label={`${label} 增加`} disabled={value >= max} onClick={() => update(value + step)}>+</button>
        </div>
      </div>
      <div className="range-control__track-wrap">
        {hasZeroMarker && <span className="range-control__zero" aria-hidden="true" style={{ left: `${zeroPosition}%` }} />}
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={`${displayValue}${unit}`}
          onChange={(event) => update(event.target.value)}
          style={{ "--range-progress": `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function DiscreteRangeControl({ label, unit, value, options, tickValues = [], signed = false, onChange }) {
  const inputId = useId();
  const selectedIndex = Math.max(0, options.indexOf(value));
  const maxIndex = options.length - 1;
  const progress = maxIndex === 0 ? 0 : selectedIndex / maxIndex * 100;
  const displayValue = signed && value > 0 ? `+${value}` : value;

  const updateIndex = (nextIndex) => {
    const numericIndex = Number(nextIndex);
    if (!Number.isFinite(numericIndex)) return;
    const clampedIndex = Math.min(maxIndex, Math.max(0, Math.round(numericIndex)));
    onChange(options[clampedIndex]);
  };

  const formatTick = (option) => signed && option > 0 ? `+${option}` : option;

  return (
    <div className="range-control range-control--discrete" data-range-control={label}>
      <div className="range-control__header">
        <label className="range-control__label" htmlFor={inputId}>{label}</label>
        <div className="range-control__precision" aria-label={`${label} 精确调整`}>
          <button type="button" aria-label={`${label} 上一个规格`} disabled={selectedIndex === 0} onClick={() => updateIndex(selectedIndex - 1)}>−</button>
          <output htmlFor={inputId} aria-live="polite">
            <strong>{displayValue}</strong>
            <span>{unit}</span>
          </output>
          <button type="button" aria-label={`${label} 下一个规格`} disabled={selectedIndex === maxIndex} onClick={() => updateIndex(selectedIndex + 1)}>+</button>
        </div>
      </div>
      <div className="range-control__track-wrap range-control__track-wrap--discrete">
        {options.map((option, index) => {
          const position = maxIndex === 0 ? 0 : index / maxIndex * 100;
          return (
            <span
              key={option}
              className={`range-control__tick${index === selectedIndex ? " is-selected" : ""}`}
              aria-hidden="true"
              style={{ left: `${position}%` }}
            />
          );
        })}
        {tickValues.map((option) => {
          const index = options.indexOf(option);
          if (index < 0) return null;
          const position = maxIndex === 0 ? 0 : index / maxIndex * 100;
          const edgeClass = index === 0 ? " range-control__tick-label--start" : index === maxIndex ? " range-control__tick-label--end" : "";
          return (
            <span key={option} className={`range-control__tick-label${edgeClass}`} aria-hidden="true" style={{ left: `${position}%` }}>
              {formatTick(option)}°
            </span>
          );
        })}
        <input
          id={inputId}
          type="range"
          min={0}
          max={maxIndex}
          step={1}
          value={selectedIndex}
          aria-valuetext={`${displayValue}${unit}`}
          onChange={(event) => updateIndex(event.target.value)}
          style={{ "--range-progress": `${progress}%` }}
        />
      </div>
    </div>
  );
}

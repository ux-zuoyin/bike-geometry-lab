export function Stepper({ label, unit, value, step = 1, min = -Infinity, max = Infinity, onChange }) {
  const update = (next) => onChange(Math.min(max, Math.max(min, Number(next) || 0)));
  return (
    <label className="stepper-row">
      <span className="stepper-label">
        {label} <small>{unit}</small>
      </span>
      <span className="stepper-control">
        <button type="button" aria-label={`${label} 减少`} onClick={() => update(value - step)}>−</button>
        <input
          aria-label={label}
          type="number"
          value={value}
          step={step}
          min={Number.isFinite(min) ? min : undefined}
          max={Number.isFinite(max) ? max : undefined}
          onChange={(event) => update(event.target.value)}
        />
        <button type="button" aria-label={`${label} 增加`} onClick={() => update(value + step)}>+</button>
      </span>
    </label>
  );
}

export function SegmentedControl({ label, options, value, onChange, compact = false, wrap = false }) {
  return (
    <div className="field-block">
      {label && <span className="field-label">{label}</span>}
      <div className={`segmented${compact ? " segmented--compact" : ""}${wrap ? " segmented--wrap" : ""}`}>
        {options.map((option) => {
          const item = typeof option === "object" ? option : { value: option, label: option };
          return (
            <button
              type="button"
              key={item.value}
              className={value === item.value ? "is-selected" : ""}
              onClick={() => onChange(item.value)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Switch({ label, checked, onChange }) {
  return (
    <label className="switch-row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? "is-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </label>
  );
}

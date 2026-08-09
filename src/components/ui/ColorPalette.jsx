import { COLOR_PRESETS, findColorPreset, normalizeBikeColor } from "../../config/colorPresets.js";

export function ColorPalette({ label, value, onChange }) {
  const currentPreset = findColorPreset(value);
  const normalizedValue = normalizeBikeColor(value);
  const isCustom = !currentPreset;
  const applyCustomColor = (event) => onChange(event.currentTarget.value.toUpperCase());

  return (
    <div className="color-config__item" data-color-setting={label}>
      <div className="color-config__header">
        <strong>{label}</strong>
        <span className="color-config__current">
          <span>{currentPreset?.label ?? "自定义"}</span>
          <code>{normalizedValue}</code>
        </span>
      </div>
      <div className="color-swatches" role="group" aria-label={`${label}预设`}>
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={`color-swatch${currentPreset?.key === preset.key ? " is-selected" : ""}`}
            style={{ "--swatch-color": preset.value }}
            aria-label={`${label}：${preset.label} ${preset.value}`}
            aria-pressed={currentPreset?.key === preset.key}
            title={`${preset.label} · ${preset.value}`}
            onClick={() => onChange(preset.value)}
          />
        ))}
        <label
          className={`color-swatch color-swatch--custom${isCustom ? " is-selected" : ""}`}
          title="自定义色值"
        >
          <input
            type="color"
            value={normalizedValue}
            aria-label={`${label}：自定义色值`}
            onInput={applyCustomColor}
            onChange={applyCustomColor}
          />
        </label>
      </div>
    </div>
  );
}

import { Stack as Layers } from "@phosphor-icons/react";

export function PresetExperienceControls({
  presets,
  activePresetBikeId,
  onPresetBikeChange,
  onRequestComparison,
}) {
  return (
    <div className="preset-experience-controls" aria-label="三类车架快速体验">
      <div className="preset-experience-tabs" role="tablist" aria-label="预设体验车型">
        {presets.map((bike) => {
          const isActive = bike.presetExperienceId === activePresetBikeId;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "is-selected" : ""}
              key={bike.presetExperienceId}
              onClick={() => onPresetBikeChange(bike.presetExperienceId)}
            >
              <strong>{bike.model}</strong>
              <span>· {bike.categoryLabel.replace("型", "")}</span>
            </button>
          );
        })}
      </div>

      <button type="button" className="preset-experience-action" onClick={onRequestComparison}>
        <Layers size={18} weight="regular" aria-hidden="true" />
        <span>
          <strong>进入车型对比</strong>
          <small>将当前车型作为 Bike A</small>
        </span>
      </button>
    </div>
  );
}

import { useEffect } from "react";
import { Stack as Layers, X } from "@phosphor-icons/react";

export function PresetComparisonConfirmModal({ bike, onCancel, onConfirm }) {
  useEffect(() => {
    if (!bike) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [bike, onCancel]);

  if (!bike) return null;

  return (
    <div
      className="preset-comparison-confirm-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="preset-comparison-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preset-comparison-confirm-title"
        aria-describedby="preset-comparison-confirm-description"
      >
        <button type="button" className="preset-comparison-confirm-modal__close" aria-label="继续体验" onClick={onCancel}>
          <X size={18} aria-hidden="true" />
        </button>
        <span className="preset-comparison-confirm-modal__icon"><Layers size={24} aria-hidden="true" /></span>
        <h2 id="preset-comparison-confirm-title">进入车型对比？</h2>
        <p id="preset-comparison-confirm-description">
          将结束三类车架快速体验，并以 {bike.model} · {bike.categoryLabel}作为 Bike A 进入车型对比工作区。
        </p>

        <div className="preset-comparison-confirm-bike" aria-label={`当前体验车型 ${bike.model} ${bike.categoryLabel} ${bike.size}码`}>
          <span>当前体验车型</span>
          <div>
            <strong>{bike.model}</strong>
            <em>{bike.categoryLabel}</em>
            <small>{bike.size}码</small>
          </div>
          <p>进入车型对比后，它将作为 Bike A 保留。</p>
        </div>

        <p className="preset-comparison-confirm-modal__note">进入后将使用正式 A/B 车型管理与叠层对比模式。</p>
        <div className="preset-comparison-confirm-modal__footer">
          <button type="button" className="preset-comparison-confirm-button" autoFocus onClick={onCancel}>继续体验</button>
          <button type="button" className="preset-comparison-confirm-button is-primary" onClick={onConfirm}>进入车型对比</button>
        </div>
      </section>
    </div>
  );
}

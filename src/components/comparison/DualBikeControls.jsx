import { useRef } from "react";
import { DotsThree, Info, Plus, Stack as Layers } from "@phosphor-icons/react";
import { getSTRProfile } from "../../lib/geometry/strProfile.js";
import { getComparisonSlotLabel } from "../../state/workspaceBikes.js";

function BikeCard({ bike, index, bikeCount, activeBikeIndex, onChange, onManage }) {
  const isSelected = activeBikeIndex === index;
  const label = getComparisonSlotLabel(index);
  const strProfile = getSTRProfile(bike.geometry.stack, bike.geometry.reach);
  const cardLabel = `${bikeCount === 2 ? `${label} ` : ""}${bike.brand} ${bike.model}，${bike.size}码`;

  return (
    <article className={`dual-bike-card${isSelected ? " is-selected" : ""}`}>
      <button type="button" className="dual-bike-card__select" aria-label={cardLabel} aria-pressed={isSelected} onClick={() => onChange(index)} />
      <span className="dual-bike-card__heading">
        {bikeCount === 2 && <span className="dual-bike-card__id">{label}</span>}
        <strong>{bike.brand} {bike.model}</strong>
      </span>
      <button
        type="button"
        className="dual-bike-card__manage"
        aria-label={`管理 ${bike.brand} ${bike.model}`}
        onClick={(event) => { event.stopPropagation(); onManage(index); }}
      >
        <DotsThree size={21} weight="bold" aria-hidden="true" />
      </button>
      <span className="dual-bike-card__meta">
        <span>{bike.size}码</span>
        {strProfile && (
          <>
            <span className="dual-bike-card__separator" aria-hidden="true">·</span>
            <span>STR <strong>{strProfile.value.toFixed(2)}</strong></span>
            <span className="dual-bike-card__separator" aria-hidden="true">·</span>
            <span className="dual-bike-card__profile">{strProfile.label}</span>
            <span className="str-info">
              <button type="button" className="str-info__trigger" aria-label={`查看 STR ${strProfile.value.toFixed(2)} ${strProfile.label}说明`} aria-describedby={`str-tooltip-${bike.id}`} onClick={(event) => event.stopPropagation()}>
                <Info size={15} weight="regular" aria-hidden="true" />
              </button>
              <span id={`str-tooltip-${bike.id}`} className="str-tooltip" role="tooltip">
                <strong>STR {strProfile.value.toFixed(2)}</strong><span>{strProfile.label}</span><p>{strProfile.description}</p>
              </span>
            </span>
          </>
        )}
      </span>
      <span className="dual-bike-card__metrics">
        <span>Stack <strong>{bike.geometry.stack}</strong> mm</span>
        <span>Reach <strong>{bike.geometry.reach}</strong> mm</span>
      </span>
    </article>
  );
}

function AddBikeCard({ onSelectImage }) {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef}
        className="geometry-import__file-input"
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        onChange={(event) => {
          const [file] = Array.from(event.target.files ?? []);
          if (file) onSelectImage(file);
          event.target.value = "";
        }}
      />
      <button type="button" className="add-bike-card" onClick={() => inputRef.current?.click()}>
        <Plus size={25} weight="regular" aria-hidden="true" />
        <span><strong>添加对比车型</strong><small>选择官网车架几何图</small></span>
      </button>
    </>
  );
}

export function DualBikeControls({ bikes, activeBikeIndex, compareEnabled, onActiveBikeChange, onCompareEnabledChange, onAddBike, onManageBike }) {
  return (
    <div className={`dual-bike-controls dual-bike-controls--${bikes.length}-bikes`} aria-label="工作区车型控制">
      <div className="dual-bike-cards" role="group" aria-label="当前车型">
        {bikes.map((bike, index) => (
          <BikeCard key={bike.id} bike={bike} index={index} bikeCount={bikes.length} activeBikeIndex={activeBikeIndex} onChange={onActiveBikeChange} onManage={onManageBike} />
        ))}
        {bikes.length === 1 && <AddBikeCard onSelectImage={onAddBike} />}
      </div>
      {bikes.length === 2 && (
        <label className={`compare-card${compareEnabled ? " is-checked" : ""}`}>
          <input type="checkbox" checked={compareEnabled} onChange={(event) => onCompareEnabledChange(event.target.checked)} aria-label="叠层对比" />
          <Layers className="compare-card__icon" size={20} weight={compareEnabled ? "fill" : "regular"} aria-hidden="true" />
          <span className="compare-card__label">叠层对比</span>
          <span className="compare-card__switch" aria-hidden="true" />
        </label>
      )}
    </div>
  );
}

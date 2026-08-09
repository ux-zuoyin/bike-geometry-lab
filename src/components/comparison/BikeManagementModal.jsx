import { useRef } from "react";
import { ArrowCounterClockwise, Trash, UploadSimple, X } from "@phosphor-icons/react";

export function BikeManagementModal({ bike, stage, onClose, onReplace, onRequestDelete, onConfirmDelete }) {
  const replacementInputRef = useRef(null);
  if (!bike) return null;
  const name = `${bike.brand} ${bike.model}`;
  return (
    <div className="bike-management-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="bike-management-modal" role="dialog" aria-modal="true" aria-labelledby="bike-management-title">
        <button type="button" className="bike-management-modal__close" aria-label="关闭" onClick={onClose}><X size={18} /></button>
        {stage === "delete" ? (
          <>
            <span className="bike-management-modal__icon is-destructive"><Trash size={25} /></span>
            <h2 id="bike-management-title">确认删除「{name}」？</h2>
            <p>删除后，该车型当前的几何数据将从工作区移除。</p>
            <div className="bike-management-modal__footer">
              <button type="button" className="bike-management-button" onClick={onClose}>取消</button>
              <button type="button" className="bike-management-button is-destructive" onClick={onConfirmDelete}>删除车型</button>
            </div>
          </>
        ) : (
          <>
            <span className="bike-management-modal__icon"><ArrowCounterClockwise size={25} /></span>
            <h2 id="bike-management-title">管理车型</h2>
            <p>你想如何处理「{name}」？</p>
            <div className="bike-management-options">
              <input ref={replacementInputRef} className="geometry-import__file-input" type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" onChange={(event) => { const [file] = Array.from(event.target.files ?? []); if (file) onReplace(file); event.target.value = ""; }} />
              <button type="button" onClick={() => replacementInputRef.current?.click()}><UploadSimple size={22} /><span><strong>更换车型</strong><small>选择新的官网几何图，并替换当前车型。</small></span></button>
              <button type="button" className="is-destructive" onClick={onRequestDelete}><Trash size={22} /><span><strong>删除车型</strong><small>从当前工作区移除此车型。</small></span></button>
            </div>
            <button type="button" className="bike-management-modal__cancel" onClick={onClose}>取消</button>
          </>
        )}
      </section>
    </div>
  );
}

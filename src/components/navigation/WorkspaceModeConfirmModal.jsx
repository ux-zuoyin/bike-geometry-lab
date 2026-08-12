import { ArrowsLeftRight } from "@phosphor-icons/react";
import { getWorkspaceEntryModeLabel } from "../../state/workspaceEntryMode.js";

export function WorkspaceModeConfirmModal({ targetMode, onCancel, onConfirm }) {
  if (!targetMode) return null;
  const targetLabel = getWorkspaceEntryModeLabel(targetMode);
  return (
    <div className="workspace-mode-confirm-backdrop" role="presentation">
      <section
        className="workspace-mode-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-mode-confirm-title"
        aria-describedby="workspace-mode-confirm-description"
      >
        <div className="workspace-mode-confirm-modal__icon" aria-hidden="true">
          <ArrowsLeftRight size={22} weight="regular" />
        </div>
        <h2 id="workspace-mode-confirm-title">切换到{targetLabel}？</h2>
        <p id="workspace-mode-confirm-description">当前几何数据尚未确认，切换模式后本次编辑内容将不会保留。</p>
        <footer className="workspace-mode-confirm-modal__footer">
          <button type="button" className="workspace-mode-confirm-button" onClick={onCancel}>继续编辑</button>
          <button type="button" className="workspace-mode-confirm-button is-primary" onClick={onConfirm}>放弃并切换</button>
        </footer>
      </section>
    </div>
  );
}

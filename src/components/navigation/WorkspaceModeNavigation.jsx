import { WORKSPACE_ENTRY_MODE_OPTIONS } from "../../state/workspaceEntryMode.js";

export function WorkspaceModeNavigation({ value, onChange }) {
  return (
    <nav className="workspace-mode-nav" aria-label="使用方式">
      <div className="workspace-mode-nav__items" role="tablist" aria-label="Bike Geometry Lab 一级模式">
        {WORKSPACE_ENTRY_MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            className={value === option.value ? "is-selected" : ""}
            aria-selected={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

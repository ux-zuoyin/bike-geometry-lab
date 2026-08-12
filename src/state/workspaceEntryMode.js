export const WORKSPACE_ENTRY_MODE = Object.freeze({
  PRESET: "preset",
  UPLOAD: "upload",
  MANUAL: "manual",
});

export const WORKSPACE_ENTRY_MODE_OPTIONS = Object.freeze([
  { value: WORKSPACE_ENTRY_MODE.PRESET, label: "快速体验" },
  { value: WORKSPACE_ENTRY_MODE.UPLOAD, label: "上传几何图" },
  { value: WORKSPACE_ENTRY_MODE.MANUAL, label: "手动录入" },
]);

export function hasUnfinishedGeometryTask(status) {
  return status !== "ready";
}

export function getWorkspaceEntryModeLabel(mode) {
  return WORKSPACE_ENTRY_MODE_OPTIONS.find(({ value }) => value === mode)?.label ?? "其他模式";
}

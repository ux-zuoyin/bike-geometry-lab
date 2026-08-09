export const COLOR_PRESETS = Object.freeze([
  Object.freeze({ key: "red", label: "红色", value: "#C94B4B" }),
  Object.freeze({ key: "orange", label: "橙色", value: "#D7783F" }),
  Object.freeze({ key: "yellow", label: "黄色", value: "#D6B84B" }),
  Object.freeze({ key: "green", label: "绿色", value: "#4F8A62" }),
  Object.freeze({ key: "blue", label: "蓝色", value: "#3E73C8" }),
  Object.freeze({ key: "purple", label: "紫色", value: "#765FA8" }),
  Object.freeze({ key: "peach", label: "桃色", value: "#D98972" }),
  Object.freeze({ key: "pink", label: "粉色", value: "#C97991" }),
  Object.freeze({ key: "black", label: "黑色", value: "#111111" }),
  Object.freeze({ key: "white", label: "白色", value: "#F2F2F0" }),
  Object.freeze({ key: "graphite", label: "石墨灰", value: "#4B4F56" }),
  Object.freeze({ key: "silver", label: "银灰", value: "#A7ADB5" }),
  Object.freeze({ key: "sage", label: "鼠尾草绿", value: "#899A84" }),
  Object.freeze({ key: "burgundy", label: "酒红", value: "#74454D" }),
  Object.freeze({ key: "sand", label: "沙米色", value: "#C8B79C" }),
]);

const DEFAULT_BIKE_COLOR = "#111111";

export const DEFAULT_BIKE_COLORS = Object.freeze({
  frameColor: DEFAULT_BIKE_COLOR,
  forkColor: DEFAULT_BIKE_COLOR,
  barTapeColor: DEFAULT_BIKE_COLOR,
});

export const BIKE_COLOR_KEYS = Object.freeze(Object.keys(DEFAULT_BIKE_COLORS));

export function normalizeBikeColor(value, fallback = DEFAULT_BIKE_COLOR) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toUpperCase()
    : fallback;
}

export function findColorPreset(value) {
  const normalized = normalizeBikeColor(value);
  return COLOR_PRESETS.find((preset) => preset.value === normalized);
}

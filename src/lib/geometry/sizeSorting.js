export const LETTER_SIZE_ORDER = Object.freeze([
  "XXS",
  "XS",
  "S",
  "SM",
  "M",
  "ML",
  "L",
  "XL",
  "XXL",
]);

const letterRank = new Map(LETTER_SIZE_ORDER.map((size, index) => [size, index]));
const numericSizePattern = /^([+-]?\d+(?:\.\d+)?)\s*(?:cm|厘米|寸|码)?$/i;
const normalizeLabel = (value) => String(value ?? "").trim();

export function classifyBikeSize(value) {
  const label = normalizeLabel(value);
  const numericMatch = label.match(numericSizePattern);
  if (numericMatch) return { type: "numeric", value: Number(numericMatch[1]) };

  const normalizedLetter = label.toUpperCase();
  if (letterRank.has(normalizedLetter)) {
    return { type: "letter", value: letterRank.get(normalizedLetter) };
  }
  return { type: "unknown", value: null };
}

export function createBikeSizeComparator(sourceOrder = []) {
  const sourceIndex = new Map(sourceOrder.map((size, index) => [normalizeLabel(size), index]));
  const fallbackIndex = (label) => sourceIndex.get(label) ?? Number.MAX_SAFE_INTEGER;
  const typeRank = { numeric: 0, letter: 1, unknown: 2 };

  return (leftValue, rightValue) => {
    const left = normalizeLabel(leftValue);
    const right = normalizeLabel(rightValue);
    const leftSize = classifyBikeSize(left);
    const rightSize = classifyBikeSize(right);

    if (leftSize.type !== rightSize.type) {
      return typeRank[leftSize.type] - typeRank[rightSize.type];
    }
    if (leftSize.type !== "unknown" && leftSize.value !== rightSize.value) {
      return leftSize.value - rightSize.value;
    }
    return fallbackIndex(left) - fallbackIndex(right);
  };
}

export function sortBikeSizes(values, { sourceOrder = values } = {}) {
  return [...new Set((values ?? []).map(normalizeLabel).filter(Boolean))]
    .sort(createBikeSizeComparator(sourceOrder));
}

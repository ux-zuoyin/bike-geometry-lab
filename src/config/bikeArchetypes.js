import { endurancePreset } from "./framePresets/endurance.js";
import { allRoundPreset } from "./framePresets/allRound.js";
import { aeroPreset } from "./framePresets/aero.js";

export const BIKE_CATEGORIES = Object.freeze(["endurance", "allRound", "aero"]);
export const DEFAULT_BIKE_CATEGORY = "endurance";

export const bikeArchetypes = {
  endurance: endurancePreset,
  allRound: allRoundPreset,
  aero: aeroPreset,
};

export function resolveFrameVisualPreset(value) {
  return bikeArchetypes[value] ?? bikeArchetypes[DEFAULT_BIKE_CATEGORY];
}

export function normalizeBikeCategory(value) {
  return BIKE_CATEGORIES.includes(value) ? value : DEFAULT_BIKE_CATEGORY;
}

export function getBikeCategoryLabel(value) {
  return resolveFrameVisualPreset(value).categoryLabel;
}

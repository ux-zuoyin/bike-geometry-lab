import { endurancePreset } from "./framePresets/endurance.js";

export const bikeArchetypes = {
  endurance: endurancePreset,
};

export const bikeArchetypeOptions = Object.values(bikeArchetypes).map((preset) => ({
  value: preset.id,
  label: preset.label,
}));

export const DEFAULT_BIKE_ARCHETYPE = "endurance";

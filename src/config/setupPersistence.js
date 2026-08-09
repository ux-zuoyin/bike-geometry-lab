import { BikeComponents, DEFAULT_COMPONENT_SETUP } from "./bikeComponents.js";
import { BIKE_COLOR_KEYS, normalizeBikeColor } from "./colorPresets.js";
import { DEFAULT_FIT_SETUP, STEM_ANGLE_OPTIONS } from "./fitSetup.js";

export const BIKE_SETUP_STORAGE_KEY = "bike-geometry-lab:setup:v1";

const FIT_SETUP_KEYS = Object.freeze(Object.keys(DEFAULT_FIT_SETUP));
const COMPONENT_SETUP_KEYS = Object.freeze(Object.keys(DEFAULT_COMPONENT_SETUP));
const componentColorKeys = new Set(BIKE_COLOR_KEYS);

const componentResourceIds = Object.freeze({
  frontWheelId: new Set(BikeComponents.Wheel.map(({ id }) => id)),
  rearWheelId: new Set(BikeComponents.Wheel.map(({ id }) => id)),
  tireId: new Set(BikeComponents.Tire.map(({ id }) => id)),
  chainringVisualId: new Set(BikeComponents.Chainring.map(({ id }) => id)),
  crankVisualId: new Set(BikeComponents.Crank.map(({ id }) => id)),
  cassetteId: new Set(BikeComponents.Cassette.map(({ id }) => id)),
  drivetrainVisualId: new Set(BikeComponents.Drivetrain.map(({ id }) => id)),
});

const getBrowserLocalStorage = () => {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
};

export function createDefaultBikeSetup() {
  return {
    fitSetup: { ...DEFAULT_FIT_SETUP },
    componentSetup: { ...DEFAULT_COMPONENT_SETUP },
  };
}

export function sanitizeFitSetup(candidate) {
  return Object.fromEntries(FIT_SETUP_KEYS.map((key) => {
    const value = candidate?.[key];
    if (key === "stemAngle") {
      return [key, STEM_ANGLE_OPTIONS.includes(value) ? value : DEFAULT_FIT_SETUP.stemAngle];
    }
    return [key, typeof value === "number" && Number.isFinite(value) ? value : DEFAULT_FIT_SETUP[key]];
  }));
}

export function sanitizeComponentSetup(candidate) {
  return Object.fromEntries(COMPONENT_SETUP_KEYS.map((key) => {
    const value = candidate?.[key];
    if (key === "linkWheelSelection") {
      return [key, typeof value === "boolean" ? value : DEFAULT_COMPONENT_SETUP[key]];
    }
    if (componentColorKeys.has(key)) {
      return [key, normalizeBikeColor(value, DEFAULT_COMPONENT_SETUP[key])];
    }
    return [key, componentResourceIds[key].has(value) ? value : DEFAULT_COMPONENT_SETUP[key]];
  }));
}

export function parsePersistedBikeSetup(serialized) {
  if (!serialized) return createDefaultBikeSetup();
  try {
    const parsed = JSON.parse(serialized);
    return {
      fitSetup: sanitizeFitSetup(parsed?.fitSetup),
      componentSetup: sanitizeComponentSetup(parsed?.componentSetup),
    };
  } catch {
    return createDefaultBikeSetup();
  }
}

export function readPersistedBikeSetup(storage = getBrowserLocalStorage()) {
  try {
    return parsePersistedBikeSetup(storage?.getItem(BIKE_SETUP_STORAGE_KEY));
  } catch {
    return createDefaultBikeSetup();
  }
}

export function persistBikeSetup(setup, storage = getBrowserLocalStorage()) {
  try {
    if (!storage?.setItem) return false;
    storage.setItem(BIKE_SETUP_STORAGE_KEY, JSON.stringify({
      fitSetup: sanitizeFitSetup(setup?.fitSetup),
      componentSetup: sanitizeComponentSetup(setup?.componentSetup),
    }));
    return true;
  } catch {
    return false;
  }
}

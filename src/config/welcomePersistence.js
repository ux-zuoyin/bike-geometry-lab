export const WELCOME_COMPLETED_STORAGE_KEY = "bikeGeometryLabWelcomeCompleted";

export function readWelcomeCompleted() {
  try {
    if (import.meta.env?.DEV && new URLSearchParams(window.location.search).get("resetWelcome") === "1") {
      window.localStorage.removeItem(WELCOME_COMPLETED_STORAGE_KEY);
      return false;
    }
    return window.localStorage.getItem(WELCOME_COMPLETED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function persistWelcomeCompleted() {
  try {
    window.localStorage.setItem(WELCOME_COMPLETED_STORAGE_KEY, "true");
  } catch {
    // The gate still closes for this session when storage is unavailable.
  }
}

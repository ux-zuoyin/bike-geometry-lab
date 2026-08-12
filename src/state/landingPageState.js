export const LAB_VIEW_PARAM = "view";
export const LAB_VIEW_VALUE = "lab";
export const LAB_MODE_PARAM = "mode";

export function shouldShowLandingPage(location = globalThis?.location) {
  if (!location) return true;
  const search = typeof location === "string" ? new URL(location).search : location.search;
  return new URLSearchParams(search).get(LAB_VIEW_PARAM) !== LAB_VIEW_VALUE;
}

export function createLandingPageUrl(href = globalThis?.location?.href) {
  if (!href) return "/";
  const url = new URL(href);
  url.searchParams.delete(LAB_VIEW_PARAM);
  url.searchParams.delete(LAB_MODE_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function createLabPageUrl(mode = null, href = globalThis?.location?.href) {
  if (!href) return mode ? `/?view=lab&mode=${mode}` : "/?view=lab";
  const url = new URL(href);
  url.searchParams.set(LAB_VIEW_PARAM, LAB_VIEW_VALUE);
  if (mode) url.searchParams.set(LAB_MODE_PARAM, mode);
  else url.searchParams.delete(LAB_MODE_PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

import { createQuickGeometryParserFixture } from "./quickGeometryParserResponse.js";

export function createQuickGeometryParserMisalignedResponse() {
  const fixture = createQuickGeometryParserFixture();
  const size550 = fixture.sizes.find(({ size }) => size === "550");
  size550.geometry.bbDrop = 812;
  size550.geometry.forkOffset = 73;
  return fixture;
}

export function createQuickGeometryParserPartialResponse() {
  const fixture = createQuickGeometryParserFixture();
  const size430 = fixture.sizes.find(({ size }) => size === "430");
  size430.geometry.wheelbase = null;
  size430.geometry.forkOffset = null;
  return fixture;
}

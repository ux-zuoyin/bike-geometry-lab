import { productionGeometryParserClient } from "./geometryParserClient.js";

export function geometryParserResponseToDraft(response) {
  const sizes = Object.fromEntries(
    response.sizes.map(({ size, geometry }) => [String(size), { ...geometry }]),
  );
  const detectedSizes = response.detectedSizes?.map(String) ?? Object.keys(sizes);

  return {
    brand: "",
    model: "",
    category: "endurance",
    sizes,
    selectedSize: detectedSizes[0] ?? Object.keys(sizes)[0] ?? "",
    detectedSizeCount: response.detectedSizeCount ?? detectedSizes.length,
    parserWarnings: response.warnings ?? [],
    parserConfirmationCount: response.confirmationCount ?? 0,
    unrecognizedFields: response.unrecognizedFields ?? [],
    parserMeta: response.meta ?? null,
  };
}

export async function analyzeGeometryImage(
  imageFile,
  { parserClient = productionGeometryParserClient, signal } = {},
) {
  if (typeof File === "undefined" || !(imageFile instanceof File)) {
    throw new Error("请选择有效的车架几何图片。");
  }

  const parsedResponse = await parserClient.parse(imageFile, { signal });
  return geometryParserResponseToDraft(parsedResponse);
}


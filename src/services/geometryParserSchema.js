export const GEOMETRY_PARSER_SCHEMA_VERSION = "1";

export const GEOMETRY_PARSER_INPUT_TYPES = Object.freeze([
  "road_bike_geometry",
  "unsupported_bike_geometry",
  "not_geometry",
  "unreadable",
]);

export const GEOMETRY_PARSER_FIELDS = Object.freeze([
  { key: "seatTubeLength", label: "Seat Tube" },
  { key: "effectiveTopTube", label: "Effective Top Tube" },
  { key: "seatTubeAngle", label: "Seat Tube Angle" },
  { key: "headTubeAngle", label: "Head Tube Angle" },
  { key: "headTubeLength", label: "Head Tube" },
  { key: "chainstay", label: "Chainstay" },
  { key: "wheelbase", label: "Wheelbase" },
  { key: "forkOffset", label: "Fork Offset" },
  { key: "bbDrop", label: "BB Drop" },
  { key: "reach", label: "Reach" },
  { key: "stack", label: "Stack" },
]);

export const GEOMETRY_PARSER_FIELD_KEYS = Object.freeze(
  GEOMETRY_PARSER_FIELDS.map(({ key }) => key),
);

export const GEOMETRY_PARSER_PLAUSIBILITY_RANGES = Object.freeze({
  stack: Object.freeze({ min: 350, max: 800, unit: "mm" }),
  reach: Object.freeze({ min: 250, max: 550, unit: "mm" }),
  seatTubeLength: Object.freeze({ min: 250, max: 700, unit: "mm" }),
  effectiveTopTube: Object.freeze({ min: 400, max: 700, unit: "mm" }),
  headTubeLength: Object.freeze({ min: 60, max: 300, unit: "mm" }),
  seatTubeAngle: Object.freeze({ min: 65, max: 85, unit: "°" }),
  headTubeAngle: Object.freeze({ min: 60, max: 80, unit: "°" }),
  chainstay: Object.freeze({ min: 350, max: 500, unit: "mm" }),
  wheelbase: Object.freeze({ min: 850, max: 1300, unit: "mm" }),
  bbDrop: Object.freeze({ min: 30, max: 120, unit: "mm" }),
  forkOffset: Object.freeze({ min: 25, max: 80, unit: "mm" }),
});

const rawTableRowSchema = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["label", "unit", "values"],
  properties: {
    label: { type: "string", minLength: 1 },
    unit: { type: ["string", "null"] },
    values: {
      type: "array",
      items: { type: ["number", "null"] },
    },
  },
});

export const GEOMETRY_PARSER_RAW_TABLE_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["inputClassification"],
  properties: {
    inputClassification: {
      type: "object",
      additionalProperties: false,
      required: ["type", "confidence", "detectedBikeType", "reason"],
      properties: {
        type: { type: "string", enum: GEOMETRY_PARSER_INPUT_TYPES },
        confidence: { type: ["number", "null"], minimum: 0, maximum: 1 },
        detectedBikeType: { type: ["string", "null"] },
        reason: { type: ["string", "null"] },
      },
    },
    detectedSizeCount: { type: "integer", minimum: 0 },
    detectedSizes: {
      type: "array",
      items: { type: "string", minLength: 1 },
    },
    rawRows: {
      type: "array",
      items: rawTableRowSchema,
    },
  },
});

const nullableNumberSchema = Object.freeze({ type: ["number", "null"] });

const geometryProperties = Object.fromEntries(
  GEOMETRY_PARSER_FIELD_KEYS.map((key) => [key, nullableNumberSchema]),
);

const fieldCountProperties = Object.fromEntries(
  GEOMETRY_PARSER_FIELD_KEYS.map((key) => [key, { type: "integer", minimum: 0 }]),
);

export const GEOMETRY_PARSER_STRUCTURED_OUTPUT_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: [
    "detectedSizeCount",
    "detectedSizes",
    "fieldColumnCounts",
    "sizes",
    "warnings",
    "unrecognizedFields",
  ],
  properties: {
    detectedSizeCount: { type: "integer", minimum: 0 },
    detectedSizes: {
      type: "array",
      items: { type: "string", minLength: 1 },
    },
    fieldColumnCounts: {
      type: "object",
      additionalProperties: false,
      required: GEOMETRY_PARSER_FIELD_KEYS,
      properties: fieldCountProperties,
    },
    sizes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["size", "geometry"],
        properties: {
          size: { type: "string", minLength: 1 },
          geometry: {
            type: "object",
            additionalProperties: false,
            required: GEOMETRY_PARSER_FIELD_KEYS,
            properties: geometryProperties,
          },
        },
      },
    },
    warnings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "message", "field", "size"],
        properties: {
          code: { type: "string", minLength: 1 },
          message: { type: "string", minLength: 1 },
          field: { type: ["string", "null"] },
          size: { type: ["string", "null"] },
        },
      },
    },
    unrecognizedFields: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["sourceLabel", "reason"],
        properties: {
          sourceLabel: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
  },
});

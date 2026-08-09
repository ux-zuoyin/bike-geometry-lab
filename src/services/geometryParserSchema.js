export const GEOMETRY_PARSER_SCHEMA_VERSION = "1";

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


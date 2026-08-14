export const CM_GEOMETRY_SIZES = Object.freeze(["XS", "S", "M", "ML", "L", "XL"]);

const globalLengthRow = (label, values) => ({
  label,
  // This deliberately preserves the misleading per-row unit returned by the
  // earlier raw-table protocol. unitSource proves that it came from the table
  // default rather than text explicitly attached to this row, so it must not
  // override the image-wide centimetre statement.
  unit: "mm",
  unitSource: "global_default",
  values,
});

const explicitAngleRow = (label, values) => ({
  label,
  unit: "°",
  unitSource: "explicit_row",
  values,
});

export function createCmGeometryParserRawTableFixture() {
  return {
    inputClassification: {
      type: "road_bike_geometry",
      confidence: 0.98,
      detectedBikeType: "road bike",
      reason: "图片明确说明：除非另有说明，所有测量值均以厘米为单位。",
    },
    measurementContext: { defaultLengthUnit: "cm" },
    detectedSizeCount: CM_GEOMETRY_SIZES.length,
    detectedSizes: [...CM_GEOMETRY_SIZES],
    rawRows: [
      { label: "车架尺寸字母", unit: null, unitSource: "unknown", values: [null, null, null, null, null, null] },
      globalLengthRow("车轮尺寸", [700, 700, 700, 700, 700, 700]),
      globalLengthRow("A － 座管", [44.4, 47.6, 50, 53.3, 55.3, 59.3]),
      explicitAngleRow("B － 座管角度", [73.5, 73.7, 73.5, 73.3, 73.3, 73.3]),
      globalLengthRow("C － 头管长度", [10.6, 13.9, 15.9, 17, 19.2, 22.6]),
      explicitAngleRow("D － 头角", [71.3, 71.1, 71.2, 71.9, 72, 72.1]),
      globalLengthRow("E － 有效上管", [52, 53, 54.1, 55.3, 56.2, 57.5]),
      globalLengthRow("G － 中轴落差", [8, 8, 8, 7.8, 7.8, 7.5]),
      globalLengthRow("H － 后下叉长度", [42, 42, 42, 42, 42, 42]),
      globalLengthRow("I － 偏移", [5.3, 5.3, 5.3, 4.8, 4.8, 4.8]),
      globalLengthRow("J － 拖曳距", [6.2, 6.3, 6.3, 6.3, 6.3, 6.2]),
      globalLengthRow("K － 轴距", [98.7, 100.2, 101.1, 101, 101.9, 103.3]),
      globalLengthRow("L － 跨高", [72.1, 75.3, 77.5, 80.5, 82.6, 86.3]),
      globalLengthRow("M － 前伸量", [36.8, 37.1, 37.4, 37.7, 38, 38.4]),
      globalLengthRow("N － 堆高", [52.4, 55.5, 57.5, 59.6, 61.8, 64.8]),
      globalLengthRow("前方中心通道", [58, 59.5, 60.4, 60.2, 61.1, 62.4]),
    ],
  };
}

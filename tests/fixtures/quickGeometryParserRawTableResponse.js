import { QUICK_GEOMETRY, QUICK_SIZES } from "./quickGeometryParserResponse.js";

const valuesFor = (field) => QUICK_SIZES.map((size) => QUICK_GEOMETRY[size][field]);

export function createQuickGeometryParserRawTableFixture() {
  return {
    inputClassification: {
      type: "road_bike_geometry",
      confidence: 0.99,
      detectedBikeType: "road bike",
      reason: "The image contains a complete official road-bike geometry table with size columns and geometry parameters.",
    },
    detectedSizeCount: QUICK_SIZES.length,
    detectedSizes: [...QUICK_SIZES],
    rawRows: [
      { label: "尺寸/座管长度", unit: "mm", values: valuesFor("seatTubeLength") },
      { label: "水平上管长度", unit: "mm", values: valuesFor("effectiveTopTube") },
      { label: "座管角度", unit: "°", values: valuesFor("seatTubeAngle") },
      { label: "头管角度", unit: "°", values: valuesFor("headTubeAngle") },
      { label: "头管长度", unit: "mm", values: valuesFor("headTubeLength") },
      { label: "后下叉长度", unit: "mm", values: valuesFor("chainstay") },
      { label: "G 轮轴距", unit: "mm", values: [986, 988, 998.5, 999, 1013] },
      { label: "H 前叉调节量", unit: "mm", values: [45, 45, 45, 45, 45] },
      { label: "中轴下沉量", unit: "mm", values: valuesFor("bbDrop") },
      { label: "Reach", unit: "mm", values: valuesFor("reach") },
      { label: "Stack", unit: "mm", values: valuesFor("stack") },
      { label: "跨高", unit: "mm", values: [725, 747, 769, 790, 812] },
    ],
  };
}

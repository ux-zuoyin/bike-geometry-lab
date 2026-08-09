const STR_PROFILES = {
  race: {
    label: "竞技几何",
    description: "低趴、风阻更小，对腰背核心力量要求较高，长距离骑行更容易产生疲劳。",
  },
  balanced: {
    label: "综合型几何",
    description: "在气动性能与舒适度之间取得较好平衡，是较常见的公路车几何取向。",
  },
  endurance: {
    label: "舒适耐力几何",
    description: "骑行姿势更直立，对脊柱和手腕更友好，更适合长距离骑行。",
  },
};

export function getSTRProfile(stack, reach) {
  const stackValue = Number(stack);
  const reachValue = Number(reach);

  if (!Number.isFinite(stackValue) || !Number.isFinite(reachValue) || stackValue <= 0 || reachValue <= 0) {
    return null;
  }

  const value = stackValue / reachValue;

  if (value < 1.35) return { value, ...STR_PROFILES.race };
  if (value <= 1.45) return { value, ...STR_PROFILES.balanced };
  return { value, ...STR_PROFILES.endurance };
}

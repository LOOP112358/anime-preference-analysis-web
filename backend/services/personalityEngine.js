import { DIMENSION_KEYS, PERSONALITY_TYPES, TAG_DIMENSION_MAP } from "./taxonomy.js";

function createDimensionState() {
  return Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 0]));
}

function normalizeDimensions(dimensions) {
  const maxScore = Math.max(...Object.values(dimensions), 1);
  return Object.fromEntries(
    Object.entries(dimensions).map(([key, value]) => [key, Number((value / maxScore).toFixed(3))]),
  );
}

function calculateTypeScore(type, dimensions) {
  if (type.name === "平衡探索者") {
    const values = Object.values(dimensions);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance =
      values.reduce((sum, value) => sum + (value - average) ** 2, 0) / Math.max(values.length, 1);
    return Number((1 - Math.min(variance, 1)).toFixed(3));
  }

  let score = 0;
  for (const [dimension, expected] of Object.entries(type.dimensions)) {
    const actual = dimensions[dimension] || 0;
    score += expected >= 0 ? actual * expected : (1 - actual) * Math.abs(expected);
  }
  return Number(score.toFixed(3));
}

function pickTraits(dimensions, primaryType, secondaryType) {
  const topDimensions = Object.entries(dimensions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const labelMap = {
    healing: "治愈倾向",
    dark: "黑暗审美",
    passion: "热血偏好",
    fantasy: "幻想偏好",
    realism: "现实偏好",
    projection: "高代入感",
    escape: "逃逸需求",
    stimulation: "刺激偏好",
    analytical: "理性分析",
    emotional: "情绪投入",
    relationship_focus: "关系导向",
    individual_focus: "个人导向",
    plot_complex: "复杂叙事偏好",
    daily: "日常偏好",
  };

  const typeTraits = [
    ...(primaryType?.traits || []),
    ...(secondaryType?.traits || []),
  ];

  return [...new Set([...topDimensions.map((key) => labelMap[key]), ...typeTraits])].slice(0, 6);
}

export function analyzePersonality(aggregatedFeatures) {
  const dimensionScores = createDimensionState();

  for (const [tag, weight] of Object.entries(aggregatedFeatures)) {
    const mapping = TAG_DIMENSION_MAP[tag];
    if (!mapping) {
      continue;
    }

    for (const [dimension, increment] of Object.entries(mapping)) {
      dimensionScores[dimension] += weight * increment;
    }
  }

  const normalized = normalizeDimensions(dimensionScores);
  const rankedTypes = PERSONALITY_TYPES.map((type) => ({
    ...type,
    score: calculateTypeScore(type, normalized),
  })).sort((a, b) => b.score - a.score);

  const primaryType = rankedTypes[0];
  const secondaryType = rankedTypes[1];

  return {
    primary_type: primaryType?.name || "平衡探索者",
    secondary_type: secondaryType?.name || "平衡探索者",
    traits: pickTraits(normalized, primaryType, secondaryType),
    dimensions: normalized,
    type_scores: rankedTypes.map(({ name, score }) => ({ name, score })),
  };
}

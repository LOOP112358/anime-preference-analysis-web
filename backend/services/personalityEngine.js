import { DIMENSION_KEYS, DIMENSION_LABELS, PERSONALITY_TYPES, TAG_DIMENSION_MAP, resolveDimensionKey } from "./taxonomy.js";
import { createEmptyDimensionRecord, normalizeDimensionRecord } from "./contentVector.js";

/** 各人格类型的完整维度轮廓（用于雷达图补全，避免大量为 0） */
const PERSONALITY_DIMENSION_PROFILES = {
  治愈型投射者: {
    healing: 1,
    fantasy: 0.85,
    emotion: 0.65,
    bond: 0.55,
    daily: 0.45,
  },
  深渊观察者: {
    dark: 1,
    logic: 0.7,
    narrative: 0.65,
    emotion: 0.5,
    suspense: 0.35,
    growth: 0.45,
  },
  热血行动派: {
    passion: 1,
    suspense: 0.8,
    fantasy: 0.4,
    bond: 0.4,
    growth: 0.35,
  },
  幻想逃逸者: {
    fantasy: 1,
    healing: 0.5,
    emotion: 0.55,
    daily: 0.35,
    bond: 0.4,
  },
  情感依赖者: {
    bond: 1,
    healing: 0.85,
    emotion: 0.9,
    fantasy: 0.45,
    daily: 0.35,
  },
  理性解构者: {
    logic: 1,
    narrative: 0.95,
    realism: 0.6,
    growth: 0.5,
    dark: 0.3,
    suspense: 0.35,
  },
  戏剧沉浸者: {
    emotion: 1,
    dark: 0.85,
    narrative: 0.65,
    fantasy: 0.5,
    suspense: 0.45,
    bond: 0.4,
  },
  日常享乐者: {
    daily: 1,
    healing: 0.9,
    humor: 0.55,
    bond: 0.5,
    emotion: 0.45,
    fantasy: 0.3,
  },
  冲突追求者: {
    suspense: 1,
    dark: 0.85,
    passion: 0.7,
    narrative: 0.5,
    growth: 0.4,
    logic: 0.35,
  },
  浪漫理想家: {
    emotion: 1,
    fantasy: 0.9,
    healing: 0.5,
    bond: 0.6,
    music: 0.35,
  },
  自我投射者: {
    fantasy: 0.75,
    realism: 0.85,
    growth: 0.8,
    emotion: 0.55,
    bond: 0.45,
    logic: 0.4,
  },
  平衡探索者: {
    healing: 0.55,
    fantasy: 0.5,
    emotion: 0.5,
    daily: 0.5,
    bond: 0.5,
    logic: 0.45,
    passion: 0.45,
    growth: 0.45,
  },
};

function createDimensionState() {
  return createEmptyDimensionRecord();
}

function normalizeDimensions(dimensions) {
  const maxScore = Math.max(...DIMENSION_KEYS.map((key) => dimensions[key] || 0), 0.001);
  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => {
      const value = dimensions[key] || 0;
      return [key, value > 0 ? Number((value / maxScore).toFixed(3)) : 0];
    }),
  );
}

/** 保证展示层只有 14 维中文 key，并从人格轮廓补全低分维度 */
function finalizeDisplayDimensions(blended, typeTemplate) {
  const migrated = normalizeDimensionRecord(blended);
  const filled = createDimensionState();

  for (const key of DIMENSION_KEYS) {
    filled[key] = migrated[key] || 0;
  }

  const typeRanked = DIMENSION_KEYS.map((key) => [key, typeTemplate[key] || 0]).sort((a, b) => b[1] - a[1]);

  for (const [key, typeVal] of typeRanked.slice(0, 10)) {
    if (typeVal > 0.15) {
      filled[key] = Math.max(filled[key], typeVal * 0.32);
    }
  }

  const normalized = normalizeDimensions(filled);
  const activeCount = DIMENSION_KEYS.filter((key) => normalized[key] > 0).length;

  if (activeCount < 6) {
    for (const [key, typeVal] of typeRanked.slice(0, 8)) {
      if (typeVal > 0.1) {
        normalized[key] = Math.max(normalized[key] || 0, Number((typeVal * 0.45).toFixed(3)));
      }
    }
    return normalizeDimensions(normalized);
  }

  return normalized;
}

function getTypeProfile(type) {
  if (!type?.name) {
    return createDimensionState();
  }
  const profile = PERSONALITY_DIMENSION_PROFILES[type.name];
  if (profile) {
    return { ...createDimensionState(), ...profile };
  }
  const fallback = createDimensionState();
  for (const [dimension, weight] of Object.entries(type.dimensions || {})) {
    const key = resolveDimensionKey(dimension);
    if (weight > 0 && Object.hasOwn(fallback, key)) {
      fallback[key] = weight;
    }
  }
  return fallback;
}

function mergeTypeProfiles(primaryType, secondaryType) {
  const primary = getTypeProfile(primaryType);
  const secondary = getTypeProfile(secondaryType);
  const merged = createDimensionState();

  for (const key of DIMENSION_KEYS) {
    merged[key] = (primary[key] || 0) * 0.65 + (secondary[key] || 0) * 0.35;
  }

  return normalizeDimensions(merged);
}

/**
 * 标签观测 + 人格轮廓融合，供雷达图展示
 * 标签占 45%，主/副人格轮廓占 55%，避免未命中标签的维度全为 0
 */
function blendDimensionsForDisplay(tagDimensions, primaryType, secondaryType) {
  const typeTemplate = mergeTypeProfiles(primaryType, secondaryType);
  const blended = createDimensionState();

  for (const key of DIMENSION_KEYS) {
    const tagScore = tagDimensions[key] || 0;
    const typeScore = typeTemplate[key] || 0;
    blended[key] = tagScore * 0.45 + typeScore * 0.55;
  }

  return finalizeDisplayDimensions(blended, typeTemplate);
}

/** 雷达图优先展示的维度（按融合后得分排序，取前 N 个） */
export function selectRadarDimensionKeys(dimensions, limit = 12) {
  const ranked = DIMENSION_KEYS.map((key) => [key, dimensions[key] || 0]).sort((a, b) => b[1] - a[1]);
  const meaningful = ranked.filter(([, value]) => value > 0.08).map(([key]) => key);
  if (meaningful.length >= 6) {
    return meaningful.slice(0, limit);
  }
  return ranked.slice(0, Math.max(8, limit)).map(([key]) => key);
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
    const key = resolveDimensionKey(dimension);
    const actual = dimensions[key] || 0;
    score += expected >= 0 ? actual * expected : (1 - actual) * Math.abs(expected);
  }
  return Number(score.toFixed(3));
}

function pickTraits(dimensions, primaryType, secondaryType) {
  const topDimensions = Object.entries(dimensions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const labelMap = Object.fromEntries(
    Object.entries(DIMENSION_LABELS).map(([key, label]) => [key, `${label}偏好`]),
  );
  labelMap.emotion = "情绪投入";
  labelMap.bond = "关系导向";
  labelMap.growth = "成长共鸣";
  labelMap.logic = "理性分析";
  labelMap.narrative = "叙事偏好";
  labelMap.humor = "幽默偏好";
  labelMap.music = "音乐偏好";
  labelMap.suspense = "悬疑偏好";

  const typeTraits = [...(primaryType?.traits || []), ...(secondaryType?.traits || [])];

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
      const key = resolveDimensionKey(dimension);
      if (Object.hasOwn(dimensionScores, key)) {
        dimensionScores[key] += weight * increment;
      }
    }
  }

  const tagNormalized = normalizeDimensions(dimensionScores);
  const rankedTypes = PERSONALITY_TYPES.map((type) => ({
    ...type,
    score: calculateTypeScore(type, tagNormalized),
  })).sort((a, b) => b.score - a.score);

  const primaryType = rankedTypes[0];
  const secondaryType = rankedTypes[1];
  const displayDimensions = blendDimensionsForDisplay(tagNormalized, primaryType, secondaryType);

  return {
    primary_type: primaryType?.name || "平衡探索者",
    secondary_type: secondaryType?.name || "平衡探索者",
    traits: pickTraits(displayDimensions, primaryType, secondaryType),
    dimensions: displayDimensions,
    dimensions_from_tags: tagNormalized,
    dimension_keys: [...DIMENSION_KEYS],
    dimension_labels: { ...DIMENSION_LABELS },
    radar_keys: selectRadarDimensionKeys(displayDimensions),
    type_scores: rankedTypes.map(({ name, score }) => ({ name, score })),
  };
}

import {
  DIMENSION_KEYS,
  TAG_DIMENSION_MAP,
  resolveDimensionKey,
} from "./taxonomy.js";

export function createEmptyDimensionRecord() {
  return Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 0]));
}

/** 将历史版本维度记录统一迁移到当前 14 维 */
export function normalizeDimensionRecord(record = {}) {
  const normalized = createEmptyDimensionRecord();

  for (const [rawKey, rawValue] of Object.entries(record || {})) {
    const key = resolveDimensionKey(rawKey);
    if (!Object.hasOwn(normalized, key)) {
      continue;
    }
    normalized[key] += Number(rawValue) || 0;
  }

  return normalized;
}

export function accumulateTagIntoDimensions(dimensions, tag, weight) {
  const mapping = TAG_DIMENSION_MAP[tag];
  if (!mapping) {
    return;
  }

  for (const [dimension, increment] of Object.entries(mapping)) {
    const key = resolveDimensionKey(dimension);
    if (!Object.hasOwn(dimensions, key)) {
      continue;
    }
    dimensions[key] += Number(weight) * increment;
  }
}

export function rawDimensionVectorFromAggregatedTags(aggregatedFeatures) {
  const dimensions = createEmptyDimensionRecord();

  for (const [tag, weight] of Object.entries(aggregatedFeatures || {})) {
    accumulateTagIntoDimensions(dimensions, tag, weight);
  }

  return dimensions;
}

export function dimensionVectorToArray(dimensions) {
  const normalized = normalizeDimensionRecord(dimensions);
  return DIMENSION_KEYS.map((key) => normalized[key] || 0);
}

export function cosineSimilarity(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) {
    throw new Error("cosineSimilarity: vector length mismatch");
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i += 1) {
    dot += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function dimensionLabelSnapshot(dimensions) {
  const normalized = normalizeDimensionRecord(dimensions);
  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => [key, Number((normalized[key] || 0).toFixed(4))]),
  );
}

export function migratePoolItemDimensions(item) {
  const dimensions = normalizeDimensionRecord(item.dimensions_14 || item.dimensions || {});
  return {
    ...item,
    dimensions,
    vector: dimensionVectorToArray(dimensions),
  };
}

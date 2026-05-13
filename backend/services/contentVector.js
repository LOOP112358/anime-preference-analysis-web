import { DIMENSION_KEYS, TAG_DIMENSION_MAP } from "./taxonomy.js";

export function rawDimensionVectorFromAggregatedTags(aggregatedFeatures) {
  const dimensions = Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 0]));

  for (const [tag, weight] of Object.entries(aggregatedFeatures || {})) {
    const mapping = TAG_DIMENSION_MAP[tag];
    if (!mapping) {
      continue;
    }

    for (const [dimension, increment] of Object.entries(mapping)) {
      dimensions[dimension] += Number(weight) * increment;
    }
  }

  return dimensions;
}

export function dimensionVectorToArray(dimensions) {
  return DIMENSION_KEYS.map((key) => dimensions[key] || 0);
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
  return Object.fromEntries(DIMENSION_KEYS.map((key) => [key, Number((dimensions[key] || 0).toFixed(4))]));
}

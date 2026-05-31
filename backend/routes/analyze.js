import express from "express";
import { scrapeAnimeBundle } from "../services/scraper.js";
import { extractFeatureVector, buildEnrichedWordCloud } from "../services/extractor.js";
import { analyzePersonality } from "../services/personalityEngine.js";
import { generateAnalysis } from "../services/llmService.js";
import { normalizeDimensionRecord } from "../services/contentVector.js";
import { DIMENSION_KEYS, DIMENSION_LABELS } from "../services/taxonomy.js";

const router = express.Router();

function sanitizeDimensions(dimensions) {
  const normalized = normalizeDimensionRecord(dimensions);
  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => [key, Number((normalized[key] || 0).toFixed(3))]),
  );
}

function normalizeInputList(animeList) {
  if (!Array.isArray(animeList)) {
    throw new Error("anime_list must be an array");
  }

  const uniqueList = [...new Set(animeList.map((item) => String(item || "").trim()).filter(Boolean))];

  if (uniqueList.length < 3 || uniqueList.length > 9) {
    throw new Error("anime_list length must be between 3 and 9 after deduplication");
  }

  return uniqueList;
}

router.post("/", async (req, res, next) => {
  try {
    const animeList = normalizeInputList(req.body?.anime_list);
    const scrapedItems = await scrapeAnimeBundle(animeList);
    const featureResult = extractFeatureVector(scrapedItems);
    const personalityResult = analyzePersonality(featureResult.aggregatedFeatures);
    const featureCloud = buildEnrichedWordCloud(
      scrapedItems,
      featureResult.aggregatedFeatures,
      personalityResult.dimensions,
    );
    const llmResult = await generateAnalysis({
      primaryType: personalityResult.primary_type,
      secondaryType: personalityResult.secondary_type,
      traits: personalityResult.traits,
      dimensions: personalityResult.dimensions,
      sourceTitles: scrapedItems.map((item) => item.title),
    });

    res.json({
      success: true,
      data: {
        ...personalityResult,
        dimensions: sanitizeDimensions(personalityResult.dimensions),
        dimension_keys: [...DIMENSION_KEYS],
        dimension_labels: { ...DIMENSION_LABELS },
        analysis: llmResult.analysis,
        works: scrapedItems,
        feature_cloud: featureCloud,
        aggregated_features: featureResult.aggregatedFeatures,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

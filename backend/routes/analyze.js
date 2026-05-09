import express from "express";
import { scrapeAnimeBundle } from "../services/scraper.js";
import { extractFeatureVector } from "../services/extractor.js";
import { analyzePersonality } from "../services/personalityEngine.js";
import { generateAnalysis } from "../services/llmService.js";

const router = express.Router();

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
        analysis: llmResult.analysis,
        works: scrapedItems,
        feature_cloud: featureResult.wordCloud,
        aggregated_features: featureResult.aggregatedFeatures,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

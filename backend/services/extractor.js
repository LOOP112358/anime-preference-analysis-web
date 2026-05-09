import { NORMALIZATION_MAP } from "./taxonomy.js";

const SOURCE_WEIGHTS = {
  moe_tags: 2.0,
  categories: 1.5,
  keywords: 1.0,
};

const KEYWORD_RULES = [
  { pattern: /家庭|家人|亲情/u, tag: "家庭" },
  { pattern: /成长|青春/u, tag: "成长" },
  { pattern: /恋爱|爱情/u, tag: "恋爱" },
  { pattern: /战争|战场/u, tag: "战争" },
  { pattern: /校园|学生/u, tag: "校园" },
  { pattern: /日常|生活/u, tag: "日常" },
  { pattern: /悬疑|谜团/u, tag: "悬疑" },
  { pattern: /推理|逻辑/u, tag: "推理" },
  { pattern: /幻想|异世界|魔法|奇幻/u, tag: "幻想" },
  { pattern: /温柔|治愈|温暖/u, tag: "治愈" },
  { pattern: /黑暗|绝望|残酷|悲剧/u, tag: "黑暗" },
  { pattern: /热血|战斗|奋斗/u, tag: "热血" },
  { pattern: /友情|羁绊/u, tag: "友情" },
  { pattern: /心理|内心/u, tag: "代入" },
  { pattern: /现实|社会/u, tag: "现实" },
];

function normalizeTag(tag) {
  const trimmed = String(tag || "").replace(/\[[^\]]+\]/g, "").trim();
  return NORMALIZATION_MAP[trimmed] || trimmed;
}

function addScore(map, tag, score) {
  if (!tag) {
    return;
  }

  map[tag] = Number((map[tag] || 0) + score).toFixed(3);
}

function extractKeywords(text) {
  return KEYWORD_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.tag);
}

export function extractFeatureVector(scrapedItems) {
  const aggregated = {};

  for (const item of scrapedItems) {
    const normalizedMoeTags = item.moe_tags.map(normalizeTag);
    const normalizedCategories = item.categories.map(normalizeTag);
    const keywords = extractKeywords(item.text || "").map(normalizeTag);

    normalizedMoeTags.forEach((tag) => addScore(aggregated, tag, SOURCE_WEIGHTS.moe_tags));
    normalizedCategories.forEach((tag) => addScore(aggregated, tag, SOURCE_WEIGHTS.categories));
    keywords.forEach((tag) => addScore(aggregated, tag, SOURCE_WEIGHTS.keywords));
  }

  const numericAggregated = Object.fromEntries(
    Object.entries(aggregated)
      .map(([tag, value]) => [tag, Number(value)])
      .sort((a, b) => b[1] - a[1]),
  );

  const wordCloud = Object.entries(numericAggregated)
    .slice(0, 30)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));

  return {
    aggregatedFeatures: numericAggregated,
    wordCloud,
  };
}

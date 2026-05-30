import { NORMALIZATION_MAP, TAG_DIMENSION_MAP, DIMENSION_LABELS } from "./taxonomy.js";

export { DIMENSION_LABELS };

const SOURCE_WEIGHTS = {
  moe_tags: 2.0,
  categories: 1.6,
  keywords: 1.0,
  inferred_category: 1.2,
  inferred_text: 0.9,
};

const KEYWORD_RULES = [
  { pattern: /家庭|家人|亲情/u, tag: "家庭", score: 1.2 },
  { pattern: /成长|青春|长大/u, tag: "成长", score: 1.1 },
  { pattern: /恋爱|爱情|告白/u, tag: "恋爱", score: 1.1 },
  { pattern: /战争|战场|冲突/u, tag: "战争", score: 1.1 },
  { pattern: /校园|学生|学园/u, tag: "校园", score: 1.0 },
  { pattern: /日常|生活|社团/u, tag: "日常", score: 1.0 },
  { pattern: /悬疑|谜团|秘密/u, tag: "悬疑", score: 1.0 },
  { pattern: /推理|逻辑|真相/u, tag: "推理", score: 1.0 },
  { pattern: /幻想|异世界|魔法|奇幻|未来|超现实/u, tag: "幻想", score: 1.0 },
  { pattern: /温柔|治愈|温暖|陪伴/u, tag: "治愈", score: 1.0 },
  { pattern: /黑暗|绝望|残酷|悲剧|血腥|死亡/u, tag: "黑暗", score: 1.2 },
  { pattern: /热血|战斗|奋斗|对决/u, tag: "热血", score: 1.1 },
  { pattern: /友情|羁绊|伙伴/u, tag: "友情", score: 1.0 },
  { pattern: /心理|内心|创伤|意识/u, tag: "心理", score: 1.0 },
  { pattern: /现实|社会|职场|现实世界/u, tag: "现实", score: 1.0 },
  { pattern: /音乐|乐队|歌剧|舞台|偶像|演出/u, tag: "音乐", score: 1.0 },
  { pattern: /命运|宿命/u, tag: "命运", score: 0.9 },
  { pattern: /牺牲|救赎/u, tag: "牺牲", score: 0.9 },
  { pattern: /孤独|自我|一人/u, tag: "孤独", score: 0.9 },
  { pattern: /自由|反抗/u, tag: "自由", score: 0.8 },
  { pattern: /末日|末世|灾难/u, tag: "末世", score: 1.0 },
  { pattern: /超能力|能力者/u, tag: "超能力", score: 0.9 },
  { pattern: /机器人|机械|赛博/u, tag: "机器人", score: 0.9 },
  { pattern: /少女|少女们/u, tag: "少女", score: 0.7 },
  { pattern: /情感|感情|羁绊|羁绊|泪点|催泪/u, tag: "情感", score: 1.0 },
  { pattern: /剧情|故事|叙事|多线|反转|伏笔/u, tag: "叙事", score: 1.0 },
  { pattern: /喜剧|搞笑|幽默|轻松|欢乐/u, tag: "幽默", score: 1.0 },
  { pattern: /机战|机甲|机器人|高达/u, tag: "机战", score: 0.9 },
  { pattern: /运动|竞技|比赛|球场/u, tag: "体操", score: 0.8 },
  { pattern: /群像|多主角|团队/u, tag: "群像", score: 0.9 },
  { pattern: /穿越|转生|重生|异世界/u, tag: "穿越", score: 1.0 },
  { pattern: /恐怖|惊悚|猎奇/u, tag: "黑暗", score: 1.0 },
  { pattern: /哲学|思考|思辨/u, tag: "哲学", score: 0.8 },
  { pattern: /公路|旅行|旅途/u, tag: "旅行", score: 0.8 },
  { pattern: /美食|料理/u, tag: "日常", score: 0.7 },
  { pattern: /职场|工作|上班/u, tag: "职场", score: 0.9 },
  { pattern: /百合|耽美|BL|GL/u, tag: "百合", score: 0.9 },
  { pattern: /偶像|乐队|Live|演唱会/u, tag: "偶像", score: 0.9 },
  { pattern: /氛围|美学|画面/u, tag: "治愈", score: 0.7 },
  { pattern: /沉重|致郁|压抑/u, tag: "黑暗", score: 1.0 },
  { pattern: /冒险|探索|旅程/u, tag: "冒险", score: 0.9 },
  { pattern: /魔法|巫师|咒术/u, tag: "魔法", score: 0.9 },
  { pattern: /神魔|妖怪|妖魔/u, tag: "妖怪", score: 0.8 },
];

const CATEGORY_RULES = [
  { pattern: /治愈|温馨|感动/u, tag: "治愈" },
  { pattern: /黑暗|悬疑|惊悚|血腥|恐怖|悲剧/u, tag: "黑暗" },
  { pattern: /热血|战斗|竞技|动作/u, tag: "热血" },
  { pattern: /奇幻|科幻|异世界|魔法|未来|超能力/u, tag: "幻想" },
  { pattern: /现实|社会|职场|历史/u, tag: "现实" },
  { pattern: /心理|意识|成长/u, tag: "代入" },
  { pattern: /推理|谜题|悬疑/u, tag: "理性" },
  { pattern: /恋爱|爱情|百合/u, tag: "情感" },
  { pattern: /音乐|偶像|歌剧|舞台/u, tag: "音乐" },
  { pattern: /家庭|友情|伙伴|少女/u, tag: "关系" },
  { pattern: /校园|学园/u, tag: "校园" },
  { pattern: /日常|喜剧|搞笑/u, tag: "幽默" },
  { pattern: /复杂|多线|反转/u, tag: "叙事" },
  { pattern: /恐怖|惊悚|猎奇/u, tag: "黑暗" },
  { pattern: /冒险|旅程|公路/u, tag: "冒险" },
  { pattern: /穿越|转生|异世界/u, tag: "穿越" },
  { pattern: /机战|机甲/u, tag: "机战" },
  { pattern: /运动|竞技/u, tag: "体操" },
  { pattern: /职场|工作/u, tag: "职场" },
  { pattern: /哲学|思辨/u, tag: "哲学" },
];

function normalizeTag(tag) {
  const trimmed = String(tag || "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .trim();
  return NORMALIZATION_MAP[trimmed] || trimmed;
}

function isFeatureTag(tag) {
  return Boolean(TAG_DIMENSION_MAP[tag]);
}

function addScore(map, tag, score) {
  if (!tag || !Number.isFinite(score) || score <= 0) {
    return;
  }

  map[tag] = Number(((map[tag] || 0) + score).toFixed(3));
}

function extractRuleMatches(text, rules) {
  const matches = [];
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      matches.push({
        tag: rule.tag,
        score: rule.score ?? 1,
      });
    }
  }
  return matches;
}

function inferTagsFromCategories(categories) {
  const matches = [];
  for (const category of categories) {
    for (const rule of CATEGORY_RULES) {
      if (rule.pattern.test(category)) {
        matches.push(rule.tag);
      }
    }
  }
  return matches;
}

export function buildAggregatedTagScoresFromScrapedItems(scrapedItems) {
  const aggregated = {};

  for (const item of scrapedItems) {
    const normalizedMoeTags = (item.moe_tags || []).map(normalizeTag).filter(Boolean);
    const normalizedCategories = (item.categories || []).map(normalizeTag).filter(Boolean);
    const inferredCategoryTags = inferTagsFromCategories(normalizedCategories).map(normalizeTag);

    normalizedMoeTags.filter(isFeatureTag).forEach((tag) => addScore(aggregated, tag, SOURCE_WEIGHTS.moe_tags));
    normalizedCategories
      .filter(isFeatureTag)
      .forEach((tag) => addScore(aggregated, tag, SOURCE_WEIGHTS.categories));
    inferredCategoryTags
      .filter(isFeatureTag)
      .forEach((tag) => addScore(aggregated, tag, SOURCE_WEIGHTS.inferred_category));

    extractRuleMatches(item.text || "", KEYWORD_RULES).forEach(({ tag, score }) => {
      const normalizedTag = normalizeTag(tag);
      if (isFeatureTag(normalizedTag)) {
        addScore(aggregated, normalizedTag, score * SOURCE_WEIGHTS.keywords);
      }
    });

    extractRuleMatches((item.title || "") + " " + (item.text || ""), KEYWORD_RULES).forEach(({ tag, score }) => {
      const normalizedTag = normalizeTag(tag);
      if (isFeatureTag(normalizedTag)) {
        addScore(aggregated, normalizedTag, score * SOURCE_WEIGHTS.inferred_text * 0.85);
      }
    });
  }

  return Object.fromEntries(
    Object.entries(aggregated)
      .map(([tag, value]) => [tag, Number(value)])
      .sort((a, b) => b[1] - a[1]),
  );
}

function isDisplayableTag(tag) {
  const text = String(tag || "").trim();
  return text.length >= 1 && text.length <= 14;
}

/** 抓取到的原始标签 / 分类 / 简介关键词，用于词云（不限于人格映射表） */
export function buildRawWordScores(scrapedItems) {
  const raw = {};

  for (const item of scrapedItems) {
    for (const tag of item.moe_tags || []) {
      const normalized = normalizeTag(tag);
      if (isDisplayableTag(normalized)) {
        addScore(raw, normalized, SOURCE_WEIGHTS.moe_tags);
      }
    }

    for (const category of (item.categories || []).slice(0, 16)) {
      const normalized = normalizeTag(category);
      if (isDisplayableTag(normalized)) {
        addScore(raw, normalized, SOURCE_WEIGHTS.categories * 0.85);
      }
    }

    extractRuleMatches(item.text || "", KEYWORD_RULES).forEach(({ tag, score }) => {
      const normalized = normalizeTag(tag);
      if (isDisplayableTag(normalized)) {
        addScore(raw, normalized, score * SOURCE_WEIGHTS.keywords);
      }
    });
  }

  return raw;
}

/**
 * 合并：原始抓取标签 + 归一化特征 + 维度得分 Top N
 */
export function buildEnrichedWordCloud(scrapedItems, aggregatedFeatures, dimensions, options = {}) {
  const { maxWords = 80, topDimensions = 6 } = options;
  const merged = buildRawWordScores(scrapedItems);

  for (const [tag, value] of Object.entries(aggregatedFeatures || {})) {
    if (isDisplayableTag(tag)) {
      merged[tag] = Math.max(merged[tag] || 0, value * 1.15);
    }
  }

  const peakTag = Math.max(...Object.values(merged), 1);
  const topDimEntries = Object.entries(dimensions || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, topDimensions);

  for (const [key, score] of topDimEntries) {
    const label = DIMENSION_LABELS[key];
    if (label && Number.isFinite(score) && score > 0) {
      merged[label] = Math.max(merged[label] || 0, peakTag * score * 1.2 + 2);
    }
  }

  return Object.entries(merged)
    .filter(([name]) => isDisplayableTag(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
}

export function extractFeatureVector(scrapedItems) {
  let numericAggregated = buildAggregatedTagScoresFromScrapedItems(scrapedItems);

  if (Object.keys(numericAggregated).length === 0) {
    const titleOnlyItems = scrapedItems.map((item) => ({
      ...item,
      moe_tags: item.moe_tags || [],
      categories: item.categories || [],
      text: item.title || "",
    }));
    numericAggregated = buildAggregatedTagScoresFromScrapedItems(titleOnlyItems);
  }

  const wordCloud = Object.entries(numericAggregated)
    .slice(0, 60)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));

  return {
    aggregatedFeatures: numericAggregated,
    wordCloud,
  };
}

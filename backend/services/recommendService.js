import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { scrapeAnimeBundle } from "./scraper.js";
import { buildAggregatedTagScoresFromScrapedItems } from "./extractor.js";
import {
  cosineSimilarity,
  dimensionLabelSnapshot,
  dimensionVectorToArray,
  rawDimensionVectorFromAggregatedTags,
} from "./contentVector.js";
import { DIMENSION_KEYS } from "./taxonomy.js";
import { fetchPublicUserListsFromApi } from "./userListsProvider.js";

const MODES = new Set(["content", "collaborative", "hybrid"]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POOL_PATH = path.resolve(__dirname, "..", "data", "anime-feature-pool.json");

let _poolCache = null;
let _poolIndex = null;

function loadFeaturePool() {
  if (_poolCache && _poolIndex) {
    return { items: _poolCache, index: _poolIndex };
  }

  if (!existsSync(POOL_PATH)) {
    return { items: [], index: new Map() };
  }

  const raw = JSON.parse(readFileSync(POOL_PATH, "utf-8"));
  _poolCache = raw.items || [];
  _poolIndex = new Map();

  for (const item of _poolCache) {
    const key = normalizeTitle(item.query_title);
    if (!_poolIndex.has(key)) {
      _poolIndex.set(key, item);
    }
    if (item.title && normalizeTitle(item.title) !== key) {
      _poolIndex.set(normalizeTitle(item.title), item);
    }
  }

  return { items: _poolCache, index: _poolIndex };
}

function normalizeTitle(title) {
  return String(title || "").trim().toLowerCase();
}

function baseTitle(title) {
  return normalizeTitle(title)
    .replace(/\s*(第[二三四五六七八九]|[2-9]|\bii+\b|続|完结|完結|ova|oad|sp|special).*/i, "")
    .replace(/\s*(無職|无限|無限度|剧场版|劇場版|総集編|总集编|特別篇|特别篇|特典|セレクション).*/i, "")
    .replace(/\s*[Ⅰ-ⅫⅬ-Ⅿ].*/, "")
    .trim();
}

function dedupeTitles(titles) {
  const seen = new Set();
  const out = [];
  for (const raw of titles) {
    const trimmed = String(raw || "").trim();
    if (!trimmed) continue;
    const key = normalizeTitle(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function isUsableScrapeItem(item) {
  if (!item) return false;
  const hasTags = (item.moe_tags?.length || 0) > 0 || (item.categories?.length || 0) > 0;
  const hasText = Boolean(String(item.text || "").trim());
  return hasTags || hasText;
}

function profileVectorFromItems(items) {
  const aggregated = buildAggregatedTagScoresFromScrapedItems(items);
  const raw = rawDimensionVectorFromAggregatedTags(aggregated);
  return {
    aggregated_tags: aggregated,
    dimensions: raw,
    vector: dimensionVectorToArray(raw),
    dimension_snapshot: dimensionLabelSnapshot(raw),
  };
}

export async function runContentRecommend({ anime_list: sourceTitles, limit = 10 }) {
  const sources = dedupeTitles(sourceTitles);
  const excludeSet = new Set(sources.map(normalizeTitle));

  if (sources.length === 0) {
    throw new Error("anime_list must contain at least one title");
  }

  const scrapedSources = await scrapeAnimeBundle(sources);
  const usableSources = scrapedSources.filter(isUsableScrapeItem);
  if (usableSources.length === 0) {
    throw new Error("No usable scraped data for anime_list (check titles or data sources)");
  }

  const profile = profileVectorFromItems(usableSources);
  const { items: poolItems } = loadFeaturePool();

  const scored = [];
  for (const item of poolItems) {
    const key = normalizeTitle(item.query_title);
    if (excludeSet.has(key)) continue;

    const similarity = cosineSimilarity(profile.vector, item.vector_14);
    if (similarity <= 0) continue;

    scored.push({
      title: item.query_title,
      score: Number(similarity.toFixed(4)),
      cosine_similarity: Number(similarity.toFixed(4)),
      source: item.source,
      dimensions_14: item.dimensions_14,
    });
  }

  scored.sort((a, b) => b.score - a.score);

  const seenTitles = new Set();
  const top = [];
  for (const row of scored) {
    const base = baseTitle(row.title);
    if (seenTitles.has(base)) continue;
    seenTitles.add(base);
    top.push(row);
    if (top.length >= limit) break;
  }

  return {
    mode: "content",
    profile: {
      source_titles: sources,
      dimensions_14: profile.dimension_snapshot,
      aggregated_tags: profile.aggregated_tags,
      dimension_keys: [...DIMENSION_KEYS],
    },
    items: top,
    candidates_scanned: scored.length,
    pool_size: poolItems.length,
  };
}

export async function runCollaborativeRecommend({
  anime_list: myTitles,
  limit = 10,
  min_overlap = 1,
  exclude_user_id = null,
}) {
  const mine = dedupeTitles(myTitles);
  if (mine.length === 0) {
    throw new Error("anime_list must contain at least one title");
  }

  const mySet = new Set(mine.map(normalizeTitle));
  const listsResult = await fetchPublicUserListsFromApi();

  if (!listsResult.ok) {
    return {
      mode: "collaborative",
      items: [],
      buddy_matches: [],
      meta: {
        user_lists_status: listsResult.reason,
        message: listsResult.message,
      },
      candidates_scanned: 0,
    };
  }

  const animeScores = new Map();
  const buddyRows = [];

  for (const user of listsResult.users) {
    if (exclude_user_id && String(user.user_id) === String(exclude_user_id)) continue;

    const theirSet = new Set(user.anime_titles.map(normalizeTitle));
    let overlap = 0;
    for (const t of mySet) {
      if (theirSet.has(t)) overlap += 1;
    }

    if (overlap < min_overlap) continue;

    const unionSize = new Set([...mySet, ...theirSet]).size;
    const jaccard = unionSize === 0 ? 0 : overlap / unionSize;

    buddyRows.push({
      user_id: user.user_id,
      overlap_count: overlap,
      jaccard: Number(jaccard.toFixed(4)),
      sample_shared_titles: mine.filter((t) => theirSet.has(normalizeTitle(t))).slice(0, 5),
    });

    const weight = overlap * (0.5 + jaccard);

    for (const rawTitle of dedupeTitles(user.anime_titles)) {
      const key = normalizeTitle(rawTitle);
      if (mySet.has(key)) continue;
      animeScores.set(key, {
        display_title: rawTitle.trim(),
        score: (animeScores.get(key)?.score || 0) + weight,
      });
    }
  }

  buddyRows.sort((a, b) => b.overlap_count - a.overlap_count || b.jaccard - a.jaccard);

  const rankedAnime = [...animeScores.entries()]
    .map(([, value]) => ({
      title: value.display_title,
      score: Number(value.score.toFixed(4)),
      source: "user_lists",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    mode: "collaborative",
    items: rankedAnime,
    buddy_matches: buddyRows.slice(0, 15),
    meta: {
      user_lists_status: "ok",
      total_users_considered: listsResult.users.length,
    },
    candidates_scanned: animeScores.size,
  };
}

function normalizeScores(rows) {
  const max = Math.max(...rows.map((r) => r.score || 0), 1e-9);
  return new Map(rows.map((r) => [normalizeTitle(r.title), (r.score || 0) / max]));
}

export async function runHybridRecommend({
  anime_list,
  limit = 10,
  hybrid_alpha = 0.7,
  min_overlap = 1,
  exclude_user_id = null,
}) {
  const alpha = Math.min(1, Math.max(0, Number(hybrid_alpha)));

  const [content, collaborative] = await Promise.all([
    runContentRecommend({ anime_list, limit: Math.max(limit * 3, 20) }),
    runCollaborativeRecommend({ anime_list, limit: Math.max(limit * 3, 20), min_overlap, exclude_user_id }),
  ]);

  if (collaborative.items.length === 0) {
    const top = content.items.slice(0, limit).map((row) => ({
      title: row.title,
      score: Number((row.score || 0).toFixed(4)),
      cosine_similarity: row.cosine_similarity,
      source: row.source,
      breakdown: {
        content: Number((row.score || 0).toFixed(4)),
        collaborative: 0,
        alpha,
      },
    }));

    return {
      mode: "hybrid",
      items: top,
      components: { content: content.items.slice(0, limit), collaborative: [] },
      buddy_matches: collaborative.buddy_matches,
      meta: {
        hybrid_alpha: alpha,
        collaborative_status: collaborative.meta?.user_lists_status || null,
        hybrid_note:
          "No collaborative signals; returned content-based ranking (configure USER_LISTS_API_URL to enable).",
      },
      profile: content.profile,
      candidates_scanned: content.candidates_scanned,
    };
  }

  const contentMap = normalizeScores(content.items);
  const collabMap = normalizeScores(collaborative.items);
  const keys = new Set([...contentMap.keys(), ...collabMap.keys()]);

  const merged = [];
  for (const key of keys) {
    const c = contentMap.get(key) || 0;
    const f = collabMap.get(key) || 0;
    const blended = alpha * c + (1 - alpha) * f;
    const displayTitle =
      content.items.find((row) => normalizeTitle(row.title) === key)?.title ||
      collaborative.items.find((row) => normalizeTitle(row.title) === key)?.title ||
      key;

    merged.push({
      title: displayTitle,
      score: Number(blended.toFixed(4)),
      breakdown: { content: Number(c.toFixed(4)), collaborative: Number(f.toFixed(4)), alpha },
    });
  }

  merged.sort((a, b) => b.score - a.score);

  return {
    mode: "hybrid",
    items: merged.slice(0, limit),
    components: {
      content: content.items.slice(0, limit),
      collaborative: collaborative.items.slice(0, limit),
    },
    buddy_matches: collaborative.buddy_matches,
    meta: { hybrid_alpha: alpha, collaborative_status: "ok" },
    profile: content.profile,
    candidates_scanned: keys.size,
  };
}

export async function runRecommend(body) {
  const mode = String(body?.mode || "content").trim();
  if (!MODES.has(mode)) {
    throw new Error(`mode must be one of: ${[...MODES].join(", ")}`);
  }

  const anime_list = Array.isArray(body?.anime_list) ? body.anime_list : null;
  if (!anime_list || anime_list.length === 0) {
    throw new Error("anime_list must be an array with at least one title");
  }
  if (anime_list.length > 40) {
    throw new Error("anime_list length must be <= 40");
  }

  const limit = Math.min(50, Math.max(1, Number(body?.limit || 10)));
  const min_overlap = Math.min(20, Math.max(1, Number(body?.min_overlap || 1)));
  const hybrid_alpha = Number(body?.hybrid_alpha ?? 0.7);
  const exclude_user_id = body?.exclude_user_id ?? null;

  if (mode === "content") {
    return runContentRecommend({ anime_list, limit });
  }

  if (mode === "collaborative") {
    return runCollaborativeRecommend({ anime_list, limit, min_overlap, exclude_user_id });
  }

  return runHybridRecommend({ anime_list, limit, hybrid_alpha, min_overlap, exclude_user_id });
}

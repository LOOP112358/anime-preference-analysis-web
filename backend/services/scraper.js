import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** 单次 HTTP 超时（ms）。Bangumi 一次抓取含搜索页 + 条目页两次请求。 */
const FETCH_TIMEOUT_MS = Number(process.env.SCRAPER_FETCH_TIMEOUT_MS || 22000);

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: FETCH_TIMEOUT_MS,
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
  });
  return response.data;
}

function compactText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function dedupeList(items) {
  return [...new Set(items.map((item) => compactText(item)).filter(Boolean))];
}

function sliceUsefulParagraphs(paragraphs) {
  return paragraphs
    .filter((text) => {
      if (!text) {
        return false;
      }

      return !/^(本页面最后编辑于|跳转到导航|目录|注释与外部链接|片头歌|片尾歌)/.test(text);
    })
    .slice(0, 5);
}

function parseWikipediaPage(html, requestedTitle) {
  const $ = cheerio.load(html);
  $("script, style, noscript, table.navbox, .navbox, .metadata").remove();
  const title = compactText($("#firstHeading").text()) || requestedTitle;
  const categories = [];

  $("#mw-normal-catlinks a").each((_, element) => {
    const value = compactText($(element).text());
    if (value && value !== "Categories" && value !== "分类") {
      categories.push(value);
    }
  });

  const paragraphs = [];
  $("div.mw-parser-output > p").each((_, element) => {
    const text = compactText($(element).text());
    if (text) {
      paragraphs.push(text);
    }
  });

  return {
    source: "wikipedia",
    title,
    moe_tags: [],
    categories: dedupeList(categories),
    text: sliceUsefulParagraphs(paragraphs).join(" "),
  };
}

async function scrapeWikipedia(title) {
  const url = `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  const html = await fetchHtml(url);
  return parseWikipediaPage(html, title);
}

function parseBangumiSearchResult(html) {
  const $ = cheerio.load(html);
  const firstItem = $("ul#browserItemList li.item").first();
  if (!firstItem.length) {
    return null;
  }

  const href = firstItem.find("h3 a").first().attr("href");
  const title = compactText(firstItem.find("h3 a").first().text());
  if (!href) {
    return null;
  }

  return {
    href,
    title,
  };
}

function parseBangumiSearchResults(html) {
  const $ = cheerio.load(html);
  const results = [];
  $("ul#browserItemList li.item").each((_, element) => {
    const link = $(element).find("h3 a").first();
    const href = link.attr("href");
    const title = compactText(link.text());
    if (href && title) {
      results.push({
        href: href.startsWith("http") ? href : `https://bangumi.tv${href}`,
        title,
      });
    }
  });
  return results;
}

function scoreSearchResult(resultTitle, requestedTitle) {
  const r = normalizeTitle(resultTitle);
  const q = normalizeTitle(requestedTitle);

  if (r === q) return 100;
  if (r.includes(q) || q.includes(r)) return 80;

  const qChars = [...q].filter((c) => /[一-鿿぀-ゟ゠-ヿ]/.test(c));
  if (qChars.length >= 2) {
    let matched = 0;
    for (const c of qChars) {
      if (r.includes(c)) matched += 1;
    }
    if (matched >= qChars.length) return 70;
    if (matched >= qChars.length * 0.7) return 50;
  }

  return 0;
}

function pickBestSearchResult(results, requestedTitle) {
  if (results.length === 0) return null;

  let best = results[0];
  let bestScore = scoreSearchResult(best.title, requestedTitle);

  for (let i = 1; i < results.length; i += 1) {
    const s = scoreSearchResult(results[i].title, requestedTitle);
    if (s > bestScore) {
      bestScore = s;
      best = results[i];
    }
  }

  return { ...best, _matchScore: bestScore };
}

function normalizeTitle(title) {
  return String(title || "").trim().toLowerCase();
}

export async function searchBangumi(keyword, maxResults = 10) {
  const url = `https://bangumi.tv/subject_search/${encodeURIComponent(keyword)}?cat=2`;
  const html = await fetchHtml(url);
  return parseBangumiSearchResults(html).slice(0, maxResults);
}

function parseBangumiSubjectPage(html, requestedTitle) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();

  const title =
    compactText($("h1.nameSingle a").first().text()) ||
    compactText($("h1 a").first().text()) ||
    requestedTitle;

  const tags = $(".subject_tag_section a.l")
    .map((_, element) => compactText($(element).text()).replace(/\s+\d+$/, ""))
    .get();

  const text = compactText($("#subject_summary").text());

  return {
    source: "bangumi",
    title,
    moe_tags: dedupeList(tags),
    categories: [],
    text,
  };
}

async function scrapeBangumi(title) {
  const url = `https://bangumi.tv/subject_search/${encodeURIComponent(title)}?cat=2`;
  const html = await fetchHtml(url);
  const allResults = parseBangumiSearchResults(html);
  const best = pickBestSearchResult(allResults, title);

  if (!best) {
    throw new Error(`No Bangumi search result found for ${title}`);
  }

  const subjectUrl = best.href.startsWith("http")
    ? best.href
    : `https://bangumi.tv${best.href}`;
  const subjectHtml = await fetchHtml(subjectUrl);
  return parseBangumiSubjectPage(subjectHtml, title);
}

function isMeaningfulResult(result) {
  return Boolean(result?.text || result?.moe_tags?.length || result?.categories?.length);
}

function mergeResults(title, results, errors) {
  const validResults = results.filter(isMeaningfulResult);
  if (validResults.length === 0) {
    return {
      source: "unresolved",
      title,
      moe_tags: [],
      categories: [],
      text: "",
      error: errors.filter(Boolean).join("; "),
      references: [],
    };
  }

  const mergedTitle = validResults.find((item) => item.title)?.title || title;
  const mergedText = validResults
    .map((item) => item.text)
    .filter(Boolean)
    .join(" ")
    .slice(0, 2400);

  return {
    source: validResults.map((item) => item.source).join("+"),
    title: mergedTitle,
    moe_tags: dedupeList(validResults.flatMap((item) => item.moe_tags || [])),
    categories: dedupeList(validResults.flatMap((item) => item.categories || [])),
    text: mergedText,
    references: validResults.map((item) => item.source),
    error: errors.filter(Boolean).join("; ") || undefined,
  };
}

export async function scrapeAnime(title) {
  const errors = [];
  let bangumiResult = null;

  try {
    bangumiResult = await scrapeBangumi(title);
  } catch (reason) {
    errors.push(`bangumi: ${reason?.message || "unknown error"}`);
  }

  if (bangumiResult && isMeaningfulResult(bangumiResult)) {
    return mergeResults(title, [bangumiResult], errors);
  }

  if (bangumiResult && !isMeaningfulResult(bangumiResult)) {
    errors.push("bangumi: subject has no usable tags or summary");
  }

  try {
    const wikiResult = await scrapeWikipedia(title);
    if (isMeaningfulResult(wikiResult)) {
      return mergeResults(title, [wikiResult], errors);
    }
    errors.push("wikipedia: page has no usable categories or intro text");
  } catch (reason) {
    errors.push(`wikipedia: ${reason?.message || "unknown error"}`);
  }

  return mergeResults(title, [], errors);
}

/**
 * 多部作品并行抓取时，若同时打满 Bangumi / 维基，容易被限速或排队，从而频繁触发 timeout / ECONNRESET。
 * 这里按小批次串行化并发度（默认每批 2 部），整体更稳；可用环境变量 SCRAPER_BUNDLE_CONCURRENCY 调整（≥1）。
 */
async function mapWithConcurrency(items, limit, mapper) {
  const safeLimit = Math.max(1, limit);
  const out = [];
  for (let i = 0; i < items.length; i += safeLimit) {
    const batch = items.slice(i, i + safeLimit);
    const chunk = await Promise.all(batch.map((item, j) => mapper(item, i + j)));
    out.push(...chunk);
  }
  return out;
}

export async function scrapeAnimeBundle(titles) {
  const concurrency = Number(process.env.SCRAPER_BUNDLE_CONCURRENCY || 2);
  return mapWithConcurrency(titles, concurrency, (title) => scrapeAnime(title));
}

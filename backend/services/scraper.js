import axios from "axios";
import * as cheerio from "cheerio";
import { HttpsProxyAgent } from "https-proxy-agent";

const USER_AGENT =
  process.env.SCRAPER_USER_AGENT ||
  "AcgPreferenceAnalyzer/1.0 (+https://github.com/LOOP112358/anime-preference-analysis-web; wiki fallback) Mozilla/5.0 (compatible; AcgPreferenceAnalyzer/1.0)";

/** 单次 HTTP 超时（ms）。Bangumi 一次抓取含搜索页 + 条目页两次请求。 */
const FETCH_TIMEOUT_MS = Number(process.env.SCRAPER_FETCH_TIMEOUT_MS || 12000);

const WIKIPEDIA_API = "https://zh.wikipedia.org/w/api.php";

function formatScrapeError(reason) {
  if (!reason) {
    return "unknown error";
  }
  const status = reason.response?.status;
  if (status) {
    return `HTTP ${status}`;
  }
  return reason.message || reason.code || String(reason);
}

function getFetchAxiosConfig(proxyUrl = process.env.SCRAPER_HTTPS_PROXY || process.env.HTTPS_PROXY) {
  const config = {
    timeout: FETCH_TIMEOUT_MS,
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
  };
  if (proxyUrl) {
    config.httpsAgent = new HttpsProxyAgent(proxyUrl);
    config.proxy = false;
  }
  return config;
}

/** 维基可走独立代理；仅当你在本机真的运行了代理程序时才需要填写 */
function getWikiAxiosConfig() {
  const wikiProxy = process.env.SCRAPER_WIKI_PROXY || process.env.SCRAPER_HTTPS_PROXY || process.env.HTTPS_PROXY;
  return getFetchAxiosConfig(wikiProxy || undefined);
}

let lastSupplementRequestAt = 0;

async function throttleSupplementRequest() {
  const gapMs = Number(process.env.SCRAPER_WIKI_DELAY_MS || 900);
  const waitMs = lastSupplementRequestAt + gapMs - Date.now();
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastSupplementRequestAt = Date.now();
}

async function fetchHtml(url, configFactory = getFetchAxiosConfig) {
  const response = await axios.get(url, configFactory());
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

async function scrapeMediaWikiApi(title, { apiUrl, source, getConfig = getFetchAxiosConfig }) {
  const response = await axios.get(apiUrl, {
    ...getConfig(),
    params: {
      action: "query",
      prop: "extracts|categories",
      exintro: 1,
      explaintext: 1,
      cllimit: 20,
      titles: title,
      format: "json",
      formatversion: 2,
      redirects: 1,
    },
  });

  const page = response.data?.query?.pages?.[0];
  if (!page || page.missing) {
    throw new Error(`No ${source} page found for ${title}`);
  }

  const categories = (page.categories || [])
    .map((item) => compactText(String(item.title || "").replace(/^Category:/i, "")))
    .filter(Boolean);

  const paragraphs = String(page.extract || "")
    .split(/\n+/)
    .map(compactText)
    .filter(Boolean);

  return {
    source,
    title: compactText(page.title) || title,
    moe_tags: [],
    categories: dedupeList(categories),
    text: sliceUsefulParagraphs(paragraphs).join(" "),
  };
}

async function scrapeWikipedia(title) {
  await throttleSupplementRequest();
  try {
    return await scrapeMediaWikiApi(title, {
      apiUrl: WIKIPEDIA_API,
      source: "wikipedia",
      getConfig: getWikiAxiosConfig,
    });
  } catch {
    const url = `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    const html = await fetchHtml(url, getWikiAxiosConfig);
    return parseWikipediaPage(html, title);
  }
}

async function scrapeWikipediaWithFallback(titles) {
  const queries = dedupeList(titles.filter(Boolean));
  const errors = [];

  for (const query of queries) {
    try {
      const result = await scrapeWikipedia(query);
      if (isMeaningfulResult(result)) {
        return { result, errors };
      }
      errors.push(`wikipedia(${query}): page has no usable categories or intro text`);
    } catch (reason) {
      errors.push(`wikipedia(${query}): ${formatScrapeError(reason)}`);
    }
  }

  return { result: null, errors };
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
    .slice(0, 3200);

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
    errors.push(`bangumi: ${formatScrapeError(reason)}`);
  }

  const wikiQueries = dedupeList([
    bangumiResult?.title,
    title,
    // 部分中文条目维基用简体名，Bangumi 可能是日文名
    String(title || "").replace(/\s+/g, ""),
  ]);

  let wikiResult = null;
  if (process.env.SCRAPER_WIKI_ENABLED !== "0") {
    const wikiAttempt = await scrapeWikipediaWithFallback(wikiQueries);
    wikiResult = wikiAttempt.result;
    errors.push(...wikiAttempt.errors);
  }

  const meaningful = [bangumiResult, wikiResult].filter(isMeaningfulResult);
  if (meaningful.length > 0) {
    return mergeResults(title, meaningful, errors);
  }

  if (bangumiResult && !isMeaningfulResult(bangumiResult)) {
    errors.push("bangumi: subject has no usable tags or summary");
  }
  if (wikiResult && !isMeaningfulResult(wikiResult)) {
    errors.push("wikipedia: page has no usable categories or intro text");
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

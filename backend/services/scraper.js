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
  const searchUrl = `https://bangumi.tv/subject_search/${encodeURIComponent(title)}?cat=2`;
  const searchHtml = await fetchHtml(searchUrl);
  const searchResult = parseBangumiSearchResult(searchHtml);
  if (!searchResult?.href) {
    throw new Error(`No Bangumi search result found for ${title}`);
  }

  const subjectUrl = searchResult.href.startsWith("http")
    ? searchResult.href
    : `https://bangumi.tv${searchResult.href}`;
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

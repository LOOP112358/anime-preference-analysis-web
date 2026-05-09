import axios from "axios";
import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: 12000,
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

function parseMoegirlPage(html, requestedTitle) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  const title = compactText($("h1#firstHeading").text()) || requestedTitle;
  const moeTags = [];
  const categories = [];

  $("h2, h3").each((_, element) => {
    const heading = compactText($(element).text());
    if (!heading.includes("萌点")) {
      return;
    }

    let next = $(element).next();
    let guard = 0;
    while (next.length && guard < 8) {
      if (["h2", "h3"].includes(next[0].tagName)) {
        break;
      }

      next.find("li").each((__, li) => {
        const text = compactText($(li).text()).split(/[、/|,，]/).map(compactText);
        moeTags.push(...text);
      });

      if (next[0].tagName === "ul") {
        next.children("li").each((__, li) => {
          const text = compactText($(li).text()).split(/[、/|,，]/).map(compactText);
          moeTags.push(...text);
        });
      }

      next = next.next();
      guard += 1;
    }
  });

  $("#mw-normal-catlinks a").each((_, element) => {
    const value = compactText($(element).text());
    if (value && value !== "分类") {
      categories.push(value);
    }
  });

  const paragraphs = [];
  $(".mw-parser-output > p").each((_, element) => {
    const text = compactText($(element).text());
    if (text && !/^本页面最后编辑于|跳转到|导航/.test(text)) {
      paragraphs.push(text);
    }
  });

  const text = paragraphs.slice(0, 4).join(" ");

  return {
    source: "moegirl",
    title,
    moe_tags: dedupeList(moeTags),
    categories: dedupeList(categories),
    text,
  };
}

function parseWikipediaPage(html, requestedTitle) {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
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
    text: paragraphs.slice(0, 4).join(" "),
  };
}

async function scrapeMoegirl(title) {
  const url = `https://zh.moegirl.org.cn/${encodeURIComponent(title)}`;
  const html = await fetchHtml(url);
  return parseMoegirlPage(html, title);
}

async function scrapeWikipedia(title) {
  const url = `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}`;
  const html = await fetchHtml(url);
  return parseWikipediaPage(html, title);
}

function ensureMeaningfulResult(result) {
  if (!result.text && result.moe_tags.length === 0 && result.categories.length === 0) {
    throw new Error(`No usable content found for ${result.title}`);
  }
  return result;
}

export async function scrapeAnime(title) {
  try {
    return ensureMeaningfulResult(await scrapeMoegirl(title));
  } catch (moegirlError) {
    try {
      return ensureMeaningfulResult(await scrapeWikipedia(title));
    } catch (wikipediaError) {
      return {
        source: "unresolved",
        title,
        moe_tags: [],
        categories: [],
        text: "",
        error: `Failed to fetch ${title}: ${moegirlError.message}; fallback: ${wikipediaError.message}`,
      };
    }
  }
}

export async function scrapeAnimeBundle(titles) {
  return Promise.all(titles.map((title) => scrapeAnime(title)));
}

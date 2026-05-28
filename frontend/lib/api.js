/** 生产 build 走同源 /api（Nginx 反代）；本地 dev 直连 4100 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:4100/api");

async function postJson(path, body, { timeoutMs = 90000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("请求超时：抓取 Bangumi/维基耗时过长，请检查网络或在 backend/.env 配置 SCRAPER_HTTPS_PROXY");
    }
    throw new Error(error?.message || "网络请求失败，请确认后端已在 4100 端口运行");
  } finally {
    clearTimeout(timer);
  }

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "分析失败");
  }

  return payload.data;
}

export function analyzeAnimeList(animeList) {
  return postJson("/analyze", { anime_list: animeList }, { timeoutMs: 90000 });
}

/** @param {{ mode?: string, anime_list: string[], limit?: number, min_overlap?: number, hybrid_alpha?: number }} body */
export function recommendAnimeList(body) {
  return postJson("/recommend", body);
}

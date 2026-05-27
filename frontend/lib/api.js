const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

async function postJson(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "分析失败");
  }

  return payload.data;
}

export function analyzeAnimeList(animeList) {
  return postJson("/analyze", { anime_list: animeList });
}

/** @param {{ mode?: string, anime_list: string[], limit?: number, min_overlap?: number, hybrid_alpha?: number }} body */
export function recommendAnimeList(body) {
  return postJson("/recommend", body);
}

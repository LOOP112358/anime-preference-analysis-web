const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4100/api";

export async function analyzeAnimeList(animeList) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ anime_list: animeList }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || "分析失败");
  }

  return payload.data;
}

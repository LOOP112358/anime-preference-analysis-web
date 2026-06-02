/**
 * 浏览器端默认走同源 /post-api（由 next.config 代理到 Flask :5001），避免 CORS 导致 Failed to fetch。
 * 服务端渲染或需直连时可设置 NEXT_PUBLIC_POST_API_URL=http://127.0.0.1:5001
 */
export function getPostApiBase() {
  if (process.env.NEXT_PUBLIC_POST_API_URL) {
    const configured = process.env.NEXT_PUBLIC_POST_API_URL.replace(/\/$/, "");
    // localhost 只对开发机有效，访客手机无法访问，线上应走同源 /post-api
    if (typeof window !== "undefined") {
      const isLocalOnly = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(configured);
      if (isLocalOnly) return "/post-api";
    }
    return configured;
  }
  if (typeof window !== "undefined") {
    return "/post-api";
  }
  return "http://127.0.0.1:5001";
}

export function getPostDefaultImage() {
  return `${getPostApiBase()}/static/default.jpg`;
}

export function getPostDefaultAvatar() {
  return `${getPostApiBase()}/static/default_avatar.jpg`;
}

export function getProxiedImageUrl(imageUrl) {
  if (!imageUrl) return "";
  const normalized = imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl;

  if (normalized.startsWith("/static") || normalized.startsWith("/post-api/static")) {
    const base = getPostApiBase();
    return normalized.startsWith("/post-api") ? normalized : `${base}${normalized}`;
  }
  if (!normalized.startsWith("http")) {
    return `${getPostApiBase()}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
  }
  return `${getPostApiBase()}/proxy/image?url=${encodeURIComponent(normalized)}`;
}

export function resolvePostImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("upload/")) return getPostDefaultAvatar();
  return getProxiedImageUrl(url);
}

async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    const hint = text.trim().startsWith("<")
      ? "Flask 可能未启动，或端口与 next.config 里的 5001 不一致。"
      : "请检查 Flask 终端报错，并确认 MySQL 与 .env 已配置。";
    throw new Error(
      `用户服务返回异常（HTTP ${response.status}）。${hint} 请在 backend/user_post_backend 运行 python app.py。`,
    );
  }
}

async function fetchPost(path, options = {}) {
  let response;
  try {
    response = await fetch(`${getPostApiBase()}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch {
    throw new Error(
      "无法连接用户发布服务。请确认已在 backend/user_post_backend 运行 python app.py，并重启过 npm run dev。",
    );
  }

  const payload = await parseJsonResponse(response);
  if (!payload.success) {
    throw new Error(payload.message || "请求失败");
  }
  return payload;
}

async function request(path, options = {}) {
  const payload = await fetchPost(path, options);
  return payload.data;
}

export function loginUser(user_name, password) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ user_name, password }),
  });
}

export function fetchUserProfile(userId) {
  return request(`/user/${userId}`);
}

export function updateUserProfile({ user_id, user_intro, photo }) {
  return request("/user/update", {
    method: "POST",
    body: JSON.stringify({ user_id, user_intro, photo }),
  });
}

export async function registerUser(user_name, password) {
  const payload = await fetchPost("/register", {
    method: "POST",
    body: JSON.stringify({ user_name, password }),
  });
  return payload.message;
}

export function fetchAnimeList() {
  return request("/anime/list");
}

export function fetchCharacterList() {
  return request("/character/list");
}

export function fetchUserAnime(userId) {
  return request(`/user/${userId}/anime`);
}

export function fetchUserCharacters(userId) {
  return request(`/user/${userId}/character`);
}

export function publishAnime({ user_id, ani_name, ani_type, ani_com, ani_img }) {
  return request("/anime/add", {
    method: "POST",
    body: JSON.stringify({ user_id, ani_name, ani_type, ani_com, ani_img }),
  });
}

export function publishCharacter({ user_id, char_name, char_from, char_com, char_img }) {
  return request("/character/add", {
    method: "POST",
    body: JSON.stringify({ user_id, char_name, char_from, char_com, char_img }),
  });
}

export function deleteAnime(ani_id, user_id) {
  return request("/anime/delete", {
    method: "POST",
    body: JSON.stringify({ ani_id, user_id }),
  });
}

export function deleteCharacter(char_id, user_id) {
  return request("/character/delete", {
    method: "POST",
    body: JSON.stringify({ char_id, user_id }),
  });
}

export function updateAnime({ ani_id, user_id, ani_name, ani_type, ani_com, ani_img, reset_img }) {
  return request("/anime/update", {
    method: "POST",
    body: JSON.stringify({ ani_id, user_id, ani_name, ani_type, ani_com, ani_img, reset_img }),
  });
}

export function updateCharacter({ char_id, user_id, char_name, char_from, char_com, char_img, reset_img }) {
  return request("/character/update", {
    method: "POST",
    body: JSON.stringify({ char_id, user_id, char_name, char_from, char_com, char_img, reset_img }),
  });
}

export function fetchFavoriteAnime(userId) {
  return request(`/user/${userId}/favorite/anime`);
}

export function fetchFavoriteCharacters(userId) {
  return request(`/user/${userId}/favorite/character`);
}

export function addFavoriteAnime(user_id, ani_id) {
  return fetchPost("/favorite/anime/add", {
    method: "POST",
    body: JSON.stringify({ user_id, ani_id }),
  });
}

export function removeFavoriteAnime(user_id, ani_id) {
  return fetchPost("/favorite/anime/delete", {
    method: "POST",
    body: JSON.stringify({ user_id, ani_id }),
  });
}

export function addFavoriteCharacter(user_id, char_id) {
  return fetchPost("/favorite/character/add", {
    method: "POST",
    body: JSON.stringify({ user_id, char_id }),
  });
}

export function removeFavoriteCharacter(user_id, char_id) {
  return fetchPost("/favorite/character/delete", {
    method: "POST",
    body: JSON.stringify({ user_id, char_id }),
  });
}

export function fetchAnimeFavoriteUsers(aniId) {
  return request(`/anime/${aniId}/favorite/users`);
}

export function fetchCharacterFavoriteUsers(charId) {
  return request(`/character/${charId}/favorite/users`);
}

export function previewAnimeImage(name) {
  return request(`/preview/anime?name=${encodeURIComponent(name)}`);
}

export function previewCharacterImage(name) {
  return request(`/preview/character?name=${encodeURIComponent(name)}`);
}

export async function uploadPostImage(blob, filename = "crop.jpg") {
  const form = new FormData();
  form.append("file", blob, filename);

  let response;
  try {
    response = await fetch(`${getPostApiBase()}/upload/image`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new Error("图片上传失败，请确认 Flask 后端已启动");
  }

  const payload = await parseJsonResponse(response);
  if (!payload.success) {
    throw new Error(payload.message || "图片上传失败");
  }
  return payload.data.url;
}

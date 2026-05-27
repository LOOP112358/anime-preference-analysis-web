/**
 * 浏览器端默认走同源 /post-api（由 next.config 代理到 Flask :5000），避免 CORS 导致 Failed to fetch。
 * 服务端渲染或需直连时可设置 NEXT_PUBLIC_POST_API_URL=http://127.0.0.1:5000
 */
function getPostApiBase() {
  if (process.env.NEXT_PUBLIC_POST_API_URL) {
    return process.env.NEXT_PUBLIC_POST_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return "/post-api";
  }
  return "http://127.0.0.1:5000";
}

export function getPostDefaultImage() {
  return `${getPostApiBase()}/static/default.jpg`;
}

async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `用户服务返回异常（HTTP ${response.status}）。请检查 Flask 终端报错，并确认 MySQL 与 .env 已配置。`,
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

export function publishAnime({ user_id, ani_name, ani_type, ani_com }) {
  return request("/anime/add", {
    method: "POST",
    body: JSON.stringify({ user_id, ani_name, ani_type, ani_com }),
  });
}

export function publishCharacter({ user_id, char_name, char_from, char_com }) {
  return request("/character/add", {
    method: "POST",
    body: JSON.stringify({ user_id, char_name, char_from, char_com }),
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

import axios from "axios";

function normalizePayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.users)) {
    return payload.users;
  }

  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }

  return null;
}

function normalizeUserRecord(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const userId =
    entry.user_id ?? entry.userId ?? entry.id ?? entry.uid ?? entry.username ?? "anonymous";

  const rawList =
    entry.anime_list ??
    entry.animeList ??
    entry.favorites ??
    entry.titles ??
    entry.liked_anime ??
    entry.likedAnime ??
    [];

  if (!Array.isArray(rawList)) {
    return null;
  }

  const animeTitles = rawList.map((item) => String(item || "").trim()).filter(Boolean);

  return {
    user_id: String(userId),
    anime_titles: animeTitles,
  };
}

/**
 * Cheria 分支 user_post_backend：`GET /anime/list` 返回的是「每条发布一条记录」，
 * 字段为 user_id + ani_name，需要按 user_id 聚合成「每个用户一个番名列表」。
 */
function coerceUsersFromRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const first = rows[0];
  const bundledList =
    first?.anime_list ?? first?.animeList ?? first?.favorites ?? first?.titles ?? first?.liked_anime;

  if (Array.isArray(bundledList)) {
    return rows.map(normalizeUserRecord).filter(Boolean);
  }

  const hasFlatAnimePost =
    (first?.ani_name != null || first?.aniName != null || first?.anime_name != null) &&
    (first?.user_id != null || first?.userId != null);

  if (hasFlatAnimePost) {
    const byUser = new Map();
    for (const row of rows) {
      const uid = row.user_id ?? row.userId;
      const title = row.ani_name ?? row.aniName ?? row.anime_name ?? row.title;
      if (uid == null || !title) {
        continue;
      }
      const key = String(uid);
      if (!byUser.has(key)) {
        byUser.set(key, { user_id: key, anime_titles: [] });
      }
      byUser.get(key).anime_titles.push(String(title).trim());
    }
    for (const u of byUser.values()) {
      u.anime_titles = [...new Set(u.anime_titles.filter(Boolean))];
    }
    return [...byUser.values()];
  }

  return rows.map(normalizeUserRecord).filter(Boolean);
}

export async function fetchPublicUserListsFromApi() {
  const url = String(process.env.USER_LISTS_API_URL || "").trim();

  if (!url) {
    return {
      ok: false,
      reason: "USER_LISTS_API_URL_NOT_SET",
      message: "Configure USER_LISTS_API_URL when the user-publication API (task 4) is available.",
      users: [],
    };
  }

  const headers = {
    Accept: "application/json",
  };

  const apiKey = String(process.env.USER_LISTS_API_KEY || "").trim();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const response = await axios.get(url, {
      timeout: Number(process.env.USER_LISTS_API_TIMEOUT_MS || 8000),
      headers,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      return {
        ok: false,
        reason: "USER_LISTS_HTTP_ERROR",
        message: `User lists API returned HTTP ${response.status}`,
        users: [],
      };
    }

    const body = response.data;
    if (body && body.success === false) {
      return {
        ok: false,
        reason: "USER_LISTS_API_ERROR",
        message: String(body.message || "User lists API returned success: false"),
        users: [],
      };
    }

    const rows = normalizePayload(body);
    if (!rows) {
      return {
        ok: false,
        reason: "USER_LISTS_UNEXPECTED_SHAPE",
        message: "Expected a JSON array or an object with a `users` / `data` array.",
        users: [],
      };
    }

    const users = coerceUsersFromRows(rows);
    if (rows.length > 0 && users.length === 0) {
      return {
        ok: false,
        reason: "USER_LISTS_UNRECOGNIZED_ROWS",
        message:
          "Received rows but could not build user anime lists (expected bundled `anime_list` or flat `user_id`+`ani_name` rows).",
        users: [],
      };
    }

    return {
      ok: true,
      reason: null,
      message: null,
      users,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "USER_LISTS_REQUEST_FAILED",
      message: error.message || "Failed to reach user lists API",
      users: [],
    };
  }
}

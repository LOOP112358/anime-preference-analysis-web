"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteAnime,
  deleteCharacter,
  fetchAnimeList,
  fetchCharacterList,
  fetchUserAnime,
  fetchUserCharacters,
  getPostDefaultImage,
  loginUser,
  publishAnime,
  publishCharacter,
  registerUser,
} from "../../lib/postApi";
import { clearPostSession, getPostSession, getPostUserId, setPostSession } from "../../lib/postAuth";
import MoeLabel from "../MoeLabel";
import { btnPrimaryClass, btnSecondaryClass, inputClass, panelClass, tabButtonClasses } from "../ui";
import PostCard from "./PostCard";
import PublishModal from "./PublishModal";

const PAGES = [
  { id: "profile", label: "我的主页" },
  { id: "anime", label: "番剧广场" },
  { id: "char", label: "角色广场" },
];

function filterItems(items, query) {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const title = (item.ani_name || item.char_name || "").toLowerCase();
    const meta = (item.ani_type || item.char_from || "").toLowerCase();
    const com = (item.ani_com || item.char_com || "").toLowerCase();
    return title.includes(q) || meta.includes(q) || com.includes(q);
  });
}

export default function UserPostClient() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState({ userId: "", userName: "", photo: "", intro: "" });
  const [page, setPage] = useState("profile");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [animeList, setAnimeList] = useState([]);
  const [charList, setCharList] = useState([]);
  const [profileItems, setProfileItems] = useState([]);
  const [search, setSearch] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState("anime");
  const [submitting, setSubmitting] = useState(false);

  const defaultAvatar = getPostDefaultImage();

  useEffect(() => {
    setSession(getPostSession());
    setReady(true);
  }, []);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  };

  const loadLists = useCallback(async (userId) => {
    setListLoading(true);
    setListError("");
    try {
      const [anime, chars] = await Promise.all([fetchAnimeList(), fetchCharacterList()]);
      setAnimeList(anime || []);
      setCharList(chars || []);
      if (userId) {
        const [mineAnime, mineChars] = await Promise.all([
          fetchUserAnime(userId),
          fetchUserCharacters(userId),
        ]);
        setProfileItems([...(mineAnime || []), ...(mineChars || [])]);
      }
    } catch (error) {
      setListError(error.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session.userId) {
      loadLists(session.userId);
    }
  }, [session.userId, loadLists]);

  const filteredAnime = useMemo(() => filterItems(animeList, search), [animeList, search]);
  const filteredChar = useMemo(() => filterItems(charList, search), [charList, search]);
  const filteredProfile = useMemo(() => filterItems(profileItems, search), [profileItems, search]);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const user = await loginUser(username.trim(), password);
      setPostSession(user);
      setSession(getPostSession());
      showToast("登录成功");
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const message = await registerUser(username.trim(), password);
      showToast(message || "注册成功，请登录");
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function openPublish(kind) {
    setModalKind(kind);
    setModalOpen(true);
  }

  async function handlePublish({ name, extra, comment }) {
    const userId = getPostUserId();
    if (!userId) {
      showToast("请先登录");
      return;
    }
    setSubmitting(true);
    try {
      if (modalKind === "anime") {
        await publishAnime({
          user_id: Number(userId),
          ani_name: name,
          ani_type: extra,
          ani_com: comment,
        });
        showToast("番剧发布成功");
        setPage("anime");
      } else {
        await publishCharacter({
          user_id: Number(userId),
          char_name: name,
          char_from: extra,
          char_com: comment,
        });
        showToast("角色发布成功");
        setPage("char");
      }
      setModalOpen(false);
      await loadLists(userId);
    } catch (error) {
      showToast(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    const userId = Number(getPostUserId());
    if (!userId || item.user_id !== userId) return;
    if (!window.confirm("确定删除这条发布吗？")) return;
    try {
      if (item.ani_id) {
        await deleteAnime(item.ani_id, userId);
      } else if (item.char_id) {
        await deleteCharacter(item.char_id, userId);
      }
      showToast("已删除");
      await loadLists(String(userId));
    } catch (error) {
      showToast(error.message);
    }
  }

  if (!ready) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500 md:px-8">加载中…</main>
    );
  }

  if (!session.userId) {
    return (
      <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center px-4 py-12 md:px-8">
        <div className={`${panelClass} w-full`}>
          <MoeLabel icon="community">Community</MoeLabel>
          <h1 className="sketch-heading mt-3 text-3xl md:text-4xl">社区发布</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            登录后可发布喜欢的番剧与角色卡片。需先启动 Python 用户服务（默认{" "}
            <code className="rounded bg-slate-100 px-1">127.0.0.1:5000</code>）。
          </p>
          <form className="mt-6 space-y-3" onSubmit={handleLogin}>
            <input
              className={inputClass}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="用户名"
              autoComplete="username"
            />
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="密码"
              autoComplete="current-password"
            />
            {authError ? <p className="text-sm text-red-600">{authError}</p> : null}
            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={authLoading} className={btnPrimaryClass}>
                {authLoading ? "处理中..." : "登录"}
              </button>
              <button type="button" disabled={authLoading} className={btnSecondaryClass} onClick={handleRegister}>
                注册账号
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  const currentUserId = Number(session.userId);
  const publishKind = page === "char" ? "character" : "anime";
  const listForPage =
    page === "profile" ? filteredProfile : page === "anime" ? filteredAnime : filteredChar;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 sketch-btn px-5 py-2 text-sm">
          {toast}
        </div>
      ) : null}

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <MoeLabel icon="community">Community</MoeLabel>
          <h1 className="sketch-heading mt-3 text-3xl md:text-4xl">社区发布</h1>
          <p className="mt-2 text-sm text-slate-600">
            欢迎你，<span className="font-medium text-ink">{session.userName}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimaryClass}
            onClick={() => openPublish(publishKind === "character" ? "character" : "anime")}
          >
            {page === "char" ? "发布角色" : "发布番剧"}
          </button>
          <button
            type="button"
            className={btnSecondaryClass}
            onClick={() => {
              clearPostSession();
              setSession(getPostSession());
              setAnimeList([]);
              setCharList([]);
              setProfileItems([]);
            }}
          >
            退出登录
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className={`${panelClass} !p-3`}>
          <nav className="flex flex-col gap-1">
            {PAGES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${tabButtonClasses(page === item.id)} w-full text-left`}
                onClick={() => {
                  setPage(item.id);
                  setSearch("");
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          {page === "profile" ? (
            <div className={`${panelClass} flex flex-wrap items-center gap-6`}>
              <img
                src={session.photo || defaultAvatar}
                alt=""
                className="h-24 w-24 rounded-full border-2 border-white object-cover shadow-sm"
                onError={(event) => {
                  event.currentTarget.src = defaultAvatar;
                }}
              />
              <div>
                <h2 className="text-2xl font-semibold text-ink">{session.userName}</h2>
                <p className="mt-1 text-sm text-slate-500">ID：{session.userId}</p>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
                  {session.intro || "还没有填写个人简介。"}
                </p>
              </div>
            </div>
          ) : null}

          <div className={panelClass}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-ink">
                {page === "profile" ? "我的发布" : page === "anime" ? "全部番剧" : "全部角色"}
              </h2>
              <input
                className={`${inputClass} max-w-xs`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索名称、类型或评价"
              />
            </div>

            {listError ? (
              <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {listError}
                <span className="mt-1 block text-xs text-amber-800">
                  请确认已运行 <code className="rounded bg-white/80 px-1">backend/user_post_backend</code> 的 Flask
                  服务，且 <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_POST_API_URL</code> 配置正确。
                </span>
              </p>
            ) : null}

            {listLoading ? (
              <p className="py-12 text-center text-sm text-slate-500">加载中…</p>
            ) : listForPage.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">
                {search ? "没有匹配的卡片" : "还没有内容，点击上方按钮发布第一条吧"}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listForPage.map((item) => (
                  <PostCard
                    key={`${item.ani_id || item.char_id}-${item.user_id}`}
                    item={item}
                    canDelete={item.user_id === currentUserId}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <PublishModal
        open={modalOpen}
        kind={modalKind}
        onClose={() => setModalOpen(false)}
        onSubmit={handlePublish}
        submitting={submitting}
      />
    </main>
  );
}

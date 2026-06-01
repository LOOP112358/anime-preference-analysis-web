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

const API_URL = "http://127.0.0.1:5001";

const PAGES = [
  { id: "profile", label: "我的主页" },
  { id: "anime", label: "番剧广场" },
  { id: "char", label: "角色广场" },
  { id: "favAnime", label: "我收藏的番" },
  { id: "favChar", label: "我收藏的角色" },
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
  const [favAnime, setFavAnime] = useState([]);
  const [favChar, setFavChar] = useState([]);

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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadLists = useCallback(async (userId) => {
    if (!userId) return;
    setListLoading(true);
    try {
      const [a, c, ma, mc] = await Promise.all([
        fetchAnimeList(),
        fetchCharacterList(),
        fetchUserAnime(userId),
        fetchUserCharacters(userId),
      ]);
      setAnimeList(a || []);
      setCharList(c || []);
      setProfileItems([...(ma || []), ...(mc || [])]);
    } catch (e) {
      setListError(e.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session.userId) loadLists(session.userId);
  }, [session.userId, loadLists]);

  const handleFavorite = async (item) => {
    const uid = getPostUserId();
    if (!uid) return showToast("请先登录");
    const isAnime = !!item.ani_id;
    const id = isAnime ? item.ani_id : item.char_id;
    try {
      const res = await fetch(`${API_URL}/api/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(uid),
          type: isAnime ? "anime" : "char",
          target_id: id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (isAnime) setFavAnime([...favAnime, item]);
        else setFavChar([...favChar, item]);
        showToast("已收藏");
      }
    } catch (e) {
      showToast("收藏失败");
    }
  };

  const filteredAnime = useMemo(() => filterItems(animeList, search), [animeList, search]);
  const filteredChar = useMemo(() => filterItems(charList, search), [charList, search]);
  const filteredProfile = useMemo(() => filterItems(profileItems, search), [profileItems, search]);
  const filteredFavAni = useMemo(() => filterItems(favAnime, search), [favAnime, search]);
  const filteredFavChar = useMemo(() => filterItems(favChar, search), [favChar, search]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const user = await loginUser(username.trim(), password);
      setPostSession(user);
      setSession(getPostSession());
      showToast("登录成功");
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      await registerUser(username.trim(), password);
      showToast("注册成功");
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function openPublish(kind) {
    setModalKind(kind);
    setModalOpen(true);
  }

  async function handlePublish({ name, extra, comment, image }) {
    const uid = getPostUserId();
    if (!uid) return showToast("请先登录");
    setSubmitting(true);
    try {
      if (modalKind === "anime") {
        await publishAnime({ user_id: Number(uid), ani_name: name, ani_type: extra, ani_com: comment, ani_img: image });
        showToast("番剧发布成功");
      } else {
        await publishCharacter({ user_id: Number(uid), char_name: name, char_from: extra, char_com: comment, char_img: image });
        showToast("角色发布成功");
      }
      setModalOpen(false);
      await loadLists(uid);
    } catch (e) {
      showToast(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    const uid = Number(getPostUserId());
    if (!uid || item.user_id !== uid) return;
    if (!confirm("确定删除？")) return;
    try {
      if (item.ani_id) await deleteAnime(item.ani_id, uid);
      else await deleteCharacter(item.char_id, uid);
      showToast("已删除");
      await loadLists(String(uid));
    } catch (e) {
      showToast(e.message);
    }
  }

  if (!ready) return <main className="py-16 text-center">加载中…</main>;

  if (!session.userId) {
    return (
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className={panelClass}>
          <MoeLabel>社区</MoeLabel>
          <h1 className="sketch-heading text-3xl mt-3">用户登录</h1>
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" />
            <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" />
            {authError && <p className="text-red-600 text-sm">{authError}</p>}
            <div className="flex gap-3">
              <button className={btnPrimaryClass} disabled={authLoading}>登录</button>
              <button className={btnSecondaryClass} type="button" onClick={handleRegister} disabled={authLoading}>注册</button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  const uid = Number(session.userId);
  const publishKind = page === "char" ? "character" : "anime";

  let list = [];
  let title = "";
  if (page === "profile") { list = filteredProfile; title = "我的发布"; }
  else if (page === "anime") { list = filteredAnime; title = "全部番剧"; }
  else if (page === "char") { list = filteredChar; title = "全部角色"; }
  else if (page === "favAnime") { list = filteredFavAni; title = "我收藏的番"; }
  else if (page === "favChar") { list = filteredFavChar; title = "我收藏的角色"; }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 md:px-8">
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sketch-btn px-4 py-2 text-sm">{toast}</div>}
      <section className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <MoeLabel>社区</MoeLabel>
          <h1 className="sketch-heading text-3xl mt-2">发布中心</h1>
          <p className="text-sm mt-1">欢迎，{session.userName}</p>
        </div>
        <div className="flex gap-2">
          <button className={btnPrimaryClass} onClick={() => openPublish(publishKind)}>发布{publishKind === "anime" ? "番剧" : "角色"}</button>
          <button className={btnSecondaryClass} onClick={() => { clearPostSession(); setSession({}); }}>退出登录</button>
        </div>
      </section>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className={panelClass}>
          <nav className="flex flex-col gap-1">
            {PAGES.map(p => (
              <button key={p.id} className={tabButtonClasses(page === p.id)} onClick={() => { setPage(p.id); setSearch(""); }}>
                {p.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          {page === "profile" && (
            <div className={panelClass}>
              <img src={session.photo || defaultAvatar} alt="" className="w-24 h-24 rounded-full" />
              <div className="mt-3">
                <h2 className="text-xl font-semibold">{session.userName}</h2>
                <p className="text-sm text-slate-500">ID：{session.userId}</p>
                <p className="text-sm mt-2">{session.intro || "暂无简介"}</p>
                <button className="btn-secondary text-xs mt-2">修改资料</button>
              </div>
            </div>
          )}

          <div className={panelClass}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{title}</h2>
              <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索" />
            </div>

            {listLoading ? <p className="py-8 text-center">加载中…</p> :
              list.length === 0 ? <p className="py-8 text-center">暂无内容</p> :
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {list.map(item => (
                    <PostCard
                      key={item.ani_id || item.char_id}
                      item={item}
                      canDelete={item.user_id === uid}
                      onDelete={() => handleDelete(item)}
                      onFavorite={handleFavorite}
                      isFav={
                        item.ani_id ? favAnime.some(x => x.ani_id === item.ani_id)
                          : favChar.some(x => x.char_id === item.char_id)
                      }
                    />
                  ))}
                </div>
            }
          </div>
        </div>
      </div>

      <PublishModal open={modalOpen} kind={modalKind} onClose={() => setModalOpen(false)} onSubmit={handlePublish} submitting={submitting} />
    </main>
  );
}
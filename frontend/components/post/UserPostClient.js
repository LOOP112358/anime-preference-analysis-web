"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addFavoriteAnime,
  addFavoriteCharacter,
  deleteAnime,
  deleteCharacter,
  fetchAnimeList,
  fetchCharacterList,
  fetchFavoriteAnime,
  fetchFavoriteCharacters,
  fetchUserAnime,
  fetchUserCharacters,
  fetchUserProfile,
  getPostDefaultAvatar,
  loginUser,
  publishAnime,
  publishCharacter,
  registerUser,
  removeFavoriteAnime,
  removeFavoriteCharacter,
  resolvePostImageUrl,
  updateAnime,
  updateCharacter,
  updateUserProfile,
  uploadPostImage,
} from "../../lib/postApi";
import { clearPostSession, getPostSession, getPostUserId, setPostSession } from "../../lib/postAuth";
import MoeLabel from "../MoeLabel";
import { btnPrimaryClass, btnSecondaryClass, inputClass, panelClass, tabButtonClasses } from "../ui";
import AvatarUploadModal from "./AvatarUploadModal";
import PostCard from "./PostCard";
import ProfileEditModal, { displayIntro } from "./ProfileEditModal";
import PublishModal from "./PublishModal";

const AVATAR_ACCEPT = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

const PAGES = [
  { id: "profile", label: "我的主页" },
  { id: "anime", label: "番剧广场" },
  { id: "char", label: "角色广场" },
  { id: "favorites", label: "我的收藏" },
];

const SEARCH_PLACEHOLDERS = {
  profile: "搜索作品名或类型",
  anime: "搜索番剧 / 类型 / 发布者昵称",
  char: "搜索角色 / 出处 / 发布者昵称",
  favorites: "搜索收藏 / 发布者昵称",
};

const FAV_SCOPES = [
  { id: "all", label: "全部" },
  { id: "anime", label: "番剧" },
  { id: "char", label: "角色" },
];

function filterItems(items, query) {
  const raw = query.trim();
  if (!raw) return items;

  const q = raw.toLowerCase();
  const authorOnly = q.startsWith("@");
  const authorQ = authorOnly ? q.slice(1) : q;

  return items.filter((item) => {
    const author = (item.user_name || "").toLowerCase();
    if (authorOnly) return author.includes(authorQ);

    const title = (item.ani_name || item.char_name || "").toLowerCase();
    const meta = (item.ani_type || item.char_from || "").toLowerCase();
    const com = (item.ani_com || item.char_com || "").toLowerCase();
    return title.includes(q) || meta.includes(q) || com.includes(q) || author.includes(q);
  });
}

export default function UserPostClient() {
  const avatarInputRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState({ userId: "", userName: "", photo: "", intro: "" });
  const [page, setPage] = useState("profile");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [toast, setToast] = useState("");

  const [animeList, setAnimeList] = useState([]);
  const [charList, setCharList] = useState([]);
  const [profileItems, setProfileItems] = useState([]);
  const [favAnime, setFavAnime] = useState([]);
  const [favChar, setFavChar] = useState([]);
  const [favAnimeIds, setFavAnimeIds] = useState(() => new Set());
  const [favCharIds, setFavCharIds] = useState(() => new Set());

  const [search, setSearch] = useState("");
  const [favScope, setFavScope] = useState("all");
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState("anime");
  const [editingItem, setEditingItem] = useState(null);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState("");
  const [avatarUploadOpen, setAvatarUploadOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const defaultAvatar = getPostDefaultAvatar();

  const syncSessionFromUser = useCallback((user) => {
    if (!user?.user_id) return;
    setPostSession(user);
    setSession(getPostSession());
  }, []);

  useEffect(() => {
    setSession(getPostSession());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!session.userId) return;
    fetchUserProfile(session.userId)
      .then((user) => syncSessionFromUser(user))
      .catch(() => {});
  }, [session.userId, syncSessionFromUser]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  function closeAvatarUpload() {
    setAvatarUploadOpen(false);
    setAvatarCropSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return "";
    });
  }

  function handleAvatarFilePick(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!AVATAR_ACCEPT.includes(file.type)) {
      showToast("仅支持 png、jpg、jpeg、gif、webp 格式");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("图片大小不能超过 10MB");
      return;
    }

    setAvatarCropSrc((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setAvatarUploadOpen(true);
  }

  async function handleAvatarCropConfirm(blob, errorMessage) {
    const uid = Number(session.userId);
    if (!uid) return;

    if (!blob) {
      showToast(errorMessage || "头像裁剪失败");
      return;
    }

    setAvatarUploading(true);
    try {
      const photo = await uploadPostImage(blob, "avatar.jpg");
      const user = await updateUserProfile({ user_id: uid, photo });
      syncSessionFromUser(user);
      showToast("头像已更新");
      closeAvatarUpload();
    } catch (e) {
      showToast(e.message || "头像上传失败");
    } finally {
      setAvatarUploading(false);
    }
  }

  const loadLists = useCallback(async (userId) => {
    if (!userId) return;
    setListLoading(true);
    setListError("");
    try {
      const [a, c, ma, mc, fa, fc] = await Promise.all([
        fetchAnimeList(),
        fetchCharacterList(),
        fetchUserAnime(userId),
        fetchUserCharacters(userId),
        fetchFavoriteAnime(userId),
        fetchFavoriteCharacters(userId),
      ]);
      setAnimeList(a || []);
      setCharList(c || []);
      setProfileItems([...(ma || []), ...(mc || [])]);
      setFavAnime(fa || []);
      setFavChar(fc || []);
      setFavAnimeIds(new Set((fa || []).map((x) => x.ani_id)));
      setFavCharIds(new Set((fc || []).map((x) => x.char_id)));
    } catch (e) {
      setListError(e.message);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session.userId) loadLists(session.userId);
  }, [session.userId, loadLists]);

  const isFavorited = useCallback(
    (item) => (item.ani_id ? favAnimeIds.has(item.ani_id) : favCharIds.has(item.char_id)),
    [favAnimeIds, favCharIds],
  );

  const handleFavorite = async (item) => {
    const uid = Number(getPostUserId());
    if (!uid) return showToast("请先登录");

    const isAnime = Boolean(item.ani_id);
    const id = isAnime ? item.ani_id : item.char_id;
    const alreadyFav = isFavorited(item);

    try {
      if (isAnime) {
        if (alreadyFav) {
          await removeFavoriteAnime(uid, id);
          setFavAnimeIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setFavAnime((prev) => prev.filter((x) => x.ani_id !== id));
          showToast("已取消收藏");
        } else {
          await addFavoriteAnime(uid, id);
          setFavAnimeIds((prev) => new Set(prev).add(id));
          setFavAnime((prev) => [...prev, item]);
          showToast("已收藏");
        }
      } else if (alreadyFav) {
        await removeFavoriteCharacter(uid, id);
        setFavCharIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setFavChar((prev) => prev.filter((x) => x.char_id !== id));
        showToast("已取消收藏");
      } else {
        await addFavoriteCharacter(uid, id);
        setFavCharIds((prev) => new Set(prev).add(id));
        setFavChar((prev) => [...prev, item]);
        showToast("已收藏");
      }
    } catch (e) {
      showToast(e.message || "收藏失败");
    }
  };

  const filteredAnime = useMemo(() => filterItems(animeList, search), [animeList, search]);
  const filteredChar = useMemo(() => filterItems(charList, search), [charList, search]);
  const filteredProfile = useMemo(() => filterItems(profileItems, search), [profileItems, search]);
  const filteredFavorites = useMemo(() => {
    let items = [...favAnime, ...favChar];
    if (favScope === "anime") items = favAnime;
    else if (favScope === "char") items = favChar;
    return filterItems(items, search);
  }, [favAnime, favChar, favScope, search]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");
    try {
      const user = await loginUser(username.trim(), password);
      syncSessionFromUser(user);
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
    setAuthSuccess("");
    try {
      await registerUser(username.trim(), password);
      setAuthMode("login");
      setAuthSuccess("注册成功！请使用刚才的用户名和密码登录。");
    } catch (e) {
      setAuthError(e.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function switchAuthMode(mode) {
    setAuthMode(mode);
    setAuthError("");
    setAuthSuccess("");
  }

  function openPublish(kind) {
    setEditingItem(null);
    setModalKind(kind);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingItem(item);
    setModalKind(item.ani_id ? "anime" : "character");
    setModalOpen(true);
  }

  function closePublishModal() {
    setModalOpen(false);
    setEditingItem(null);
  }

  async function handlePublishSubmit({ name, extra, comment, image, resetImage }) {
    const uid = getPostUserId();
    if (!uid) return showToast("请先登录");
    setSubmitting(true);
    try {
      if (editingItem) {
        if (editingItem.ani_id) {
          await updateAnime({
            ani_id: editingItem.ani_id,
            user_id: Number(uid),
            ani_name: name,
            ani_type: extra,
            ani_com: comment,
            ani_img: image,
            reset_img: resetImage,
          });
          showToast("番剧已更新");
        } else {
          await updateCharacter({
            char_id: editingItem.char_id,
            user_id: Number(uid),
            char_name: name,
            char_from: extra,
            char_com: comment,
            char_img: image,
            reset_img: resetImage,
          });
          showToast("角色已更新");
        }
      } else if (modalKind === "anime") {
        await publishAnime({ user_id: Number(uid), ani_name: name, ani_type: extra, ani_com: comment, ani_img: image });
        showToast("番剧发布成功");
      } else {
        await publishCharacter({ user_id: Number(uid), char_name: name, char_from: extra, char_com: comment, char_img: image });
        showToast("角色发布成功");
      }
      closePublishModal();
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
    const isRegister = authMode === "register";

    return (
      <main className="max-w-lg mx-auto px-4 py-12">
        <div className={panelClass}>
          <MoeLabel>社区</MoeLabel>
          <h1 className="sketch-heading text-3xl mt-3">登录 / 注册</h1>
          <p className="mt-2 text-sm text-slate-600">
            首次使用请先注册账号，注册成功后再登录即可发布与收藏。
          </p>

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              className={`${tabButtonClasses(authMode === "login")} flex-1`}
              onClick={() => switchAuthMode("login")}
            >
              已有账号，登录
            </button>
            <button
              type="button"
              className={`${tabButtonClasses(authMode === "register")} flex-1`}
              onClick={() => switchAuthMode("register")}
            >
              新用户，注册
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50/80 px-3 py-2.5 text-sm text-slate-600">
            {isRegister
              ? "① 填写用户名和密码 → ② 点击「注册新账号」→ ③ 注册成功后切回登录"
              : "还没有账号？请点击上方「新用户，注册」创建账号后再登录。"}
          </div>

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="mt-5 space-y-3">
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              autoComplete="username"
              required
            />
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
            {authSuccess && <p className="text-sm text-emerald-700">{authSuccess}</p>}
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button className={`${btnPrimaryClass} w-full`} disabled={authLoading}>
              {authLoading ? "处理中…" : isRegister ? "注册新账号" : "登录"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            {isRegister ? (
              <>
                已有账号？
                <button type="button" className="ml-1 underline" onClick={() => switchAuthMode("login")}>
                  去登录
                </button>
              </>
            ) : (
              <>
                第一次来？
                <button type="button" className="ml-1 underline" onClick={() => switchAuthMode("register")}>
                  先注册
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    );
  }

  const uid = Number(session.userId);
  const publishKind = page === "char" ? "character" : "anime";

  let list = [];
  let title = "";
  if (page === "profile") {
    list = filteredProfile;
    title = "我的发布";
  } else if (page === "anime") {
    list = filteredAnime;
    title = "全部番剧";
  } else if (page === "char") {
    list = filteredChar;
    title = "全部角色";
  } else if (page === "favorites") {
    list = filteredFavorites;
    title = "我的收藏";
  }

  const showFavoriteAction = page === "anime" || page === "char" || page === "favorites";

  function renderCardGrid(items) {
    if (listLoading) {
      return (
        <div className="col-span-full flex min-h-[18rem] w-full items-center justify-center sm:min-h-[22rem]">
          <p className="text-slate-500">加载中…</p>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="col-span-full flex min-h-[18rem] w-full items-center justify-center sm:min-h-[22rem]">
          <p className="text-slate-500">暂无内容</p>
        </div>
      );
    }
    return items.map((item) => (
      <PostCard
        key={`${item.ani_id ? "a" : "c"}-${item.ani_id || item.char_id}`}
        item={item}
        canDelete={item.user_id === uid}
        canEdit={item.user_id === uid}
        onEdit={openEdit}
        onDelete={() => handleDelete(item)}
        onFavorite={showFavoriteAction ? handleFavorite : undefined}
        isFav={isFavorited(item)}
      />
    ));
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 sketch-btn px-4 py-2 text-sm z-50">{toast}</div>}
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

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-stretch">
        <aside className={`${panelClass} w-full shrink-0 lg:w-[220px]`}>
          <nav className="flex flex-col gap-1">
            {PAGES.map((p) => (
              <button
                key={p.id}
                className={tabButtonClasses(page === p.id)}
                onClick={() => {
                  setPage(p.id);
                  setSearch("");
                  if (p.id === "favorites") setFavScope("all");
                }}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 w-full flex-1 flex-col gap-6">
          {page === "profile" && (
            <div className={`${panelClass} w-full`}>
              <input
                ref={avatarInputRef}
                type="file"
                accept={AVATAR_ACCEPT.join(",")}
                className="hidden"
                onChange={handleAvatarFilePick}
              />
              <button
                type="button"
                className="group relative h-24 w-24 shrink-0 rounded-full"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="更换头像"
              >
                <img
                  src={session.photo ? resolvePostImageUrl(session.photo) : defaultAvatar}
                  alt=""
                  className="h-24 w-24 rounded-full border border-stone-300 object-cover bg-stone-100"
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatar;
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-stone-900/0 text-xs font-medium text-white opacity-0 transition group-hover:bg-stone-900/45 group-hover:opacity-100">
                  换头像
                </span>
              </button>
              <p className="mt-1 text-xs text-slate-400">点击头像可更换</p>
              <div className="mt-2">
                <h2 className="text-xl font-semibold">{session.userName}</h2>
                <p className="text-sm text-slate-500">ID：{session.userId}</p>
                <p className="mt-2 text-sm whitespace-pre-wrap">{displayIntro(session.intro)}</p>
                <button
                  type="button"
                  className="btn-secondary mt-2 text-xs"
                  onClick={() => setProfileEditOpen(true)}
                >
                  修改简介
                </button>
              </div>
            </div>
          )}

          <div className={`${panelClass} flex min-h-[26rem] w-full flex-1 flex-col`}>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">{title}</h2>
              <input
                className={`${inputClass} w-full max-w-sm sm:w-auto sm:min-w-[220px]`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={SEARCH_PLACEHOLDERS[page] || "搜索"}
              />
            </div>

            {page === "favorites" && (
              <div className="flex flex-wrap gap-2 mb-4">
                {FAV_SCOPES.map((scope) => (
                  <button
                    key={scope.id}
                    type="button"
                    className={tabButtonClasses(favScope === scope.id)}
                    onClick={() => setFavScope(scope.id)}
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            )}

            {(page === "anime" || page === "char") && (
              <p className="text-xs text-slate-500 mb-4">支持按发布者昵称搜索，输入 @昵称 可仅筛选该用户</p>
            )}

            {listError && <p className="text-red-600 text-sm mb-4">{listError}</p>}

            <div className="grid w-full flex-1 grid-cols-1 content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {renderCardGrid(list)}
            </div>
          </div>
        </div>
      </div>

      <PublishModal
        open={modalOpen}
        kind={modalKind}
        editItem={editingItem}
        onClose={closePublishModal}
        onSubmit={handlePublishSubmit}
        submitting={submitting}
      />
      <ProfileEditModal
        open={profileEditOpen}
        userId={session.userId}
        userName={session.userName}
        intro={session.intro}
        onClose={() => setProfileEditOpen(false)}
        onSaved={(user) => {
          syncSessionFromUser(user);
          showToast("简介已更新");
        }}
      />
      <AvatarUploadModal
        open={avatarUploadOpen}
        src={avatarCropSrc}
        uploading={avatarUploading}
        onConfirm={handleAvatarCropConfirm}
        onClose={closeAvatarUpload}
      />
    </main>
  );
}

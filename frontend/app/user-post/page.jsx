"use client";

import { useState, useEffect, useCallback } from "react";

const API = "http://127.0.0.1:5000";

function post(url, body) {
  return fetch(API + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());
}

function get(url) {
  return fetch(API + url).then((r) => r.json());
}

// ─── 样式常量 ────────────────────────────────────────────────

const cardStyle = {
  background: "rgba(255,255,255,0.82)", backdropFilter: "blur(16px)",
  borderRadius: 20, border: "1px solid rgba(93,202,165,0.18)",
  padding: "1.5rem", boxShadow: "0 4px 24px rgba(93,202,165,0.07)",
};

const inputStyle = {
  width: "100%", padding: "10px 14px", marginBottom: 10,
  border: "1px solid rgba(93,202,165,0.3)", borderRadius: 12,
  background: "rgba(255,255,255,0.8)", color: "#1e293b",
  fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border-color 0.2s",
};

const btnPrimary = {
  padding: "10px 22px", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg, #5DCAA5, #4ab8d6)",
  color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit", boxShadow: "0 4px 12px rgba(93,202,165,0.3)",
  transition: "all 0.2s",
};

const btnSecondary = {
  padding: "8px 16px", borderRadius: 12,
  border: "1px solid rgba(93,202,165,0.4)",
  background: "rgba(93,202,165,0.1)", color: "#0f6e56",
  fontSize: 13, fontWeight: 700, cursor: "pointer",
  fontFamily: "inherit", transition: "all 0.2s",
};

const btnDanger = {
  padding: "5px 12px", borderRadius: 8,
  border: "1px solid rgba(239,68,68,0.3)",
  background: "rgba(239,68,68,0.08)", color: "#dc2626",
  fontSize: 11, cursor: "pointer", fontFamily: "inherit",
};

// ─── 子组件 ────────────────────────────────────────────────

function SectionTitle({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px" }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(93,202,165,0.3), transparent)" }} />
    </div>
  );
}

function AnimeCard({ item, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.78)", borderRadius: 16,
        border: hovered ? "1px solid rgba(93,202,165,0.4)" : "1px solid rgba(93,202,165,0.12)",
        overflow: "hidden", transition: "all 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 8px 20px rgba(93,202,165,0.12)" : "none",
      }}
    >
      <img
        src={item.ani_img || "/static/default.jpg"}
        alt={item.ani_name}
        onError={e => { e.target.src = "/static/default.jpg"; }}
        style={{ width: "100%", height: 140, objectFit: "cover" }}
      />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>{item.ani_name}</div>
        {item.ani_type && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
            {item.ani_type.split(",").slice(0, 3).map(t => (
              <span key={t} style={{
                fontSize: 10, padding: "1px 7px", borderRadius: 10,
                background: "rgba(93,202,165,0.12)", color: "#0f6e56",
                border: "1px solid rgba(93,202,165,0.25)",
              }}>{t.trim()}</span>
            ))}
          </div>
        )}
        {item.ani_com && <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 8 }}>{item.ani_com}</div>}
        {item.user_name && <div style={{ fontSize: 11, color: "#94a3b8" }}>by {item.user_name}</div>}
        {onDelete && (
          <button style={{ ...btnDanger, marginTop: 8 }} onClick={() => onDelete(item.ani_id)}>删除</button>
        )}
      </div>
    </div>
  );
}

function CharCard({ item, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(255,255,255,0.78)", borderRadius: 16,
        border: hovered ? "1px solid rgba(212,83,126,0.4)" : "1px solid rgba(212,83,126,0.12)",
        overflow: "hidden", transition: "all 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        boxShadow: hovered ? "0 8px 20px rgba(212,83,126,0.1)" : "none",
      }}
    >
      <img
        src={item.char_img || "/static/default.jpg"}
        alt={item.char_name}
        onError={e => { e.target.src = "/static/default.jpg"; }}
        style={{ width: "100%", height: 140, objectFit: "cover" }}
      />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{item.char_name}</div>
        {item.char_from && <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>出自：{item.char_from}</div>}
        {item.char_com && <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 8 }}>{item.char_com}</div>}
        {item.user_name && <div style={{ fontSize: 11, color: "#94a3b8" }}>by {item.user_name}</div>}
        {onDelete && (
          <button style={{ ...btnDanger, marginTop: 8 }} onClick={() => onDelete(item.char_id)}>删除</button>
        )}
      </div>
    </div>
  );
}

function CardGrid({ children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "2rem 0", color: "#cbd5e1", fontSize: 13 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>{text}
    </div>
  );
}

// ─── 发布弹窗 ────────────────────────────────────────────────

function PublishModal({ type, userId, onClose, onSuccess }) {
  const isAnime = type === "anime";
  const [name, setName] = useState("");
  const [extra, setExtra] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { alert(`请输入${isAnime ? "番剧" : "角色"}名称`); return; }
    setLoading(true);
    try {
      const url = isAnime ? "/anime/add" : "/character/add";
      const body = isAnime
        ? { user_id: userId, ani_name: name, ani_type: extra, ani_com: comment }
        : { user_id: userId, char_name: name, char_from: extra, char_com: comment };
      const res = await post(url, body);
      if (res.success) { onSuccess(); onClose(); }
      else alert(res.message || "发布失败");
    } catch { alert("无法连接到 Flask 服务器"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div style={{ ...cardStyle, width: 420, position: "relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: "absolute", top: 14, right: 16,
          background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8",
        }}>×</button>
        <SectionTitle icon={isAnime ? "🎬" : "🎭"} text={isAnime ? "发布番剧" : "发布角色"} />
        <input style={inputStyle} placeholder={isAnime ? "番剧名称（如：进击的巨人）" : "角色名称（如：后藤一里）"}
          value={name} onChange={e => setName(e.target.value)} />
        <input style={inputStyle} placeholder={isAnime ? "类型（可选，如：热血,战斗）" : "出处番剧（可选）"}
          value={extra} onChange={e => setExtra(e.target.value)} />
        <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical", marginBottom: 14 }}
          placeholder="写下你的评价（可选）" value={comment} onChange={e => setComment(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnPrimary} onClick={handleSubmit} disabled={loading}>
            {loading ? "发布中…" : "🌸 发布"}
          </button>
          <button style={btnSecondary} onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
}

// ─── 登录/注册页 ────────────────────────────────────────────

function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) { setError("用户名和密码不能为空"); return; }
    setLoading(true); setError("");
    try {
      const res = await post(isLogin ? "/login" : "/register", { user_name: username, password });
      if (res.success) {
        if (isLogin) onLogin(res.data);
        else { setIsLogin(true); alert("注册成功，请登录"); }
      } else {
        setError(res.message || "操作失败");
      }
    } catch {
      setError("无法连接到服务器，请确认 Flask 后端已启动（python app.py）");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
      <div style={{ ...cardStyle, width: 360 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🌸</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            {isLogin ? "欢迎回来" : "加入社区"}
          </h2>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
            {isLogin ? "登录后开始分享你的番剧" : "注册账号，记录你的番剧偏好"}
          </p>
        </div>
        <input style={inputStyle} type="text" placeholder="👤 用户名"
          value={username} onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        <input style={inputStyle} type="password" placeholder="🔒 密码"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        {error && (
          <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 10, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
            ⚠️ {error}
          </div>
        )}
        <button style={{ ...btnPrimary, width: "100%", marginBottom: 10 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "请稍候…" : (isLogin ? "✨ 登录" : "🌸 注册")}
        </button>
        <button style={{ width: "100%", padding: "9px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)", background: "transparent", fontSize: 13, color: "#64748b", cursor: "pointer", fontFamily: "inherit" }}
          onClick={() => { setIsLogin(!isLogin); setError(""); }}>
          {isLogin ? "没有账号？去注册" : "已有账号？去登录"}
        </button>
      </div>
    </div>
  );
}

// ─── 主页面 ────────────────────────────────────────────────

export default function UserPostPage() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("anime");
  const [animeList, setAnimeList] = useState([]);
  const [charList, setCharList] = useState([]);
  const [userAnime, setUserAnime] = useState([]);
  const [userChar, setUserChar] = useState([]);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("acg_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (data) => {
    setUser(data);
    sessionStorage.setItem("acg_user", JSON.stringify(data));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("acg_user");
  };

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [a, c, ua, uc] = await Promise.all([
        get("/anime/list"),
        get("/character/list"),
        get(`/user/${user.user_id}/anime`),
        get(`/user/${user.user_id}/character`),
      ]);
      if (a.success) setAnimeList(a.data || []);
      if (c.success) setCharList(c.data || []);
      if (ua.success) setUserAnime(ua.data || []);
      if (uc.success) setUserChar(uc.data || []);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const deleteAnime = async (ani_id) => {
    if (!confirm("确认删除？")) return;
    const res = await post("/anime/delete", { ani_id, user_id: user.user_id });
    if (res.success) loadAll(); else alert(res.message);
  };

  const deleteChar = async (char_id) => {
    if (!confirm("确认删除？")) return;
    const res = await post("/character/delete", { char_id, user_id: user.user_id });
    if (res.success) loadAll(); else alert(res.message);
  };

  const TABS = [
    { key: "anime",   icon: "🎬", label: "所有番剧" },
    { key: "char",    icon: "🎭", label: "所有角色" },
    { key: "profile", icon: "👤", label: "我的主页" },
  ];

  if (!user) {
    return (
      <PageShell>
        <AuthPage onLogin={handleLogin} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* 顶栏 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={user.photo || "/static/default.jpg"}
            onError={e => { e.target.src = "/static/default.jpg"; }}
            alt="头像"
            style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(93,202,165,0.4)" }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{user.user_name}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>ID: {user.user_id}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnSecondary} onClick={() => setModal("anime")}>🎬 发布番剧</button>
          <button style={btnSecondary} onClick={() => setModal("char")}>🎭 发布角色</button>
          <button style={{ ...btnSecondary, borderColor: "rgba(239,68,68,0.3)", color: "#dc2626", background: "rgba(239,68,68,0.06)" }}
            onClick={handleLogout}>退出</button>
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 16px", borderRadius: 20, fontSize: 13,
            fontFamily: "inherit", cursor: "pointer", transition: "all 0.18s",
            border: tab === t.key ? "1.5px solid #5DCAA5" : "1px solid rgba(93,202,165,0.25)",
            background: tab === t.key ? "rgba(93,202,165,0.15)" : "rgba(255,255,255,0.5)",
            color: tab === t.key ? "#0f6e56" : "#64748b",
            fontWeight: tab === t.key ? 700 : 400,
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", fontSize: 13 }}>加载中…</div>}

      {/* 所有番剧 */}
      {!loading && tab === "anime" && (
        <>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: "1rem" }}>共 {animeList.length} 部番剧</div>
          {animeList.length === 0 ? <Empty text="还没有人发布番剧，快来第一个！" /> : <CardGrid>{animeList.map(i => <AnimeCard key={i.ani_id} item={i} />)}</CardGrid>}
        </>
      )}

      {/* 所有角色 */}
      {!loading && tab === "char" && (
        <>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: "1rem" }}>共 {charList.length} 个角色</div>
          {charList.length === 0 ? <Empty text="还没有人发布角色，快来第一个！" /> : <CardGrid>{charList.map(i => <CharCard key={i.char_id} item={i} />)}</CardGrid>}
        </>
      )}

      {/* 我的主页 */}
      {tab === "profile" && (
        <div>
          <div style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 20, marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <img
              src={user.photo || "/static/default.jpg"}
              onError={e => { e.target.src = "/static/default.jpg"; }}
              alt="头像"
              style={{ width: 70, height: 70, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(93,202,165,0.4)", flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{user.user_name}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{user.user_intro || "这个人还没有写简介"}</div>
              <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                <span style={{ fontSize: 12, color: "#5DCAA5", fontWeight: 700 }}>🎬 {userAnime.length} 部番剧</span>
                <span style={{ fontSize: 12, color: "#D4537E", fontWeight: 700 }}>🎭 {userChar.length} 个角色</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <SectionTitle icon="🎬" text="我发布的番剧" />
            {userAnime.length === 0 ? <Empty text="还没有发布番剧" /> : <CardGrid>{userAnime.map(i => <AnimeCard key={i.ani_id} item={i} onDelete={deleteAnime} />)}</CardGrid>}
          </div>

          <div>
            <SectionTitle icon="🎭" text="我发布的角色" />
            {userChar.length === 0 ? <Empty text="还没有发布角色" /> : <CardGrid>{userChar.map(i => <CharCard key={i.char_id} item={i} onDelete={deleteChar} />)}</CardGrid>}
          </div>
        </div>
      )}

      {modal && (
        <PublishModal type={modal} userId={user.user_id} onClose={() => setModal(null)} onSuccess={loadAll} />
      )}
    </PageShell>
  );
}

function PageShell({ children }) {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50%       { transform: translateY(-7px) rotate(5deg); }
        }
      `}</style>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 32, display: "inline-block", animation: "float 3s ease-in-out infinite", marginBottom: 8 }}>🌸</div>
          <h1 style={{
            fontSize: 24, fontWeight: 700, margin: 0,
            background: "linear-gradient(135deg, #0f6e56, #5DCAA5, #D4537E)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>番剧分享社区</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 5 }}>分享你喜欢的番剧与角色 ✨</p>
        </div>
        {children}
      </main>
    </>
  );
}

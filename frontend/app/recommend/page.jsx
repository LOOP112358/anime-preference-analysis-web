"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

const DIM_LABELS = {
  healing: "治愈",
  dark: "黑暗",
  passion: "热血",
  fantasy: "幻想",
  realism: "现实",
  projection: "投射",
  escape: "逃避",
  stimulation: "刺激",
  analytical: "理性",
  emotional: "情感",
  relationship_focus: "关系",
  individual_focus: "个体",
  plot_complex: "剧情复杂",
  daily: "日常",
};

const DIM_COLORS = {
  healing: "#5DCAA5",
  dark: "#7F77DD",
  passion: "#D85A30",
  fantasy: "#378ADD",
  realism: "#888780",
  projection: "#D4537E",
  escape: "#1D9E75",
  stimulation: "#EF9F27",
  analytical: "#534AB7",
  emotional: "#993556",
  relationship_focus: "#0F6E56",
  individual_focus: "#185FA5",
  plot_complex: "#BA7517",
  daily: "#639922",
};

// 浮动樱花粒子
function Sakura() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const petals = Array.from({ length: 18 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 6 + 3,
      speed: Math.random() * 0.5 + 0.2,
      drift: Math.random() * 0.6 - 0.3,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      opacity: Math.random() * 0.35 + 0.08,
    }));
    let raf;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = "#f9a8c9";
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * p.r;
          const y = Math.sin(angle) * p.r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        p.y += p.speed;
        p.x += p.drift;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", top: 0, left: 0,
      width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

function AnimeTag({ title, onRemove }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 12, padding: "4px 12px", borderRadius: 20,
      background: "rgba(93,202,165,0.15)", color: "#0f6e56",
      border: "1px solid rgba(93,202,165,0.5)",
      fontFamily: "inherit", transition: "all 0.2s",
    }}>
      ✦ {title}
      <button onClick={onRemove} aria-label={`删除 ${title}`} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#5DCAA5", fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2,
      }}>×</button>
    </span>
  );
}

function ModeButton({ mode, label, icon, current, onClick }) {
  const active = mode === current;
  return (
    <button onClick={() => onClick(mode)} style={{
      fontSize: 12, padding: "6px 16px", borderRadius: 20,
      border: active ? "1.5px solid #5DCAA5" : "1px solid rgba(93,202,165,0.3)",
      background: active ? "rgba(93,202,165,0.18)" : "rgba(255,255,255,0.05)",
      color: active ? "#0f6e56" : "#64748b",
      cursor: "pointer", transition: "all 0.2s",
      display: "flex", alignItems: "center", gap: 5,
      fontFamily: "inherit", fontWeight: active ? 700 : 400,
    }}>
      <span>{icon}</span>{label}
    </button>
  );
}

function DimBar({ label, value, colorKey, animate }) {
  const rawPct = (value || 0) * 100;
  const pct = Math.round(10 + rawPct * 0.55);
  const color = DIM_COLORS[colorKey] || "#5DCAA5";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
      <span style={{
        fontSize: 11, color: "#64748b", width: 72, textAlign: "right",
        flexShrink: 0,
      }}>{label}</span>
      <div style={{
        flex: 1, height: 6, background: "rgba(0,0,0,0.06)",
        borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          width: animate ? `${pct}%` : "0%",
          height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: `0 0 6px ${color}55`,
        }} />
      </div>
      <span style={{ fontSize: 11, color: "#94a3b8", width: 38, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

function RecCard({ item, rank, maxScore, mode }) {
  const [hovered, setHovered] = useState(false);
  const pct = Math.round(((item.score || 0) / maxScore) * 100);
  const src = item.source || mode;
  const badgeMap = {
    user_lists: { bg: "rgba(239,159,39,0.15)", color: "#854F0B", label: "同好" },
    hybrid:     { bg: "rgba(55,138,221,0.15)", color: "#0C447C", label: "混合" },
  };
  const badge = badgeMap[src] || { bg: "rgba(93,202,165,0.15)", color: "#0F6E56", label: "内容" };
  const rankColors = ["#EF9F27", "#94a3b8", "#D85A30"];
  const rankColor = rank <= 3 ? rankColors[rank - 1] : "#cbd5e1";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "13px 16px", borderRadius: 14,
        border: hovered ? "1px solid rgba(93,202,165,0.5)" : "1px solid rgba(0,0,0,0.06)",
        background: hovered ? "rgba(93,202,165,0.05)" : "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)",
        transition: "all 0.2s",
        transform: hovered ? "translateX(4px)" : "none",
      }}
    >
      <span style={{
        fontSize: 13, fontWeight: 700, color: rankColor,
        width: 22, textAlign: "center", flexShrink: 0,
      }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: "#1e293b",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{item.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
          <div style={{ flex: 1, height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%", borderRadius: 2,
              background: "linear-gradient(90deg, #5DCAA588, #5DCAA5)",
            }} />
          </div>
          <span style={{
            fontSize: 10, padding: "1px 7px", borderRadius: 10,
            background: badge.bg, color: badge.color,
          }}>{badge.label}</span>
        </div>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#5DCAA5", flexShrink: 0 }}>
        {(item.score || 0).toFixed(3)}
      </span>
    </div>
  );
}

function BuddyCard({ buddy }) {
  return (
    <div style={{
      padding: "12px 14px", borderRadius: 12,
      border: "1px solid rgba(93,202,165,0.2)",
      background: "rgba(255,255,255,0.6)", backdropFilter: "blur(6px)",
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
        <span>👤</span> 用户 {buddy.user_id}
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
        共同 {buddy.overlap_count} 部 · 相似度 {Math.round((buddy.jaccard || 0) * 100)}%
      </div>
      {buddy.sample_shared_titles?.length > 0 && (
        <div style={{ fontSize: 11, color: "#5DCAA5", marginTop: 5 }}>
          {buddy.sample_shared_titles.slice(0, 2).join(" · ")}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{
        fontSize: 11, fontWeight: 700, color: "#94a3b8",
        textTransform: "uppercase", letterSpacing: "1.5px",
      }}>{text}</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(93,202,165,0.3), transparent)" }} />
    </div>
  );
}

// ─── 主页面 ────────────────────────────────────────────────

export default function RecommendPage() {
  const [animeList, setAnimeList] = useState(["Clannad", "进击的巨人", "Re:从零开始的异世界生活"]);
  const [inputVal, setInputVal] = useState("");
  const [mode, setMode] = useState("content");
  const [alpha, setAlpha] = useState(0.7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dimAnimate, setDimAnimate] = useState(false);

  useEffect(() => {
    if (result?.profile) {
      setTimeout(() => setDimAnimate(true), 100);
    } else {
      setDimAnimate(false);
    }
  }, [result]);

  const addAnime = useCallback(() => {
    const v = inputVal.trim();
    if (!v || animeList.includes(v) || animeList.length >= 40) return;
    setAnimeList((prev) => [...prev, v]);
    setInputVal("");
  }, [inputVal, animeList]);

  const removeAnime = useCallback((i) => {
    setAnimeList((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); addAnime(); }
  };

  const runRecommend = async () => {
    if (animeList.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDimAnimate(false);
    const body = { anime_list: animeList, mode, limit: 10 };
    if (mode === "hybrid") body.hybrid_alpha = alpha;
    try {
      const res = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "推荐失败");
      setResult(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const maxScore = result
    ? Math.max(...(result.items || []).map((i) => i.score || 0), 0.001)
    : 1;

  const topTags = result?.profile?.aggregated_tags
    ? Object.entries(result.profile.aggregated_tags)
        .sort((a, b) => b[1] - a[1]).slice(0, 4).map((e) => e[0])
    : [];

  const dimEntries = result?.profile?.dimensions_14
    ? Object.entries(result.profile.dimensions_14)
        .sort((a, b) => b[1] - a[1]).slice(0, 8)
    : [];

  const modeLabel = { content: "🎨 画像推荐", collaborative: "👥 同好推荐", hybrid: "⚡ 混合推荐" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700&display=swap');
        * { font-family: 'M PLUS Rounded 1c', 'Noto Sans SC', sans-serif; box-sizing: border-box; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .rec-item { animation: fadeUp 0.4s ease both; }
      `}</style>

      <main style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #fdf6ff 0%, #f0faf7 40%, #fef9f0 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "fixed", top: -120, right: -120, width: 400, height: 400,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(93,202,165,0.12), transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "fixed", bottom: -80, left: -80, width: 300, height: 300,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(212,83,126,0.08), transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <Sakura />

        <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 1.5rem 4rem", position: "relative", zIndex: 1 }}>

          {/* 页头 */}
          <div style={{ padding: "2.5rem 0 1.5rem", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10, display: "inline-block", animation: "float 3s ease-in-out infinite" }}>🌸</div>
            <h1 style={{
              fontSize: 28, fontWeight: 700, letterSpacing: -0.5, margin: 0,
              background: "linear-gradient(135deg, #0f6e56, #5DCAA5, #378ADD)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>ACG Recommend</h1>
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, letterSpacing: "0.5px" }}>
              番剧偏好分析 · 智能推荐引擎 ✨
            </p>
          </div>

          {/* 输入卡片 */}
          <div style={{
            background: "rgba(255,255,255,0.78)", backdropFilter: "blur(16px)",
            borderRadius: 20, border: "1px solid rgba(93,202,165,0.2)",
            padding: "1.5rem", marginBottom: "1.5rem",
            boxShadow: "0 4px 24px rgba(93,202,165,0.08)",
          }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="text" value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="✍️ 输入喜欢的番剧名，回车添加..."
                style={{
                  flex: 1, fontSize: 13, padding: "9px 14px",
                  border: "1px solid rgba(93,202,165,0.3)", borderRadius: 12,
                  background: "rgba(255,255,255,0.8)", color: "#1e293b", outline: "none",
                }}
              />
              <button onClick={addAnime} style={{
                fontSize: 13, padding: "9px 16px", borderRadius: 12,
                border: "1px solid rgba(93,202,165,0.4)",
                background: "rgba(93,202,165,0.12)", color: "#0f6e56",
                cursor: "pointer", fontWeight: 700,
              }}>+ 添加</button>
            </div>

            {animeList.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {animeList.map((t, i) => (
                  <AnimeTag key={t} title={t} onRemove={() => removeAnime(i)} />
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <ModeButton mode="content"       label="画像推荐" icon="🎨" current={mode} onClick={setMode} />
              <ModeButton mode="collaborative" label="同好推荐" icon="👥" current={mode} onClick={setMode} />
              <ModeButton mode="hybrid"        label="混合推荐" icon="⚡" current={mode} onClick={setMode} />
              <button
                onClick={runRecommend}
                disabled={loading || animeList.length === 0}
                style={{
                  marginLeft: "auto", fontSize: 13, fontWeight: 700,
                  padding: "9px 22px", borderRadius: 12, border: "none",
                  background: loading || animeList.length === 0
                    ? "#cbd5e1"
                    : "linear-gradient(135deg, #5DCAA5, #378ADD)",
                  color: "white",
                  cursor: loading || animeList.length === 0 ? "not-allowed" : "pointer",
                  boxShadow: loading || animeList.length === 0 ? "none" : "0 4px 12px rgba(93,202,165,0.35)",
                  transition: "all 0.2s",
                }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      display: "inline-block", width: 12, height: 12,
                      borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)",
                      borderTopColor: "white", animation: "spin 0.7s linear infinite",
                    }} />
                    分析中…
                  </span>
                ) : "✨ 获取推荐"}
              </button>
            </div>

            {mode === "hybrid" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>内容权重 α</span>
                <input type="range" min={0} max={1} step={0.1} value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: "#5DCAA5", width: 28, fontWeight: 700 }}>{alpha.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 12, marginBottom: "1rem",
              background: "rgba(252,235,235,0.9)", color: "#A32D2D",
              border: "1px solid #F09595", fontSize: 13,
            }}>⚠️ {error}</div>
          )}

          {/* 结果区 */}
          {result && (
            <div style={{ animation: "fadeUp 0.5s ease" }}>
              {/* 状态栏 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                fontSize: 11, color: "#94a3b8", marginBottom: "1.25rem",
                padding: "8px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.5)",
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#5DCAA5",
                  display: "inline-block", animation: "pulse 2s infinite",
                }} />
                {modeLabel[result.mode]}
                &nbsp;·&nbsp;扫描 {result.candidates_scanned ?? "-"} 部候选
                &nbsp;·&nbsp;返回 {result.items?.length ?? 0} 条
              </div>

              {/* 偏好画像 */}
              {result.profile && (
                <div style={{
                  background: "rgba(255,255,255,0.78)", backdropFilter: "blur(16px)",
                  borderRadius: 20, border: "1px solid rgba(93,202,165,0.15)",
                  padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
                  boxShadow: "0 2px 16px rgba(93,202,165,0.06)",
                }}>
                  <SectionTitle icon="🔮" text="偏好画像" />
                  {topTags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      {topTags.map((tag, i) => (
                        <span key={tag} style={{
                          fontSize: 12, padding: "4px 12px", borderRadius: 20, fontWeight: 700,
                          background: ["rgba(93,202,165,0.15)","rgba(55,138,221,0.15)","rgba(212,83,126,0.15)","rgba(239,159,39,0.15)"][i % 4],
                          color: ["#0f6e56","#0C447C","#993556","#854F0B"][i % 4],
                          border: `1px solid ${["rgba(93,202,165,0.3)","rgba(55,138,221,0.3)","rgba(212,83,126,0.3)","rgba(239,159,39,0.3)"][i % 4]}`,
                        }}># {tag}</span>
                      ))}
                      <span style={{ fontSize: 11, color: "#cbd5e1", alignSelf: "center" }}>
                        共 {Object.keys(result.profile.aggregated_tags || {}).length} 个标签
                      </span>
                    </div>
                  )}
                  <div>
                    {dimEntries.map(([k, v]) => (
                      <DimBar key={k} label={DIM_LABELS[k] || k} value={v} colorKey={k} animate={dimAnimate} />
                    ))}
                  </div>
                </div>
              )}

              {/* 同好用户 */}
              {result.buddy_matches?.length > 0 && (
                <div style={{
                  background: "rgba(255,255,255,0.78)", backdropFilter: "blur(16px)",
                  borderRadius: 20, border: "1px solid rgba(55,138,221,0.15)",
                  padding: "1.25rem 1.5rem", marginBottom: "1.25rem",
                }}>
                  <SectionTitle icon="👥" text="同好用户" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                    {result.buddy_matches.slice(0, 6).map((b) => (
                      <BuddyCard key={b.user_id} buddy={b} />
                    ))}
                  </div>
                </div>
              )}

              {/* 推荐列表 */}
              <div style={{
                background: "rgba(255,255,255,0.78)", backdropFilter: "blur(16px)",
                borderRadius: 20, border: "1px solid rgba(93,202,165,0.15)",
                padding: "1.25rem 1.5rem",
                boxShadow: "0 2px 16px rgba(93,202,165,0.06)",
              }}>
                <SectionTitle icon="🌟" text="推荐结果" />
                {result.items?.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#cbd5e1", fontSize: 13, padding: "2rem 0" }}>
                    暂无推荐结果
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.items.map((item, idx) => (
                      <div key={item.title} className="rec-item" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <RecCard item={item} rank={idx + 1} maxScore={maxScore} mode={result.mode} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

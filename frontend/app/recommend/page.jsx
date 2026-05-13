"use client";

import { useState, useCallback } from "react";

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

// ─── 子组件 ────────────────────────────────────────────────

function AnimeTag({ title, onRemove }) {
  return (
    <span className="tag">
      {title}
      <button onClick={onRemove} aria-label={`删除 ${title}`}>
        ×
      </button>
      <style jsx>{`
        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 20px;
          background: #e1f5ee;
          color: #0f6e56;
          border: 0.5px solid #5dcaa5;
          font-family: var(--font-display, "Syne", sans-serif);
        }
        button {
          background: none;
          border: none;
          cursor: pointer;
          color: #0f6e56;
          font-size: 15px;
          line-height: 1;
          padding: 0;
        }
      `}</style>
    </span>
  );
}

function ModeButton({ mode, label, current, onClick }) {
  const active = mode === current;
  return (
    <button
      onClick={() => onClick(mode)}
      style={{
        fontFamily: "Syne, sans-serif",
        fontSize: 12,
        padding: "5px 14px",
        borderRadius: 20,
        border: "0.5px solid",
        borderColor: active ? "var(--color-text-primary)" : "var(--color-border-secondary)",
        background: active ? "var(--color-text-primary)" : "var(--color-background-primary)",
        color: active ? "var(--color-background-primary)" : "var(--color-text-secondary)",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function MetricCard({ label, value, span }) {
  return (
    <div
      style={{
        background: "var(--color-background-secondary)",
        borderRadius: 8,
        padding: "12px 14px",
        gridColumn: span ? `span ${span}` : undefined,
      }}
    >
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "Syne, sans-serif", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: span ? 14 : 20, fontWeight: 500, color: "var(--color-text-primary)", fontFamily: "Syne, sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

function DimBar({ label, value }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", width: 80, textAlign: "right", flexShrink: 0, fontFamily: "Syne, sans-serif" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 4, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: "#5DCAA5", transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", width: 36, fontFamily: "Syne, sans-serif" }}>
        {pct}%
      </span>
    </div>
  );
}

function Badge({ source }) {
  const styles = {
    user_lists: { bg: "#FAEEDA", color: "#854F0B", border: "#EF9F27", label: "同好" },
    hybrid:     { bg: "#E6F1FB", color: "#0C447C", border: "#378ADD", label: "混合" },
    default:    { bg: "#E1F5EE", color: "#0F6E56", border: "#5DCAA5", label: "内容" },
  };
  const s = styles[source] || styles.default;
  return (
    <span style={{
      fontSize: 10, fontFamily: "Syne, sans-serif",
      padding: "2px 7px", borderRadius: 10,
      background: s.bg, color: s.color,
      border: `0.5px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

function RecCard({ item, rank, maxScore, mode }) {
  const pct = Math.round(((item.score || 0) / maxScore) * 100);
  const scoreDisp = (item.score || 0).toFixed(3);
  const src = item.source || mode;
  const breakdown = item.breakdown
    ? `内容 ${item.breakdown.content?.toFixed(2) ?? "-"} · 协同 ${item.breakdown.collaborative?.toFixed(2) ?? "-"}`
    : item.cosine_similarity != null
    ? `余弦相似度 ${item.cosine_similarity.toFixed(3)}`
    : "";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 14px",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 12,
      background: "var(--color-background-primary)",
    }}>
      <span style={{ fontFamily: "Syne, sans-serif", fontSize: 11, color: "var(--color-text-tertiary)", width: 20, textAlign: "center", flexShrink: 0 }}>
        {rank}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.title}
        </div>
        {breakdown && (
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2, fontFamily: "Syne, sans-serif" }}>
            {breakdown}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>
          {scoreDisp}
        </span>
        <div style={{ width: 60, height: 3, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: "#5DCAA5" }} />
        </div>
        <Badge source={src} />
      </div>
    </div>
  );
}

function BuddyCard({ buddy }) {
  return (
    <div style={{
      padding: "10px 12px",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 8,
      background: "var(--color-background-primary)",
    }}>
      <div style={{ fontSize: 13, fontWeight: 500, fontFamily: "Syne, sans-serif" }}>
        用户 {buddy.user_id}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3, fontFamily: "Syne, sans-serif" }}>
        共同 {buddy.overlap_count} 部 · Jaccard {(buddy.jaccard || 0).toFixed(2)}
      </div>
      {buddy.sample_shared_titles?.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4, fontFamily: "Syne, sans-serif" }}>
          {buddy.sample_shared_titles.slice(0, 2).join(" · ")}
        </div>
      )}
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
    if (e.key === "Enter") {
      e.preventDefault();
      addAnime();
    }
  };

  const runRecommend = async () => {
    if (animeList.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

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
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((e) => e[0])
        .join(" · ")
    : "—";

  const dimEntries = result?.profile?.dimensions_14
    ? Object.entries(result.profile.dimensions_14)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    : [];

  const modeLabel = { content: "画像推荐", collaborative: "同好推荐", hybrid: "混合推荐" };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 1.5rem 3rem", fontFamily: "Noto Serif SC, serif" }}>

      {/* 页头 */}
      <div style={{ padding: "1.5rem 0 1rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
          ACG Recommend
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 4 }}>
          基于内容向量 · 协同过滤 · 混合推荐
        </p>
      </div>

      {/* 输入区 */}
      <div style={{ padding: "1.25rem 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        {/* 输入行 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入动漫名称，回车添加（最多40部）"
            style={{
              flex: 1, fontSize: 14, padding: "7px 12px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 8, background: "var(--color-background-primary)",
              color: "var(--color-text-primary)", fontFamily: "Noto Serif SC, serif",
              outline: "none",
            }}
          />
          <button
            onClick={addAnime}
            style={{
              fontSize: 13, padding: "7px 14px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 8, background: "var(--color-background-primary)",
              color: "var(--color-text-primary)", cursor: "pointer",
              fontFamily: "Syne, sans-serif",
            }}
          >
            + 添加
          </button>
        </div>

        {/* 标签列表 */}
        {animeList.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {animeList.map((t, i) => (
              <AnimeTag key={t} title={t} onRemove={() => removeAnime(i)} />
            ))}
          </div>
        )}

        {/* 模式选择行 */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontFamily: "Syne, sans-serif" }}>
            模式
          </span>
          <ModeButton mode="content"       label="画像推荐" current={mode} onClick={setMode} />
          <ModeButton mode="collaborative" label="同好推荐" current={mode} onClick={setMode} />
          <ModeButton mode="hybrid"        label="混合推荐" current={mode} onClick={setMode} />
          <button
            onClick={runRecommend}
            disabled={loading || animeList.length === 0}
            style={{
              marginLeft: "auto", fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500,
              padding: "7px 20px", borderRadius: 8, border: "none",
              background: "var(--color-text-primary)", color: "var(--color-background-primary)",
              cursor: loading || animeList.length === 0 ? "not-allowed" : "pointer",
              opacity: loading || animeList.length === 0 ? 0.4 : 1,
            }}
          >
            {loading ? "加载中…" : "获取推荐 ↗"}
          </button>
        </div>

        {/* 混合模式 alpha 滑块 */}
        {mode === "hybrid" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <label style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontFamily: "Syne, sans-serif", whiteSpace: "nowrap" }}>
              内容权重 α
            </label>
            <input
              type="range" min={0} max={1} step={0.1} value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 12, fontFamily: "Syne, sans-serif", width: 28, color: "var(--color-text-secondary)" }}>
              {alpha.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* 结果区 */}
      {(error || result) && (
        <div style={{ paddingTop: "1.25rem" }}>

          {/* 错误提示 */}
          {error && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "#FCEBEB", color: "#A32D2D",
              border: "0.5px solid #F09595",
              fontSize: 13, marginBottom: "1rem",
              fontFamily: "Syne, sans-serif",
            }}>
              {error}
            </div>
          )}

          {result && (
            <>
              {/* 状态栏 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: "1rem", fontFamily: "Syne, sans-serif" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5DCAA5", flexShrink: 0, display: "inline-block" }} />
                模式: {modeLabel[result.mode]} · 扫描候选 {result.candidates_scanned ?? "-"} 部 · 返回 {result.items?.length ?? 0} 条
              </div>

              {/* 偏好画像 */}
              {result.profile && (
                <>
                  <p style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem" }}>
                    偏好画像
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: "1.5rem" }}>
                    <MetricCard label="来源作品" value={result.profile.source_titles?.length ?? "-"} />
                    <MetricCard label="标签数量" value={Object.keys(result.profile.aggregated_tags || {}).length} />
                    <MetricCard label="高频标签" value={topTags} span={2} />
                  </div>
                  <div style={{ marginBottom: "1.5rem" }}>
                    {dimEntries.map(([k, v]) => (
                      <DimBar key={k} label={DIM_LABELS[k] || k} value={v} />
                    ))}
                  </div>
                  <hr style={{ border: "none", borderTop: "0.5px solid var(--color-border-tertiary)", margin: "1.25rem 0" }} />
                </>
              )}

              {/* 同好用户 */}
              {result.buddy_matches?.length > 0 && (
                <>
                  <p style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem" }}>
                    同好用户
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: "1.5rem" }}>
                    {result.buddy_matches.slice(0, 6).map((b) => (
                      <BuddyCard key={b.user_id} buddy={b} />
                    ))}
                  </div>
                  <hr style={{ border: "none", borderTop: "0.5px solid var(--color-border-tertiary)", margin: "1.25rem 0" }} />
                </>
              )}

              {/* 推荐列表 */}
              <p style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: "1rem" }}>
                推荐结果
              </p>
              {result.items?.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13, fontFamily: "Syne, sans-serif", padding: "2rem 0" }}>
                  暂无推荐结果
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.items.map((item, idx) => (
                    <RecCard key={item.title} item={item} rank={idx + 1} maxScore={maxScore} mode={result.mode} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}

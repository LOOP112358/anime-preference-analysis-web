"use client";

import { useMemo, useState } from "react";
import { analyzeAnimeList } from "../lib/api";
import PersonalityCard from "./PersonalityCard";
import RadarChart from "./RadarChart";
import WordCloudPanel from "./WordCloudPanel";

const CONFIG = {
  title: "用你的动画偏好，生成一张娱乐向人格画像",
  description:
    "输入 3 到 9 部动画作品，系统优先在 Bangumi 搜索条目并读取标签与简介；若 Bangumi 无结果或内容为空，则回退到中文维基百科抓取分类与导语，再提取偏好特征并输出主人格、副人格与解释文本。",
  inputLabel: "动画列表",
  placeholder: "每行一部作品，或用逗号分隔",
  defaultInput: "来自新世界\n世界计划\n少女歌剧\n心理测量者\n电锯人",
  cta: "开始分析动画偏好",
  payloadLabel: "当前识别作品",
  worksTitle: "数据源抓取结果",
  primaryTitle: "主人格",
  secondaryTitle: "副人格",
  dimLabels: {
    healing: "治愈", dark: "黑暗", passion: "热血", fantasy: "幻想",
    realism: "现实", projection: "代入", escape: "逃避", stimulation: "刺激",
    analytical: "理性", emotional: "感性", relationship_focus: "关系",
    individual_focus: "个人", plot_complex: "复杂剧情", daily: "日常",
  },
  radarKeys: ["healing", "dark", "fantasy", "projection", "stimulation", "analytical", "emotional", "daily"],
  cloudFallback: [
    { name: "治愈", value: 10 }, { name: "黑暗", value: 8 },
    { name: "关系", value: 7 }, { name: "幻想", value: 6 },
  ],
};

// 维度颜色映射
const DIM_COLORS = {
  healing: "#5DCAA5", dark: "#7F77DD", passion: "#D85A30", fantasy: "#4ab8d6",
  realism: "#888780", projection: "#D4537E", escape: "#1D9E75", stimulation: "#f1bc54",
  analytical: "#534AB7", emotional: "#993556", relationship_focus: "#0F6E56",
  individual_focus: "#185FA5", plot_complex: "#BA7517", daily: "#639922",
};

function parseInput(value) {
  return value.split(/\n|,|，/).map((item) => item.trim()).filter(Boolean);
}

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

function WorksPanel({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((work) => (
        <article key={`${work.source}-${work.title}`} style={{
          borderRadius: 12, border: "1px solid rgba(93,202,165,0.15)",
          padding: "14px 16px", background: "rgba(255,255,255,0.6)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", margin: 0 }}>{work.title}</h3>
            <span style={{
              fontSize: 10, color: "#94a3b8", textTransform: "uppercase",
              letterSpacing: "0.15em", flexShrink: 0,
            }}>{work.source}</span>
          </div>
          <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7, marginBottom: 8 }}>
            {work.text || "未抓取到简介文本"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {[...(work.moe_tags || []).slice(0, 10), ...(work.categories || []).slice(0, 6)].map((tag) => (
              <span key={`${work.title}-${tag}`} style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 10,
                background: "rgba(93,202,165,0.1)", color: "#0f6e56",
                border: "1px solid rgba(93,202,165,0.2)",
              }}>{tag}</span>
            ))}
          </div>
          {work.error && (
            <p style={{ fontSize: 11, color: "#B45309", marginTop: 6 }}>提示：{work.error}</p>
          )}
        </article>
      ))}
    </div>
  );
}

function DimBar({ label, value, colorKey }) {
  const pct = Math.round(10 + (value || 0) * 55);
  const color = DIM_COLORS[colorKey] || "#5DCAA5";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 11, color: "#64748b", width: 72, textAlign: "right", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 3,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 5px ${color}44`,
        }} />
      </div>
      <span style={{ fontSize: 11, color: "#94a3b8", width: 36, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

export default function AnalyzerClient() {
  const [input, setInput] = useState(CONFIG.defaultInput);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsedItems = useMemo(() => parseInput(input), [input]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await analyzeAnimeList(parsedItems);
      setResult(data);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  const cardStyle = {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.75)",
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 4px 24px rgba(93,202,165,0.07)",
    padding: "1.5rem",
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50%       { transform: translateY(-7px) rotate(5deg); }
        }
        .analyzer-textarea:focus {
          outline: none;
          border-color: #5DCAA5 !important;
          box-shadow: 0 0 0 3px rgba(93,202,165,0.15);
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* 页头 */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 34, display: "inline-block", animation: "float 3s ease-in-out infinite", marginBottom: 8 }}>🔮</div>
          <h1 style={{
            fontSize: 26, fontWeight: 700, margin: 0,
            background: "linear-gradient(135deg, #0f6e56, #5DCAA5, #4ab8d6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>ACG Personality Analyzer</h1>
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>用动画偏好生成娱乐向人格画像 ✨</p>
        </div>

        {/* 上部：输入 + 输出 */}
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>

          {/* 输入卡 */}
          <div style={cardStyle}>
            <SectionTitle icon="✍️" text="动画列表" />
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: "1rem" }}>
              {CONFIG.description}
            </p>
            <form onSubmit={handleSubmit}>
              <textarea
                className="analyzer-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={CONFIG.placeholder}
                style={{
                  width: "100%", minHeight: 180, padding: "12px 14px",
                  border: "1px solid rgba(93,202,165,0.3)", borderRadius: 12,
                  background: "rgba(255,255,255,0.8)", color: "#1e293b",
                  fontSize: 13, resize: "vertical", transition: "all 0.2s",
                  fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  style={{
                    padding: "10px 22px", borderRadius: 12, border: "none",
                    background: loading ? "#cbd5e1" : "linear-gradient(135deg, #5DCAA5, #4ab8d6)",
                    color: "white", fontSize: 13, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: loading ? "none" : "0 4px 12px rgba(93,202,165,0.3)",
                    transition: "all 0.2s", fontFamily: "inherit",
                  }}
                >
                  {loading ? "分析中…" : "✨ " + CONFIG.cta}
                </button>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  已识别 {parsedItems.length} 部，需要 3～9 部
                </span>
              </div>
              {error && (
                <p style={{ fontSize: 12, color: "#dc2626", marginTop: 8, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
                  ⚠️ {error}
                </p>
              )}
            </form>
          </div>

          {/* 输出卡 */}
          <div style={{
            borderRadius: 20, border: "1px solid rgba(16,24,38,0.12)",
            background: "#101826", padding: "1.5rem",
            boxShadow: "0 4px 24px rgba(16,24,38,0.12)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>系统输出</h2>
              <span style={{
                fontSize: 10, color: "rgba(255,255,255,0.5)", padding: "3px 10px",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20,
                textTransform: "uppercase", letterSpacing: "0.15em",
              }}>12 Types</span>
            </div>

            {/* 人格卡片 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1rem" }}>
              <PersonalityCard title={CONFIG.primaryTitle} value={result?.primary_type || "等待分析"} accent="from-coral/95 to-gold/90" />
              <PersonalityCard title={CONFIG.secondaryTitle} value={result?.secondary_type || "等待分析"} accent="from-cyan/95 to-sage/90" />
            </div>

            {/* Traits */}
            <div style={{
              borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", padding: "14px", marginBottom: "1rem",
            }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 10 }}>
                Traits
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(result?.traits || ["治愈倾向", "高代入感", "幻想偏好"]).map((trait) => (
                  <span key={trait} style={{
                    fontSize: 12, padding: "3px 10px", borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)",
                  }}>{trait}</span>
                ))}
              </div>
            </div>

            {/* LLM Analysis */}
            <div style={{
              borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", padding: "14px",
            }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 8 }}>
                LLM Analysis
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.8, margin: 0 }}>
                {result?.analysis || "分析完成后，这里会生成一段娱乐向解释文本。"}
              </p>
            </div>
          </div>
        </div>

        {/* 中部：词云 + 雷达 */}
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
          <div style={cardStyle}>
            <SectionTitle icon="☁️" text="偏好词云" />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>聚合标签权重</span>
            <WordCloudPanel data={result?.feature_cloud || []} fallbackData={CONFIG.cloudFallback} />
          </div>
          <div style={cardStyle}>
            <SectionTitle icon="📡" text="人格维度雷达图" />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>归一化分数</span>
            <RadarChart dimensions={result?.dimensions || {}} dimensionLabels={CONFIG.dimLabels} radarKeys={CONFIG.radarKeys} />
          </div>
        </div>

        {/* 下部：抓取结果 + 维度明细 */}
        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr" }}>
          <div style={cardStyle}>
            <SectionTitle icon="📦" text={CONFIG.worksTitle} />
            <WorksPanel items={result?.works || []} />
            {!result?.works?.length && (
              <p style={{ fontSize: 13, color: "#cbd5e1", textAlign: "center", padding: "1.5rem 0" }}>
                分析后显示每部作品的抓取数据
              </p>
            )}
          </div>
          <div style={cardStyle}>
            <SectionTitle icon="📊" text="维度明细" />
            {Object.keys(result?.dimensions || {}).length === 0 ? (
              <p style={{ fontSize: 13, color: "#cbd5e1", textAlign: "center", padding: "1.5rem 0" }}>
                分析后显示 14 维度评分
              </p>
            ) : (
              <div style={{ marginTop: 8 }}>
                {Object.entries(result.dimensions)
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, value]) => (
                    <DimBar key={key} label={CONFIG.dimLabels[key] || key} value={value} colorKey={key} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

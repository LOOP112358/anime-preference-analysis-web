"use client";

import { useMemo, useState } from "react";
import { analyzeAnimeList, recommendAnimeList } from "../lib/api";
import PersonalityCard from "./PersonalityCard";
import RadarChart from "./RadarChart";
import WordCloudPanel from "./WordCloudPanel";
import MoeLabel from "./MoeLabel";
import {
  btnPrimaryClass,
  inputClass,
  panelClass,
  panelInkClass,
  tabButtonClasses,
  tagChipClass,
} from "./ui";

const CONFIG = {
  title: "用你的动画偏好，生成一张娱乐向人格画像",
  description:
    "输入 3 到 9 部动画作品，系统优先在 Bangumi 搜索条目并读取标签与简介；若 Bangumi 无结果或内容为空，则回退到中文维基百科抓取分类与导语，再提取偏好特征并输出主人格、副人格与解释文本。",
  inputLabel: "动画列表",
  placeholder: "每行一部作品，或用逗号分隔",
  defaultInput: "",
  cta: "开始分析动画偏好",
  payloadLabel: "当前识别作品",
  worksTitle: "数据源抓取结果",
  primaryTitle: "主人格",
  secondaryTitle: "副人格",
  dimLabels: {
    healing: "治愈",
    dark: "黑暗",
    passion: "热血",
    suspense: "悬疑",
    fantasy: "幻想",
    realism: "现实",
    daily: "日常",
    emotion: "感性",
    bond: "关系",
    growth: "成长",
    logic: "理性",
    narrative: "叙事",
    humor: "幽默",
    music: "音乐",
  },
  radarKeys: [
    "healing",
    "fantasy",
    "emotion",
    "bond",
    "daily",
    "growth",
    "realism",
    "dark",
    "passion",
    "suspense",
    "logic",
    "narrative",
  ],
  cloudFallback: [
    { name: "治愈", value: 12 },
    { name: "幻想", value: 10 },
    { name: "关系", value: 9 },
    { name: "黑暗", value: 8 },
    { name: "热血", value: 7 },
    { name: "日常", value: 6 },
    { name: "音乐", value: 5 },
    { name: "校园", value: 5 },
    { name: "成长", value: 4 },
    { name: "情感", value: 4 },
  ],
};

function parseInput(value) {
  return value
    .split(/\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function worksScrapeFailed(works) {
  if (!works?.length) {
    return false;
  }
  return works.every(
    (work) =>
      work.source === "unresolved" ||
      /ETIMEDOUT|ECONNRESET|ENOTFOUND|timeout/i.test(work.error || ""),
  );
}

function WorksPanel({ items }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {items.map((work) => {
        const title = work.title;
        return (
          <article key={`${work.source}-${title}`} className="sketch-card p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-stone-800">{title}</h3>
              <span className="sketch-badge text-[10px] uppercase">{work.source}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{work.text || "未抓取到简介文本"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...(work.moe_tags || []).slice(0, 10), ...(work.categories || []).slice(0, 6)].map((tag) => (
                <span key={`${title}-${tag}`} className={tagChipClass}>
                  {tag}
                </span>
              ))}
            </div>
            {work.error ? <p className="mt-2 text-xs text-amber-700">提示：{work.error}</p> : null}
          </article>
        );
      })}
    </div>
  );
}

const REC_MODES = [
  { value: "content", label: "内容（向量相似度）" },
  { value: "collaborative", label: "协同（公开用户片单）" },
  { value: "hybrid", label: "混合" },
];

export default function AnalyzerClient() {
  const [tab, setTab] = useState("analyze");
  const [input, setInput] = useState(CONFIG.defaultInput);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [recMode, setRecMode] = useState("content");
  const [recLimit, setRecLimit] = useState(10);
  const [recMinOverlap, setRecMinOverlap] = useState(1);
  const [recAlpha, setRecAlpha] = useState(0.7);
  const [recResult, setRecResult] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");

  const parsedItems = useMemo(() => parseInput(input), [input]);
  const scrapeFailed = useMemo(() => worksScrapeFailed(result?.works), [result?.works]);

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

  async function handleRecommendSubmit(event) {
    event.preventDefault();
    setRecLoading(true);
    setRecError("");

    if (parsedItems.length < 1 || parsedItems.length > 40) {
      setRecError("推荐模式需要输入 1 到 40 部作品。");
      setRecLoading(false);
      return;
    }

    try {
      const body = {
        mode: recMode,
        anime_list: parsedItems,
        limit: Math.min(50, Math.max(1, Number(recLimit) || 10)),
      };
      if (recMode === "collaborative" || recMode === "hybrid") {
        body.min_overlap = Math.min(20, Math.max(1, Number(recMinOverlap) || 1));
      }
      if (recMode === "hybrid") {
        body.hybrid_alpha = Math.min(1, Math.max(0, Number(recAlpha)));
      }
      const data = await recommendAnimeList(body);
      setRecResult(data);
    } catch (submitError) {
      setRecError(submitError.message);
    } finally {
      setRecLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className={panelClass}>
          <MoeLabel icon="analyze">Personality Analyzer</MoeLabel>
          <h1 className="sketch-heading mt-3">{CONFIG.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
            {tab === "analyze"
              ? CONFIG.description
              : "根据你输入的片单，调用后端推荐接口：内容模式用 Bangumi/维基抓取特征并与本地作品池做余弦相似度；协同模式需配置 USER_LISTS_API_URL；混合模式按 hybrid_alpha 融合两者。"}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              className={tabButtonClasses(tab === "analyze")}
              onClick={() => {
                setTab("analyze");
                setRecError("");
              }}
            >
              人格分析
            </button>
            <button
              type="button"
              className={tabButtonClasses(tab === "recommend")}
              onClick={() => {
                setTab("recommend");
                setError("");
              }}
            >
              作品推荐（测试）
            </button>
          </div>

          {tab === "analyze" ? (
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">{CONFIG.inputLabel}</span>
                <textarea
                  className={`${inputClass} min-h-52`}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={CONFIG.placeholder}
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={loading} className={btnPrimaryClass}>
                  {loading ? "分析中（抓取数据源）..." : CONFIG.cta}
                </button>
                <div className="text-sm text-stone-500">
                  {CONFIG.payloadLabel} {parsedItems.length} 个，要求 3 到 9 个。
                  {loading ? " 首次约 20–60 秒，取决于网络。" : null}
                </div>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {scrapeFailed ? (
                <p className="text-sm leading-6 text-amber-800">
                  Bangumi / 维基连接超时（ETIMEDOUT）。分析结果仅基于片名推断，准确度有限。若使用代理，请在{" "}
                  <code className="text-xs">backend/.env</code> 设置{" "}
                  <code className="text-xs">SCRAPER_HTTPS_PROXY=http://127.0.0.1:7890</code> 后重启后端。
                </p>
              ) : null}
            </form>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={handleRecommendSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">{CONFIG.inputLabel}</span>
                <textarea
                  className={`${inputClass} min-h-52`}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={CONFIG.placeholder}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-stone-700">推荐模式</span>
                  <select
                    className={inputClass}
                    value={recMode}
                    onChange={(e) => setRecMode(e.target.value)}
                  >
                    {REC_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-stone-700">返回条数 limit</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className={inputClass}
                    value={recLimit}
                    onChange={(e) => setRecLimit(e.target.value)}
                  />
                </label>
              </div>
              {(recMode === "collaborative" || recMode === "hybrid") && (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-stone-700">最小共同作品数 min_overlap</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={`${inputClass} max-w-xs`}
                    value={recMinOverlap}
                    onChange={(e) => setRecMinOverlap(e.target.value)}
                  />
                </label>
              )}
              {recMode === "hybrid" && (
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-stone-700">内容权重 hybrid_alpha（0–1）</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    className={`${inputClass} max-w-xs`}
                    value={recAlpha}
                    onChange={(e) => setRecAlpha(e.target.value)}
                  />
                </label>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={recLoading} className={btnPrimaryClass}>
                  {recLoading ? "推荐计算中..." : "获取推荐"}
                </button>
                <div className="text-sm text-stone-500">已识别 {parsedItems.length} 部（1–40）。</div>
              </div>
              {recError ? <p className="text-sm text-red-600">{recError}</p> : null}
            </form>
          )}
        </div>

        {tab === "analyze" ? (
          <div className={panelInkClass}>
            <div className="relative z-[1] flex items-center justify-between">
              <h2 className="font-display text-xl text-stone-50">系统输出</h2>
              <span className="sketch-badge border-stone-500 bg-stone-700 text-stone-100">
                12 Types
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <PersonalityCard
                title={CONFIG.primaryTitle}
                value={result?.primary_type || "等待分析"}
                accent="from-coral/95 to-gold/90"
              />
              <PersonalityCard
                title={CONFIG.secondaryTitle}
                value={result?.secondary_type || "等待分析"}
                accent="from-cyan/95 to-sage/90"
              />
            </div>
            <div className="relative z-[1] mt-6 rounded-md border border-dashed border-stone-500 p-4">
              <p className="sketch-label text-stone-400">Traits</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(result?.traits || ["治愈倾向", "高代入感", "幻想偏好"]).map((trait) => (
                  <span key={trait} className="sketch-tag border-stone-500 bg-transparent text-stone-100">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative z-[1] mt-6 rounded-md border border-dashed border-stone-500 p-4">
              <p className="sketch-label text-stone-400">Analysis</p>
              <p className="mt-3 text-sm leading-7 text-stone-200">
                {result?.analysis || "分析完成后，这里会生成一段娱乐向解释文本。"}
              </p>
            </div>
          </div>
        ) : (
          <div className={panelInkClass}>
            <div className="relative z-[1] flex items-center justify-between gap-2">
              <h2 className="font-display text-xl text-stone-50">推荐结果</h2>
              <span className="sketch-badge border-stone-500 bg-stone-700 text-stone-100">
                {recResult?.mode || recMode}
              </span>
            </div>
            {recResult ? (
              <p className="relative z-[1] mt-3 text-xs leading-5 text-stone-300">
                {recResult.meta?.user_lists_status != null && (
                  <>user_lists: {String(recResult.meta.user_lists_status)}；</>
                )}
                {recResult.meta?.total_users_considered != null && (
                  <>用户数 {recResult.meta.total_users_considered}；</>
                )}
                {recResult.meta?.hybrid_note ? <span className="block mt-1">{recResult.meta.hybrid_note}</span> : null}
                {recResult.pool_size != null && (
                  <span className="block mt-1">
                    候选池约 {recResult.pool_size} 条；扫描 {recResult.candidates_scanned ?? "—"} 条相似候选。
                  </span>
                )}
              </p>
            ) : (
              <p className="relative z-[1] mt-3 text-sm text-stone-300">提交片单后，这里展示推荐列表与简要统计。</p>
            )}
            <ul className="relative z-[1] mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {(recResult?.items || []).map((row, idx) => (
                <li
                  key={`${row.title}-${idx}`}
                  className="flex items-start justify-between gap-3 rounded-md border border-dashed border-stone-500 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-stone-100">
                    {idx + 1}. {row.title}
                  </span>
                  <span className="shrink-0 text-xs text-stone-400">
                    {row.score != null ? `score ${row.score}` : ""}
                    {row.source ? ` · ${row.source}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            {recResult?.buddy_matches?.length ? (
              <div className="relative z-[1] mt-4 rounded-md border border-dashed border-stone-500 p-3 text-xs text-stone-300">
                <p className="font-medium text-stone-100">相似用户（节选）</p>
                <ul className="mt-2 space-y-1">
                  {recResult.buddy_matches.slice(0, 5).map((b) => (
                    <li key={b.user_id}>
                      user {b.user_id} · 共同 {b.overlap_count} · Jaccard {b.jaccard}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {tab === "analyze" ? (
        <>
          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className={panelClass}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-stone-800">偏好词云</h2>
                <span className="text-sm text-stone-500">聚合标签权重</span>
              </div>
              <WordCloudPanel data={result?.feature_cloud || []} fallbackData={CONFIG.cloudFallback} />
            </div>
            <div className={panelClass}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-stone-800">偏好维度雷达图</h2>
                <span className="text-sm text-stone-500">归一化分数</span>
              </div>
              <RadarChart
                dimensions={result?.dimensions || {}}
                dimensionLabels={result?.dimension_labels || CONFIG.dimLabels}
                radarKeys={result?.radar_keys || CONFIG.radarKeys}
              />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className={panelClass}>
              <h2 className="font-display text-xl text-stone-800">{CONFIG.worksTitle}</h2>
              <WorksPanel items={result?.works || []} />
            </div>
            <div className={panelClass}>
              <h2 className="font-display text-xl text-stone-800">维度明细</h2>
              <div className="mt-4 grid gap-3">
                {(result?.dimension_keys || Object.keys(CONFIG.dimLabels))
                  .map((key) => [key, Number(result?.dimensions?.[key] || 0)])
                  .sort((a, b) => b[1] - a[1])
                  .map(([key, value]) => {
                    const dimLabels = result?.dimension_labels || CONFIG.dimLabels;
                    const label = dimLabels[key];
                    if (!label) {
                      return null;
                    }

                    return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-sm text-stone-700">
                        <span>{label}</span>
                        <span>{Math.round(value * 100)}%</span>
                      </div>
                  <div className="h-2 rounded-full border border-stone-300 bg-stone-100">
                    <div
                      className="sketch-progress-moe"
                          style={{ width: `${Math.max(value * 100, 3)}%` }}
                        />
                      </div>
                    </div>
                    );
                  })}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

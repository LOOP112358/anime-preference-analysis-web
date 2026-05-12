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
    healing: "治愈",
    dark: "黑暗",
    passion: "热血",
    fantasy: "幻想",
    realism: "现实",
    projection: "代入",
    escape: "逃避",
    stimulation: "刺激",
    analytical: "理性",
    emotional: "感性",
    relationship_focus: "关系",
    individual_focus: "个人",
    plot_complex: "复杂剧情",
    daily: "日常",
  },
  radarKeys: ["healing", "dark", "fantasy", "projection", "stimulation", "analytical", "emotional", "daily"],
  cloudFallback: [
    { name: "治愈", value: 10 },
    { name: "黑暗", value: 8 },
    { name: "关系", value: 7 },
    { name: "幻想", value: 6 },
  ],
};

function parseInput(value) {
  return value
    .split(/\n|,|，/)
    .map((item) => item.trim())
    .filter(Boolean);
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
          <article key={`${work.source}-${title}`} className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-medium text-slate-900">{title}</h3>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{work.source}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{work.text || "未抓取到简介文本"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...(work.moe_tags || []).slice(0, 10), ...(work.categories || []).slice(0, 6)].map((tag) => (
                <span key={`${title}-${tag}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-lg border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur">
          <p className="text-sm uppercase tracking-[0.18em] text-cyan">ACG Personality Analyzer</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink md:text-5xl">{CONFIG.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{CONFIG.description}</p>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{CONFIG.inputLabel}</span>
              <textarea
                className="min-h-52 w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={CONFIG.placeholder}
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "分析中..." : CONFIG.cta}
              </button>
              <div className="text-sm text-slate-500">
                {CONFIG.payloadLabel} {parsedItems.length} 个，要求 3 到 9 个。
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </div>

        <div className="rounded-lg border border-ink/10 bg-ink p-6 text-white shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">系统输出</h2>
            <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
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
          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-white/60">Traits</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(result?.traits || ["治愈倾向", "高代入感", "幻想偏好"]).map((trait) => (
                <span
                  key={trait}
                  className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-sm text-white/90"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm uppercase tracking-[0.18em] text-white/60">LLM Analysis</p>
            <p className="mt-3 text-sm leading-7 text-white/85">
              {result?.analysis || "分析完成后，这里会生成一段娱乐向解释文本。"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">偏好词云</h2>
            <span className="text-sm text-slate-500">聚合标签权重</span>
          </div>
          <WordCloudPanel data={result?.feature_cloud || []} fallbackData={CONFIG.cloudFallback} />
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-ink">人格维度雷达图</h2>
            <span className="text-sm text-slate-500">归一化分数</span>
          </div>
          <RadarChart
            dimensions={result?.dimensions || {}}
            dimensionLabels={CONFIG.dimLabels}
            radarKeys={CONFIG.radarKeys}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur">
          <h2 className="text-xl font-semibold text-ink">{CONFIG.worksTitle}</h2>
          <WorksPanel items={result?.works || []} />
        </div>
        <div className="rounded-lg border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur">
          <h2 className="text-xl font-semibold text-ink">维度明细</h2>
          <div className="mt-4 grid gap-3">
            {Object.entries(result?.dimensions || {})
              .sort((a, b) => b[1] - a[1])
              .map(([key, value]) => (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-700">
                    <span>{CONFIG.dimLabels[key] || key}</span>
                    <span>{Math.round(value * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-coral to-cyan"
                      style={{ width: `${Math.max(value * 100, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
}

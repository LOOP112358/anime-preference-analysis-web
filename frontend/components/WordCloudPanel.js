"use client";

import { useEffect, useRef } from "react";

/** 与 tailwind / globals 手绘萌系主题一致 */
const THEME_COLORS = [
  "#c45c4a",
  "#5b7c99",
  "#b8954a",
  "#7a9a7e",
  "#d4738f",
  "#8a5568",
  "#6b6560",
];

const FONT_SERIF = "'Noto Serif SC', 'Songti SC', serif";
const FONT_SANS = "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif";

const FONT_LOAD_SPECS = [
  `400 18px ${FONT_SANS}`,
  `500 18px ${FONT_SANS}`,
  `700 22px ${FONT_SANS}`,
  `400 18px ${FONT_SERIF}`,
  `600 20px ${FONT_SERIF}`,
  `700 28px ${FONT_SERIF}`,
];

function hashWord(word) {
  let hash = 0;
  for (let i = 0; i < word.length; i += 1) {
    hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function colorForWord(word) {
  return THEME_COLORS[hashWord(word) % THEME_COLORS.length];
}

function maxListWeight(list) {
  return list.reduce((max, [, weight]) => Math.max(max, weight), 1);
}

/** 词少时放大字号，避免 shrinkToFit 把字缩成一小团 */
function cloudLayoutScale(wordCount) {
  if (wordCount <= 4) return 2;
  if (wordCount <= 8) return 1.65;
  if (wordCount <= 14) return 1.25;
  return 1;
}

const CLOUD_MAX_WIDTH = 400;
const CLOUD_HEIGHT = 280;

async function ensureCloudFonts() {
  if (typeof document === "undefined" || !document.fonts?.load) {
    return;
  }
  const loadFonts = Promise.all(
    FONT_LOAD_SPECS.map((spec) => document.fonts.load(spec).catch(() => undefined)),
  ).then(() => document.fonts.ready);
  await Promise.race([loadFonts, new Promise((resolve) => setTimeout(resolve, 3000))]);
}

function fitCanvas(canvas, container) {
  const width = Math.min(Math.max(container.clientWidth, 260), CLOUD_MAX_WIDTH);
  const height = CLOUD_HEIGHT;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return { dpr };
}

export default function WordCloudPanel({ data, fallbackData, scrapeFailed = false }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver;

    async function renderCloud() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        return;
      }

      const module = await import("wordcloud");
      const wordCloud = module.default || module;
      const source =
        data.length > 0
          ? data
          : fallbackData || [
              { name: "治愈", value: 10 },
              { name: "幻想", value: 8 },
              { name: "关系", value: 7 },
              { name: "热血", value: 6 },
            ];
      const list = source.map((item) => [item.name, item.value]);
      const peak = maxListWeight(list);
      const wordCount = list.length;
      const sizeBoost = cloudLayoutScale(wordCount);

      if (cancelled) {
        return;
      }

      await ensureCloudFonts();

      if (cancelled) {
        return;
      }

      const draw = () => {
        if (cancelled || !canvasRef.current || !containerRef.current) {
          return;
        }
        const { dpr } = fitCanvas(canvas, container);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gridSize = Math.round((wordCount <= 8 ? 6 : 9) * dpr);

        wordCloud(canvas, {
          list,
          gridSize,
          weightFactor(size) {
            const base = (size / peak) * 52 + 26;
            return base * dpr * sizeBoost;
          },
          fontFamily(word, weight) {
            const ratio = weight / peak;
            return ratio >= 0.55 ? FONT_SERIF : FONT_SANS;
          },
          fontWeight(word, weight) {
            const ratio = weight / peak;
            if (ratio >= 0.75) return "700";
            if (ratio >= 0.45) return "600";
            return "500";
          },
          color(word) {
            return colorForWord(word);
          },
          backgroundColor: "rgba(255,254,249,0)",
          rotateRatio: wordCount <= 6 ? 0 : 0.1,
          minRotation: -0.25,
          maxRotation: 0.25,
          rotationSteps: 2,
          shape: wordCount <= 6 ? "cardioid" : "circle",
          ellipticity: 0.92,
          origin: [canvas.width / 2, canvas.height / 2],
          drawOutOfBound: wordCount <= 10,
          shrinkToFit: wordCount > 14,
          clearCanvas: true,
          minSize: Math.round((wordCount <= 8 ? 20 : 14) * dpr),
          shuffle: false,
        });
      };

      draw();

      let resizeTimer;
      resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          window.requestAnimationFrame(draw);
        }, 120);
      });
      resizeObserver.observe(container);
    }

    renderCloud();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [data, fallbackData]);

  const showFallbackHint = scrapeFailed && (!data || data.length === 0);

  return (
    <div className="mt-4">
      {showFallbackHint ? (
        <p className="mb-2 text-xs leading-5 text-amber-800">
          外部数据源未连通，以下为示例词云。请在 <code className="text-[11px]">backend/.env</code> 配置{" "}
          <code className="text-[11px]">SCRAPER_HTTPS_PROXY</code> 后重试以获取真实标签。
        </p>
      ) : null}
      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-[400px] overflow-hidden rounded-lg border border-dashed border-[#e8b4c4] bg-gradient-to-br from-paper via-moe-pink-soft/50 to-mist p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
      >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 25%, rgba(255,183,197,0.25), transparent 50%), radial-gradient(circle at 75% 70%, rgba(200,235,224,0.2), transparent 45%)",
        }}
        aria-hidden
      />
        <canvas ref={canvasRef} className="relative z-[1] mx-auto block h-[280px] w-full max-w-[400px]" />
      </div>
    </div>
  );
}

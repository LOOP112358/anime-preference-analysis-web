"use client";

import { useEffect, useRef } from "react";

/** 参考年度关键词：灰粉 + 深灰 */
const PALETTE = [
  "#b07078",
  "#c4888c",
  "#9a8088",
  "#7a7570",
  "#8a8580",
  "#a89098",
  "#6b6568",
  "#5b7c99",
  "#b8954a",
  "#7a9a7e",
];

const FONT_DISPLAY = "'Noto Serif SC', 'Songti SC', 'SimSun', serif";

const CLOUD_SIZE = 360;
const SAKURA_PETALS = 5;
const CLOUD_BG = "#fffef9";
const CLOUD_MASK_BLOCK = "#eee9e3";
const MASK_INSET = 0.86;
const MAX_WORDS = 50;

function hashWord(word) {
  let hash = 0;
  for (let i = 0; i < word.length; i += 1) {
    hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function colorForWord(word) {
  return PALETTE[hashWord(word) % PALETTE.length];
}

/** 五瓣樱花极坐标：宽圆瓣 + 瓣尖微凹 */
function sakuraRadius(theta, inset = 1) {
  const t = theta + Math.PI / 2;
  let lobe = Math.abs(Math.cos((SAKURA_PETALS / 2) * t));
  lobe = lobe ** 0.62;
  const notch = 1 - 0.1 * Math.sin(SAKURA_PETALS * t) ** 2;
  return (0.36 + 0.64 * lobe * notch) * inset;
}

function traceSakuraPath(ctx, size, dpr, inset = 1) {
  const cx = (size * dpr) / 2;
  const cy = (size * dpr) / 2;
  const base = size * 0.44 * inset * dpr;
  const steps = 144;

  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const r = base * sakuraRadius(theta, 1);
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function buildSakuraPath(size, inset = 1) {
  const cx = size / 2;
  const cy = size / 2;
  const base = size * 0.44 * inset;
  const steps = 144;
  const parts = [];

  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const r = base * sakuraRadius(theta, 1);
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return `${parts.join(" ")} Z`;
}

function paintSakuraMask(canvas, size, dpr) {
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = CLOUD_MASK_BLOCK;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = CLOUD_BG;
  traceSakuraPath(ctx, size, dpr, MASK_INSET);
  ctx.fill();
}

function buildRankedWordList(source) {
  const filtered = source.filter((item) => item.name.length <= 10);
  const pool = (filtered.length >= 6 ? filtered : source.filter((item) => item.name.length <= 12))
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_WORDS);

  const last = Math.max(pool.length - 1, 1);

  return pool.map((item, index) => {
    const rank = index / last;
    const weight = Math.round(100 * (1 - rank) ** 1.6 + 6);
    return [item.name, weight];
  });
}

async function ensureCloudFonts(dpr) {
  if (typeof document === "undefined" || !document.fonts?.load) {
    return;
  }
  const px = (n) => Math.round(n * dpr);
  const sizes = [11, 14, 18, 24, 32, 42];
  const weights = ["400", "600", "700"];
  const specs = sizes.flatMap((size) =>
    weights.map((w) => `${w} ${px(size)}px ${FONT_DISPLAY}`),
  );
  await Promise.all(specs.map((spec) => document.fonts.load(spec).catch(() => undefined)));
  await document.fonts.ready;
}

const SAKURA_PATH = buildSakuraPath(CLOUD_SIZE);
const SAKURA_CLIP_PATH = buildSakuraPath(CLOUD_SIZE, MASK_INSET);

export default function WordCloudPanel({ data = [], fallbackData }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function renderCloud() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const module = await import("wordcloud");
      const wordCloud = module.default || module;

      const source =
        data.length > 0
          ? data
          : fallbackData || [
              { name: "治愈", value: 12 },
              { name: "幻想", value: 10 },
              { name: "关系", value: 9 },
              { name: "黑暗", value: 8 },
              { name: "热血", value: 7 },
              { name: "日常", value: 6 },
              { name: "音乐", value: 5 },
              { name: "校园", value: 5 },
            ];

      const renderList = buildRankedWordList(source);
      const wordCount = renderList.length;

      if (cancelled) {
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const height = CLOUD_SIZE;
      const pixelW = CLOUD_SIZE * dpr;
      const pixelH = height * dpr;

      await ensureCloudFonts(dpr);

      if (cancelled) {
        return;
      }

      paintSakuraMask(canvas, CLOUD_SIZE, dpr);

      const gridSize = Math.max(4, (wordCount > 40 ? 4 : 5) * dpr);
      const minFont = 10 * dpr;
      const maxFont = 46 * dpr;

      wordCloud(canvas, {
        list: renderList,
        gridSize,
        weightFactor(displayWeight) {
          const t = (displayWeight - 6) / (100 - 6);
          const eased = t ** 0.55;
          return minFont + eased * (maxFont - minFont);
        },
        fontFamily: FONT_DISPLAY,
        fontWeight(_word, weight) {
          if (weight >= 75) return "700";
          if (weight >= 40) return "600";
          return "400";
        },
        color(word) {
          return colorForWord(word);
        },
        backgroundColor: CLOUD_BG,
        shape(theta) {
          return sakuraRadius(theta, MASK_INSET);
        },
        ellipticity: 1,
        origin: [pixelW / 2, pixelH / 2],
        rotateRatio: 0,
        minRotation: 0,
        maxRotation: 0,
        minSize: 9 * dpr,
        drawOutOfBound: false,
        shrinkToFit: false,
        clearCanvas: false,
        shuffle: false,
      });
    }

    renderCloud();

    return () => {
      cancelled = true;
    };
  }, [data, fallbackData]);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto mt-4 flex w-full max-w-[360px] items-center justify-center"
      style={{ height: CLOUD_SIZE }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${CLOUD_SIZE} ${CLOUD_SIZE}`}
        aria-hidden
      >
        <defs>
          <radialGradient id="sakuraCloudFill" cx="50%" cy="42%" r="52%">
            <stop offset="0%" stopColor="#fff5f8" />
            <stop offset="50%" stopColor="#fff0f4" />
            <stop offset="100%" stopColor="#fae8ee" />
          </radialGradient>
          <clipPath id="sakuraWordClip">
            <path d={SAKURA_CLIP_PATH} />
          </clipPath>
        </defs>
        <path
          d={SAKURA_PATH}
          fill="url(#sakuraCloudFill)"
          stroke="#e8a0b0"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />
        <circle
          cx={CLOUD_SIZE / 2}
          cy={CLOUD_SIZE / 2}
          r={CLOUD_SIZE * 0.048}
          fill="#ffd6e8"
          stroke="#e8a8b8"
          strokeWidth="1"
        />
      </svg>
      <canvas
        ref={canvasRef}
        className="relative z-[1] block"
        style={{
          width: CLOUD_SIZE,
          height: CLOUD_SIZE,
          clipPath: "url(#sakuraWordClip)",
        }}
      />
    </div>
  );
}

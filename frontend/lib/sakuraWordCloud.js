export const CLOUD_BG = "#fffef9";
export const CLOUD_MASK_BLOCK = "#eee9e3";
export const MASK_INSET = 0.86;
export const SAKURA_PETALS = 5;
export const CLOUD_SIZE = 360;
export const MAX_WORDS = 50;

export const CLOUD_PALETTE = [
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

export const FONT_DISPLAY = "'Noto Serif SC', 'Songti SC', 'SimSun', serif";

export function sakuraRadius(theta, inset = 1) {
  const t = theta + Math.PI / 2;
  let lobe = Math.abs(Math.cos((SAKURA_PETALS / 2) * t));
  lobe = lobe ** 0.62;
  const notch = 1 - 0.1 * Math.sin(SAKURA_PETALS * t) ** 2;
  return (0.36 + 0.64 * lobe * notch) * inset;
}

export function traceSakuraPath(ctx, size, inset = 1) {
  const cx = size / 2;
  const cy = size / 2;
  const base = size * 0.44 * inset;
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

export function buildSakuraPath(size, inset = 1) {
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

export function hashWord(word) {
  let hash = 0;
  for (let i = 0; i < word.length; i += 1) {
    hash = (hash * 31 + word.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function colorForWord(word) {
  return CLOUD_PALETTE[hashWord(word) % CLOUD_PALETTE.length];
}

export function buildRankedWordList(source, maxWords = MAX_WORDS) {
  const items = (source || []).filter((item) => item?.name);
  const filtered = items.filter((item) => item.name.length <= 10);
  const pool = (filtered.length >= 6 ? filtered : items.filter((item) => item.name.length <= 12))
    .sort((a, b) => b.value - a.value)
    .slice(0, maxWords);

  const last = Math.max(pool.length - 1, 1);

  return pool.map((item, index) => {
    const rank = index / last;
    const weight = Math.round(100 * (1 - rank) ** 1.6 + 6);
    return [item.name, weight];
  });
}

export function resolveCloudFontFamily() {
  if (typeof document === "undefined") {
    return FONT_DISPLAY;
  }

  const rootStyle = getComputedStyle(document.documentElement);
  const nextSerif = rootStyle.getPropertyValue("--font-cloud-serif").trim();
  if (nextSerif) {
    return `${nextSerif}, "Songti SC", "SimSun", serif`;
  }

  return FONT_DISPLAY;
}

export async function ensureCloudFonts(dpr, fontFamily = resolveCloudFontFamily()) {
  if (typeof document === "undefined" || !document.fonts?.load) {
    return;
  }

  const px = (n) => Math.round(n * dpr);
  const sizes = [11, 14, 18, 24, 32, 42];
  const weights = ["400", "600", "700"];
  const specs = sizes.flatMap((size) =>
    weights.map((weight) => `${weight} ${px(size)}px ${fontFamily}`),
  );
  await Promise.all(specs.map((spec) => document.fonts.load(spec).catch(() => undefined)));
  await document.fonts.ready;
}

export function drawSakuraDecoration(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);

  traceSakuraPath(ctx, size, 1);
  const gradient = ctx.createRadialGradient(size * 0.5, size * 0.42, 0, size * 0.5, size * 0.5, size * 0.52);
  gradient.addColorStop(0, "#fff5f8");
  gradient.addColorStop(0.5, "#fff0f4");
  gradient.addColorStop(1, "#fae8ee");
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = "#e8a0b0";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.048, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd6e8";
  ctx.fill();
  ctx.strokeStyle = "#e8a8b8";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export function paintSakuraMask(canvas, size, dpr) {
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  if (canvas.style) {
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = CLOUD_MASK_BLOCK;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = CLOUD_BG;
  ctx.save();
  ctx.scale(dpr, dpr);
  traceSakuraPath(ctx, size, MASK_INSET);
  ctx.fill();
  ctx.restore();
}

export async function runWordCloudOnCanvas(canvas, source, size, dpr, fontFamily = resolveCloudFontFamily()) {
  const list = buildRankedWordList(source);
  if (!list.length) {
    return false;
  }

  await ensureCloudFonts(dpr, fontFamily);

  const module = await import("wordcloud");
  const wordCloud = module.default || module;
  const pixelW = size * dpr;
  const pixelH = size * dpr;
  const wordCount = list.length;
  const gridSize = Math.max(4, (wordCount > 40 ? 4 : 5) * dpr);
  const minFont = 10 * dpr;
  const maxFont = 46 * dpr;

  wordCloud(canvas, {
    list,
    gridSize,
    weightFactor(displayWeight) {
      const t = (displayWeight - 6) / (100 - 6);
      const eased = t ** 0.55;
      return minFont + eased * (maxFont - minFont);
    },
    fontFamily,
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

  return true;
}

export async function renderSakuraWordCloudComposite(source, size) {
  const dpr = 2;
  const pixelSize = Math.round(size * dpr);
  const fontFamily = resolveCloudFontFamily();

  const wordsCanvas = document.createElement("canvas");
  paintSakuraMask(wordsCanvas, size, dpr);
  const hasWords = await runWordCloudOnCanvas(wordsCanvas, source, size, dpr, fontFamily);

  const out = document.createElement("canvas");
  out.width = pixelSize;
  out.height = pixelSize;
  const ctx = out.getContext("2d");

  ctx.fillStyle = CLOUD_BG;
  ctx.fillRect(0, 0, pixelSize, pixelSize);

  ctx.save();
  ctx.scale(dpr, dpr);
  drawSakuraDecoration(ctx, 0, 0, size);

  if (hasWords) {
    ctx.save();
    traceSakuraPath(ctx, size, MASK_INSET);
    ctx.clip();
    ctx.drawImage(wordsCanvas, 0, 0, size, size);
    ctx.restore();
  }

  ctx.restore();

  return { canvas: out, hasWords };
}

export function drawSakuraWordCloudOnContext(ctx, wordsCanvas, destX, destY, destSize) {
  drawSakuraDecoration(ctx, destX, destY, destSize);

  ctx.save();
  ctx.beginPath();
  ctx.translate(destX, destY);
  traceSakuraPath(ctx, destSize, MASK_INSET);
  ctx.clip();
  ctx.translate(-destX, -destY);

  const side = Math.min(wordsCanvas.width, wordsCanvas.height);
  ctx.drawImage(wordsCanvas, 0, 0, side, side, destX, destY, destSize, destSize);
  ctx.restore();
}

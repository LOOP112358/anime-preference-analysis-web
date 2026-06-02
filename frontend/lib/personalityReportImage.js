import {
  CLOUD_BG,
  drawSakuraDecoration,
  drawSakuraWordCloudOnContext,
  renderSakuraWordCloudComposite,
} from "./sakuraWordCloud";

const WIDTH = 900;
const PADDING = 40;
const FONT =
  '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif';
const WORD_CLOUD_CANVAS_ID = "analyzer-word-cloud-canvas";

const BG = CLOUD_BG;
const INK = "#2c2c2c";
const MUTED = "#6b6560";
const ROSE = "#d4738f";
const ACCENT = "#5b7c99";
const BORDER = "rgba(44, 44, 44, 0.28)";

const DEFAULT_DIM_LABELS = {
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
};

const DEFAULT_RADAR_KEYS = [
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
];

const REPORT_RADAR_COUNT = 8;

function wrapLines(ctx, text, maxWidth) {
  if (!text) return [];
  const lines = [];
  let line = "";
  for (const char of String(text)) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function strokeDashedBox(ctx, x, y, w, h, radius = 12) {
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawSectionLabel(ctx, text, x, y) {
  ctx.fillStyle = MUTED;
  ctx.font = `600 12px ${FONT}`;
  ctx.fillText(text, x, y);
}

function drawPersonalityBlock(ctx, x, y, w, label, value) {
  strokeDashedBox(ctx, x, y, w, 108, 12);
  ctx.fillStyle = MUTED;
  ctx.font = `500 12px ${FONT}`;
  ctx.fillText(label, x + 16, y + 26);
  ctx.fillStyle = INK;
  ctx.font = `600 24px "Noto Serif SC", "Songti SC", "SimSun", serif`;
  wrapLines(ctx, value || "—", w - 32)
    .slice(0, 2)
    .forEach((line, index) => {
      ctx.fillText(line, x + 16, y + 58 + index * 30);
    });
}

function pickRadarKeys(dimensions, radarKeys, maxCount = REPORT_RADAR_COUNT) {
  if (radarKeys?.length >= 8) {
    return radarKeys.slice(0, maxCount);
  }

  const ranked = Object.entries(dimensions || {})
    .sort((a, b) => b[1] - a[1])
    .filter(([, value]) => value > 0.05);

  if (ranked.length >= 8) {
    return ranked.slice(0, maxCount).map(([key]) => key);
  }

  return DEFAULT_RADAR_KEYS.slice(0, maxCount);
}

function drawRadarChart(ctx, boxX, boxY, boxW, boxH, dimensions, dimensionLabels, radarKeys) {
  strokeDashedBox(ctx, boxX, boxY, boxW, boxH, 12);

  const keys = pickRadarKeys(dimensions, radarKeys, REPORT_RADAR_COUNT);
  const values = keys.map((key) => Number(dimensions?.[key] || 0));
  const cx = boxX + boxW / 2;
  const cy = boxY + boxH / 2 + 6;
  const radius = Math.min(boxW, boxH) * 0.34;
  const count = keys.length;

  for (let ring = 1; ring <= 4; ring += 1) {
    const r = (radius * ring) / 4;
    ctx.beginPath();
    for (let i = 0; i <= count; i += 1) {
      const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "rgba(212, 115, 143, 0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.strokeStyle = "rgba(212, 115, 143, 0.25)";
    ctx.stroke();
  }

  ctx.beginPath();
  values.forEach((value, index) => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const r = radius * Math.max(0.12, Math.min(1, value));
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(212, 115, 143, 0.32)";
  ctx.fill();
  ctx.strokeStyle = ROSE;
  ctx.lineWidth = 2;
  ctx.stroke();

  values.forEach((value, index) => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const r = radius * Math.max(0.12, Math.min(1, value));
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "#c45c4a";
    ctx.fill();
    ctx.strokeStyle = BG;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.fillStyle = MUTED;
  ctx.font = `600 12px ${FONT}`;
  keys.forEach((key, index) => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const label = dimensionLabels?.[key] || DEFAULT_DIM_LABELS[key] || key;
    const labelR = radius + 22;
    const lx = cx + Math.cos(angle) * labelR;
    const ly = cy + Math.sin(angle) * labelR;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, lx, ly);
  });
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function normalizeCloudSource(result) {
  if (result.feature_cloud?.length) return result.feature_cloud;
  if (result.aggregated_features && typeof result.aggregated_features === "object") {
    return Object.entries(result.aggregated_features)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([name, value]) => ({ name, value: Number(value) || 1 }));
  }
  return (result.traits || []).map((name, index) => ({ name, value: Math.max(1, 10 - index) }));
}

function colorNear(r, g, b, target, tolerance = 12) {
  return (
    Math.abs(r - target[0]) <= tolerance &&
    Math.abs(g - target[1]) <= tolerance &&
    Math.abs(b - target[2]) <= tolerance
  );
}

function canvasHasWordContent(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx || canvas.width < 1 || canvas.height < 1) {
    return false;
  }

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.length; i += 16) {
    const alpha = data[i + 3];
    if (alpha < 24) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (colorNear(r, g, b, [255, 254, 249])) continue;
    if (colorNear(r, g, b, [238, 233, 227])) continue;
    if (colorNear(r, g, b, [255, 245, 248])) continue;
    if (colorNear(r, g, b, [255, 240, 244])) continue;
    return true;
  }

  return false;
}

function getLiveWordCloudCanvas() {
  if (typeof document === "undefined") return null;
  const canvas = document.getElementById(WORD_CLOUD_CANVAS_ID);
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  if (!canvasHasWordContent(canvas)) return null;
  return canvas;
}

async function drawWordCloudSection(ctx, result, destX, destY, destW, destH) {
  const source = normalizeCloudSource(result);
  const destSize = Math.min(destW, destH);
  const offsetX = destX + (destW - destSize) / 2;
  const offsetY = destY + (destH - destSize) / 2;

  const liveCanvas = getLiveWordCloudCanvas();
  if (liveCanvas) {
    drawSakuraWordCloudOnContext(ctx, liveCanvas, offsetX, offsetY, destSize);
    return;
  }

  const { canvas, hasWords } = await renderSakuraWordCloudComposite(source, Math.round(destSize));
  if (hasWords) {
    ctx.drawImage(canvas, offsetX, offsetY, destSize, destSize);
    return;
  }

  drawSakuraDecoration(ctx, offsetX, offsetY, destSize);
  ctx.fillStyle = MUTED;
  ctx.font = `400 14px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("暂无词云数据", offsetX + destSize / 2, offsetY + destSize / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function measureTraitRows(ctx, traits, maxWidth) {
  let rows = 1;
  let traitX = 0;
  ctx.font = `500 14px ${FONT}`;
  traits.slice(0, 8).forEach((trait) => {
    const tagW = ctx.measureText(String(trait)).width + 24;
    if (traitX + tagW > maxWidth) {
      rows += 1;
      traitX = tagW + 8;
    } else {
      traitX += tagW + 8;
    }
  });
  return rows;
}

function drawTraits(ctx, x, startY, maxWidth, traits) {
  let cursorY = startY;
  ctx.font = `500 14px ${FONT}`;
  let traitX = x;

  traits.slice(0, 8).forEach((trait) => {
    const text = String(trait);
    const tagW = ctx.measureText(text).width + 24;
    if (traitX + tagW > x + maxWidth) {
      traitX = x;
      cursorY += 38;
    }
    const drawY = cursorY + 16;
    drawRoundedRect(ctx, traitX, drawY - 18, tagW, 30, 15);
    ctx.fillStyle = "#fff0f4";
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 115, 143, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.fillText(text, traitX + 12, drawY + 1);
    traitX += tagW + 8;
  });

  return cursorY + 38;
}

export async function generatePersonalityReportBlob(result, animeList = []) {
  if (!result?.primary_type) {
    throw new Error("请先完成人格分析");
  }

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  const contentWidth = WIDTH - PADDING * 2;
  const dimensionLabels = result.dimension_labels || DEFAULT_DIM_LABELS;
  const traits = result.traits?.length ? result.traits : ["治愈倾向", "高代入感", "幻想偏好"];

  measureCtx.font = `400 16px ${FONT}`;
  const analysisLines = wrapLines(measureCtx, result.analysis || "暂无分析文本", contentWidth - 32).slice(0, 8);
  const worksText = (animeList.length ? animeList : result.works?.map((w) => w.title) || [])
    .slice(0, 9)
    .join(" · ");
  measureCtx.font = `400 14px ${FONT}`;
  const workLines = wrapLines(measureCtx, worksText || "—", contentWidth).slice(0, 2);

  const vizH = 300;
  const traitRows = measureTraitRows(measureCtx, traits, contentWidth);
  const analysisH = 44 + analysisLines.length * 24 + 16;
  const totalHeight =
    PADDING +
    88 +
    108 +
    20 +
    vizH +
    24 +
    18 +
    traitRows * 38 +
    16 +
    analysisH +
    18 +
    18 +
    workLines.length * 22 +
    36 +
    PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = totalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("无法创建画布");
  }

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, totalHeight);
  ctx.fillStyle = "rgba(212, 115, 143, 0.05)";
  ctx.beginPath();
  ctx.arc(WIDTH * 0.88, PADDING + 40, 100, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = ROSE;
  ctx.font = `600 13px ${FONT}`;
  ctx.fillText("PERSONALITY ANALYZER", PADDING, PADDING + 4);

  ctx.fillStyle = INK;
  ctx.font = `600 30px "Noto Serif SC", "Songti SC", "SimSun", serif`;
  ctx.fillText("我的 ACG 偏好人格报告", PADDING, PADDING + 40);

  ctx.fillStyle = MUTED;
  ctx.font = `400 14px ${FONT}`;
  ctx.fillText("娱乐向分析 · 基于 Bangumi / 维基数据", PADDING, PADDING + 66);

  const blockY = PADDING + 84;
  const blockW = (contentWidth - 12) / 2;
  drawPersonalityBlock(ctx, PADDING, blockY, blockW, "主人格", result.primary_type);
  drawPersonalityBlock(ctx, PADDING + blockW + 12, blockY, blockW, "副人格", result.secondary_type);

  const vizY = blockY + 124;
  const vizW = (contentWidth - 12) / 2;

  drawSectionLabel(ctx, "偏好词云", PADDING, vizY - 6);
  drawSectionLabel(ctx, "维度偏好", PADDING + vizW + 12, vizY - 6);

  strokeDashedBox(ctx, PADDING, vizY, vizW, vizH, 12);
  strokeDashedBox(ctx, PADDING + vizW + 12, vizY, vizW, vizH, 12);

  await drawWordCloudSection(ctx, result, PADDING + 10, vizY + 10, vizW - 20, vizH - 20);

  drawRadarChart(
    ctx,
    PADDING + vizW + 12,
    vizY,
    vizW,
    vizH,
    result.dimensions || {},
    dimensionLabels,
    result.radar_keys,
  );

  let cursorY = vizY + vizH + 22;
  drawSectionLabel(ctx, "TRAITS", PADDING, cursorY);
  cursorY = drawTraits(ctx, PADDING, cursorY + 14, contentWidth, traits) + 12;

  strokeDashedBox(ctx, PADDING, cursorY, contentWidth, analysisH, 12);
  drawSectionLabel(ctx, "ANALYSIS", PADDING + 16, cursorY + 22);
  ctx.fillStyle = INK;
  ctx.font = `400 16px ${FONT}`;
  analysisLines.forEach((line, index) => {
    ctx.fillText(line, PADDING + 16, cursorY + 48 + index * 24);
  });

  cursorY += analysisH + 16;
  drawSectionLabel(ctx, "INPUT WORKS", PADDING, cursorY);
  ctx.fillStyle = ACCENT;
  ctx.font = `400 14px ${FONT}`;
  workLines.forEach((line, index) => {
    ctx.fillText(line, PADDING, cursorY + 20 + index * 22);
  });

  ctx.fillStyle = MUTED;
  ctx.font = `400 12px ${FONT}`;
  ctx.fillText("偏好分析仪 · 分享自同好社区", PADDING, totalHeight - PADDING + 4);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("报告图生成失败"));
      },
      "image/png",
      0.92,
    );
  });
}

export function downloadPersonalityReport(blob, filename = "acg-personality-report.png") {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

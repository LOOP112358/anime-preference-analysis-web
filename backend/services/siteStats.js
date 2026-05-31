import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const STATS_PATH = path.join(DATA_DIR, "site-stats.json");

function readStats() {
  if (!existsSync(STATS_PATH)) {
    return { page_views: 0, updated_at: null };
  }

  try {
    return JSON.parse(readFileSync(STATS_PATH, "utf8"));
  } catch {
    return { page_views: 0, updated_at: null };
  }
}

function writeStats(stats) {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2), "utf8");
}

export function getPageViews() {
  return Number(readStats().page_views) || 0;
}

export function incrementPageViews() {
  const stats = readStats();
  stats.page_views = getPageViews() + 1;
  stats.updated_at = new Date().toISOString();
  writeStats(stats);
  return stats.page_views;
}

import { appendFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const FEEDBACK_PATH = path.join(DATA_DIR, "feedback.jsonl");

export function saveFeedback({ message, nickname = "" }) {
  const entry = {
    message: String(message || "").trim(),
    nickname: String(nickname || "").trim(),
    created_at: new Date().toISOString(),
  };

  if (!entry.message) {
    throw new Error("反馈内容不能为空");
  }

  if (entry.message.length > 2000) {
    throw new Error("反馈内容过长（最多 2000 字）");
  }

  if (entry.nickname.length > 50) {
    throw new Error("昵称过长（最多 50 字）");
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  appendFileSync(FEEDBACK_PATH, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

import { appendFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const FEEDBACK_PATH = path.join(DATA_DIR, "feedback.jsonl");

export function saveFeedback({ message, contact = "" }) {
  const entry = {
    message: String(message || "").trim(),
    contact: String(contact || "").trim(),
    created_at: new Date().toISOString(),
  };

  if (!entry.message) {
    throw new Error("反馈内容不能为空");
  }

  if (entry.message.length > 2000) {
    throw new Error("反馈内容过长（最多 2000 字）");
  }

  if (entry.contact.length > 120) {
    throw new Error("联系方式过长");
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  appendFileSync(FEEDBACK_PATH, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

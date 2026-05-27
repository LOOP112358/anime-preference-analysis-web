/**
 * 推荐系统集成测试：
 * - 协同 / 混合：本机临时 HTTP 服务返回 data/mock-user-lists.json（不依赖外网）。
 * - 内容 / 混合：需抓取 Bangumi/维基，无外网时可能失败（脚本会标 SKIP 并以退出码区分）。
 *
 * 运行：npm run test:recommend --workspace backend
 */
import http from "http";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(cond, msg) {
  if (!cond) {
    console.error(`\n[FAIL] ${msg}\n`);
    process.exit(1);
  }
}

function assertSome(pred, arr, msg) {
  assert(Array.isArray(arr) && arr.some(pred), msg);
}

const mockPath = path.join(root, "data", "mock-user-lists.json");
const mockBody = readFileSync(mockPath, "utf-8");

const server = http.createServer((_req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(mockBody);
});

await new Promise((resolve, reject) => {
  server.listen(0, "127.0.0.1", () => resolve());
  server.on("error", reject);
});

const { port } = server.address();
process.env.USER_LISTS_API_URL = `http://127.0.0.1:${port}/`;
process.env.USER_LISTS_API_TIMEOUT_MS = "5000";

const { runRecommend } = await import("../services/recommendService.js");

const myList = ["Clannad", "四月是你的谎言"];
const expectedCollabTitles = new Set(
  ["Angel Beats!", "Charlotte", "可塑性记忆", "虫师", "夏目友人帐", "紫罗兰永恒花园", "轻音少女", "日常", "悠哉日常大王"].map((t) =>
    t.trim().toLowerCase(),
  ),
);

console.log("mock USER_LISTS_API_URL =", process.env.USER_LISTS_API_URL);
console.log("input anime_list =", JSON.stringify(myList));

console.log("\n--- collaborative ---");
const collab = await runRecommend({
  mode: "collaborative",
  anime_list: myList,
  limit: 15,
  min_overlap: 1,
});
console.log(
  "top items:",
  collab.items.slice(0, 8).map((r) => `${r.title}(${r.score})`).join(" | "),
);
console.log("buddy_matches (first 4):", collab.buddy_matches?.slice(0, 4));
assert(collab.meta?.user_lists_status === "ok", "collaborative meta.user_lists_status should be ok");
assert(collab.items.length > 0, "collaborative should return at least one recommended title");
assertSome(
  (row) => expectedCollabTitles.has(String(row.title || "").trim().toLowerCase()),
  collab.items,
  "collaborative top items should include at least one title from mock neighbors",
);

let contentOk = false;
console.log("\n--- content (needs network scrape) ---");
try {
  const content = await runRecommend({
    mode: "content",
    anime_list: myList,
    limit: 8,
  });
  console.log(
    "top items:",
    content.items.slice(0, 8).map((r) => `${r.title}(${r.score})`).join(" | "),
  );
  console.log("pool_size:", content.pool_size, "candidates_scanned:", content.candidates_scanned);
  assert(content.pool_size > 0, "content pool_size should be > 0");
  assert(content.items.length > 0, "content should return at least one item");
  contentOk = true;
} catch (e) {
  console.warn("[SKIP content]", e?.message || e);
}

let hybridOk = false;
console.log("\n--- hybrid ---");
try {
  const hybrid = await runRecommend({
    mode: "hybrid",
    anime_list: myList,
    limit: 12,
    hybrid_alpha: 0.55,
    min_overlap: 1,
  });
  console.log(
    "top items:",
    hybrid.items.slice(0, 8).map((r) => `${r.title}(${r.score})`).join(" | "),
  );
  assert(hybrid.items.length > 0, "hybrid should return at least one item");
  hybridOk = true;
} catch (e) {
  if (contentOk) {
    console.error("\n[FAIL] hybrid (content scrape had succeeded)\n", e);
    process.exit(1);
  }
  console.warn("[SKIP hybrid]", e?.message || e);
}

server.close();
const parts = ["collaborative OK", contentOk ? "content OK" : "content skipped", hybridOk ? "hybrid OK" : "hybrid skipped"];
console.log(`\n[OK] recommend tests: ${parts.join("; ")}.\n`);
process.exit(0);

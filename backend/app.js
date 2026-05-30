import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import analyzeRouter from "./routes/analyze.js";
import recommendRouter from "./routes/recommend.js";
import statsRouter from "./routes/stats.js";
import feedbackRouter from "./routes/feedback.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const allowedOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: "1mb" }));

if (process.env.RECOMMEND_DEV_FIXTURES === "1") {
  const mockUserListsPath = path.join(__dirname, "data", "mock-user-lists.json");
  app.get("/api/dev/mock-user-lists", (_req, res) => {
    if (!existsSync(mockUserListsPath)) {
      res.status(404).json({ success: false, message: "data/mock-user-lists.json not found" });
      return;
    }
    res.type("application/json").send(readFileSync(mockUserListsPath, "utf-8"));
  });
  console.log(
    "[dev] GET /api/dev/mock-user-lists → set USER_LISTS_API_URL=http://localhost:" +
      port +
      "/api/dev/mock-user-lists for collaborative/hybrid tests",
  );
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "acg-personality-analyzer-backend",
    message: "Use POST /api/analyze for analysis, POST /api/recommend for recommendations.",
  });
});

app.get("/health", (_req, res) => {
  const deployShaPath = path.join(__dirname, "..", "DEPLOYED_SHA");
  let deploy_sha = null;
  if (existsSync(deployShaPath)) {
    deploy_sha = readFileSync(deployShaPath, "utf-8").trim().slice(0, 7);
  }

  res.json({
    success: true,
    service: "acg-personality-analyzer-backend",
    timestamp: new Date().toISOString(),
    deploy_sha,
    dimension_count: 14,
  });
});

app.use("/api/analyze", analyzeRouter);
app.use("/api/recommend", recommendRouter);
app.use("/api/stats", statsRouter);
app.use("/api/feedback", feedbackRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

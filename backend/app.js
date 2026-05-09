import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import analyzeRouter from "./routes/analyze.js";

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

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "acg-personality-analyzer-backend",
    message: "Use POST /api/analyze for analysis requests.",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "acg-personality-analyzer-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/analyze", analyzeRouter);

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

import express from "express";
import { getPageViews, incrementPageViews } from "../services/siteStats.js";

const router = express.Router();

router.get("/visit", (_req, res) => {
  res.json({
    success: true,
    data: { page_views: getPageViews() },
  });
});

router.post("/visit", (_req, res) => {
  res.json({
    success: true,
    data: { page_views: incrementPageViews() },
  });
});

export default router;

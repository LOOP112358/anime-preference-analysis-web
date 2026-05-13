import express from "express";
import { runRecommend } from "../services/recommendService.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const data = await runRecommend(req.body || {});
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

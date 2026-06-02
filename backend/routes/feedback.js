import express from "express";
import { saveFeedback } from "../services/feedbackStore.js";

const router = express.Router();

router.post("/", (req, res, next) => {
  try {
    const entry = saveFeedback({
      message: req.body?.message,
      nickname: req.body?.nickname,
    });

    res.json({
      success: true,
      data: { created_at: entry.created_at },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

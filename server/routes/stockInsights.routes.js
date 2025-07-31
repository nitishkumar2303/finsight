import express from "express";
import {
  getStockInsightsController,
  getCacheStatusController,
  clearCacheController,
} from "../controllers/stockInsights.controller.js";
import { verifyLogin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Cache management routes (more specific routes first)
router.get("/cache/status", getCacheStatusController);
router.delete("/cache/clear/:ticker", clearCacheController);
router.delete("/cache/clear", clearCacheController);

// Get stock insights by ticker (generic route last)
router.get("/:ticker", getStockInsightsController); // Temporarily removed authentication for testing

export default router;

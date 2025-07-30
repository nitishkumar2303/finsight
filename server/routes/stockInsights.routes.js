import express from "express";
import {
  getStockInsightsController,
  getCacheStatusController,
  clearCacheController,
} from "../controllers/stockInsights.controller.js";
import { verifyLogin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get stock insights by ticker
router.get("/:ticker", getStockInsightsController); // Temporarily removed authentication for testing

// Cache management routes
router.get("/cache/status", getCacheStatusController);
router.delete("/cache/clear/:ticker", clearCacheController);
router.delete("/cache/clear", clearCacheController);

export default router;

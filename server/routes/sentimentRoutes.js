import express from "express";
import sentimentController from "../controllers/sentiment.controller.js";
import { verifyLogin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyLogin);

// Analyze sentiment for all news articles
router.post("/analyze", sentimentController.analyzeNewsSentiment);

// Analyze sentiment for a specific ticker
router.post("/analyze-ticker", sentimentController.analyzeTickerSentiment);

// Analyze sentiment for a single article
router.post("/analyze-article", sentimentController.analyzeArticleSentiment);

export default router;

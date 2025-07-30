import express from "express";
import {
  addHolding,
  getUserHoldings,
  getPortfolioInsights,
} from "../controllers/holding.controller.js";
import { verifyLogin } from "../middleware/auth.middleware.js"; // Importing the protect middleware
const router = express.Router();

router.post("/add", verifyLogin, addHolding);

router.get("/get", verifyLogin, getUserHoldings);

router.get("/insights", verifyLogin, getPortfolioInsights);

export default router; // ✅ default export

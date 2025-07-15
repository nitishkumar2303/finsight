import express from "express";
import { getNetWorthHistory } from "../controllers/portfolio.controller.js";
import { verifyLogin } from "../middleware/auth.middleware.js"; // Importing the protect middleware
const router = express.Router();

router.get("/history", getNetWorthHistory);
router.get("/net-worth-history", verifyLogin, getNetWorthHistory);

export default router; // ✅ default export

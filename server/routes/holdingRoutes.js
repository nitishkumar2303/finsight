import express from "express";
import { addHolding } from "../controllers/holding.controller.js";
import { getUserHoldings } from "../controllers/holding.controller.js";
import { verifyLogin } from "../middleware/auth.middleware.js"; // Importing the protect middleware
const router = express.Router();

router.post("/add", verifyLogin, addHolding);

router.get("/get", verifyLogin, getUserHoldings);

export default router; // ✅ default export

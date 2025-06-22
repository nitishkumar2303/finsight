import express from "express";
import { addHolding } from "../controllers/holding.controller.js";

const router = express.Router();

router.post("/add", addHolding);

export default router; // ✅ default export
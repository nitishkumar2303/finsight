import express from "express";
import { getLivePrice, getLastPrice } from "../controllers/stock.controller.js";
import { verifyLogin } from "../middleware/auth.middleware.js";
import { get } from "mongoose";

const router = express.Router();

router.get("/live-prices", verifyLogin, getLivePrice);
router.get("/last-price", verifyLogin, getLastPrice);

export default router;

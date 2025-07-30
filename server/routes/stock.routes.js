import express from "express";
import {
  getLivePrice,
  getLastPrice,
  triggerPriceUpdate,
  getCronStatus,
} from "../controllers/stock.controller.js";
import { verifyLogin } from "../middleware/auth.middleware.js";
import { get } from "mongoose";

const router = express.Router();

router.get("/live-prices", verifyLogin, getLivePrice);
router.get("/last-price", verifyLogin, getLastPrice);
router.post("/trigger-update", verifyLogin, triggerPriceUpdate);
router.get("/cron-status", verifyLogin, getCronStatus);

export default router;

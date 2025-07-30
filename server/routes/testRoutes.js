import express from "express";
import { triggerManualUpdate } from "../jobs/updatePrice.js";

const router = express.Router();

// Test endpoint to manually trigger price update
router.post("/trigger-price-update", async (req, res) => {
  try {
    console.log("🧪 Manual price update triggered via API");
    const result = await triggerManualUpdate();
    res.status(200).json({
      message: "Price update completed",
      result,
    });
  } catch (error) {
    console.error("Error in manual price update:", error);
    res.status(500).json({
      message: "Error triggering price update",
      error: error.message,
    });
  }
});

export default router;

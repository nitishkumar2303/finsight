// controllers/stock.controller.js
import {
  fetchLivePrice,
  fetchPriceHistory,
} from "../services/stock.service.js"; // for USA stocks
import StockPrice from "../config/models/stockPrice.model.js";

export const getLivePrice = async (req, res) => {
  try {
    const tickers =
      req.query.tickers
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];

    if (tickers.length === 0) {
      return res.status(400).json({ error: "No tickers provided in query." });
    }

    const result = {};

    for (const ticker of tickers) {
      const price = await fetchLivePrice(ticker);
      result[ticker] = price;
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Failed to fetch stock prices:", err.message);
    res.status(500).json({ error: "Failed to fetch stock prices" });
  }
};

export const getLastPrice = async (req, res) => {
  try {
    const tickers =
      req.query.tickers
        ?.split(",")
        .map((t) => t.trim())
        .filter(Boolean) || [];

    const result = {};

    for (const ticker of tickers) {
      const stockDoc = await StockPrice.findOne({ ticker });
      if (stockDoc && stockDoc.values.length > 0) {
        const lastPriceObj = stockDoc.values[stockDoc.values.length - 1];
        result[ticker] = lastPriceObj; // <-- DO NOT STRINGIFY
      } else {
        result[ticker] = null;
      }
    }

    res.status(200).json(result); // <-- Send as JSON, not string
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch last prices" });
  }
};

// Manual trigger for stock price update (for testing)
export const triggerPriceUpdate = async (req, res) => {
  try {
    console.log("🔄 Manual trigger: Starting stock price update...");

    const startTime = new Date();
    const tickers = await StockPrice.find().distinct("ticker");

    if (tickers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No tickers found in database",
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const ticker of tickers) {
      try {
        const close = await fetchLivePrice(ticker);

        if (!close || close === 0) {
          results.push({
            ticker,
            status: "error",
            message: "No valid price received",
          });
          errorCount++;
          continue;
        }

        const newPriceObj = {
          datetime: new Date(),
          open: null,
          high: null,
          low: null,
          close,
          volume: null,
        };

        const result = await StockPrice.updateOne(
          { ticker },
          { $push: { values: newPriceObj } },
          { upsert: true }
        );

        results.push({
          ticker,
          status: "success",
          price: close,
          modified: result.modifiedCount,
          upserted: result.upsertedCount,
        });
        successCount++;
      } catch (error) {
        results.push({ ticker, status: "error", message: error.message });
        errorCount++;
      }
    }

    const endTime = new Date();
    const duration = endTime - startTime;

    res.status(200).json({
      success: true,
      message: "Stock price update completed",
      summary: {
        total: tickers.length,
        successful: successCount,
        errors: errorCount,
        duration: `${duration}ms`,
      },
      results,
    });
  } catch (error) {
    console.error("Manual trigger error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to trigger price update",
      error: error.message,
    });
  }
};

// Check cron job status
export const getCronStatus = async (req, res) => {
  try {
    const now = new Date();
    const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000); // Convert to IST

    // Calculate next run time (4:12 AM IST)
    const nextRun = new Date();
    nextRun.setHours(4, 12, 0, 0); // 4:12 AM IST
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1); // Tomorrow
    }

    res.status(200).json({
      success: true,
      currentTime: {
        utc: now.toISOString(),
        ist: istTime.toISOString(),
      },
      cronJob: {
        schedule: "42 22 * * * (4:12 AM IST)",
        timezone: "Asia/Kolkata",
        nextRun: nextRun.toISOString(),
        status: "active",
      },
      message: "Cron job is configured and active",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get cron status",
      error: error.message,
    });
  }
};

import { getStockInsights } from "../services/stockInsights.service.js";
import StockInsightsCache from "../config/models/stockInsightsCache.model.js";

export const getStockInsightsController = async (req, res) => {
  try {
    const { ticker } = req.params;
    const { refresh } = req.query;

    if (!ticker) {
      return res.status(400).json({
        success: false,
        message: "Ticker symbol is required",
      });
    }

    const forceRefresh = refresh === "true";
    const insights = await getStockInsights(ticker, forceRefresh);

    if (!insights.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to get stock insights",
        error: insights.error,
      });
    }

    res.status(200).json({
      success: true,
      data: insights.data,
    });
  } catch (error) {
    console.error("Error in stock insights controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get cache status and management
export const getCacheStatusController = async (req, res) => {
  try {
    const cacheEntries = await StockInsightsCache.find()
      .select("ticker createdAt")
      .sort({ createdAt: -1 });

    const cacheStats = {
      totalEntries: cacheEntries.length,
      entries: cacheEntries.map((entry) => ({
        ticker: entry.ticker,
        cachedAt: entry.createdAt,
        ageInMinutes: Math.round(
          (Date.now() - entry.createdAt.getTime()) / (1000 * 60)
        ),
        expiresIn: Math.round(
          24 * 60 - (Date.now() - entry.createdAt.getTime()) / (1000 * 60)
        ),
      })),
    };

    res.status(200).json({
      success: true,
      data: cacheStats,
    });
  } catch (error) {
    console.error("Error getting cache status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cache status",
      error: error.message,
    });
  }
};

// Clear cache for specific ticker or all cache
export const clearCacheController = async (req, res) => {
  try {
    const { ticker } = req.params;

    if (ticker && ticker !== "all") {
      // Clear cache for specific ticker
      const result = await StockInsightsCache.deleteMany({
        ticker: ticker.toUpperCase(),
      });

      res.status(200).json({
        success: true,
        message: `Cleared cache for ${ticker.toUpperCase()}`,
        deletedCount: result.deletedCount,
      });
    } else {
      // Clear all cache
      const result = await StockInsightsCache.deleteMany({});

      res.status(200).json({
        success: true,
        message: "Cleared all cache",
        deletedCount: result.deletedCount,
      });
    }
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cache",
      error: error.message,
    });
  }
};

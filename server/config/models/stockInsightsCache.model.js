import mongoose from "mongoose";

const stockInsightsCacheSchema = new mongoose.Schema(
  {
    ticker: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    insights: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours in seconds (24 * 60 * 60)
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for efficient querying
stockInsightsCacheSchema.index({ ticker: 1, createdAt: -1 });

const StockInsightsCache = mongoose.model(
  "StockInsightsCache",
  stockInsightsCacheSchema
);

export default StockInsightsCache;

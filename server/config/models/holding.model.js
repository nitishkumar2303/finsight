import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0.01,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
    // Stock metadata from Yahoo Finance API
    stockMetadata: {
      companyName: {
        type: String,
        default: "",
      },
      sector: {
        type: String,
        default: "",
      },
      industry: {
        type: String,
        default: "",
      },
      marketCap: {
        type: Number,
        default: null,
      },
      marketCapCategory: {
        type: String,
        enum: ["Large Cap", "Mid Cap", "Small Cap", "Micro Cap", "Unknown"],
        default: "Unknown",
      },
      currency: {
        type: String,
        default: "USD",
      },
      exchange: {
        type: String,
        default: "",
      },
      // Financial metrics
      currentPrice: {
        type: Number,
        default: null,
      },
      targetMeanPrice: {
        type: Number,
        default: null,
      },
      recommendationKey: {
        type: String,
        default: "",
      },
      peRatio: {
        type: Number,
        default: null,
      },
      profitMargins: {
        type: Number,
        default: null,
      },
      returnOnEquity: {
        type: Number,
        default: null,
      },
      revenueGrowth: {
        type: Number,
        default: null,
      },
      earningsGrowth: {
        type: Number,
        default: null,
      },
      // Metadata timestamp
      metadataFetchedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

const Holding = mongoose.model("Holding", holdingSchema);
export default Holding;

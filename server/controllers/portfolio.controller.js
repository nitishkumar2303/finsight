import Holding from "../config/models/holding.model.js";
import StockPrice from "../config/models/stockPrice.model.js";
import mongoose from "mongoose";

export const getNetWorthHistory = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const range = req.query.range || "month";

    const now = new Date();
    const startDate = new Date();

    let groupKey;
    switch (range) {
      case "day":
        startDate.setDate(now.getDate() - 30);
        groupKey = (d) => d.toISOString().split("T")[0];
        break;
      case "week":
        startDate.setDate(now.getDate() - 90);
        groupKey = (d) => {
          const date = new Date(d);
          const startOfWeek = new Date(
            date.setDate(date.getDate() - date.getDay())
          );
          return startOfWeek.toISOString().split("T")[0];
        };
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 12);
        groupKey = (d) => {
          const date = new Date(d);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
        };
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 5);
        groupKey = (d) => new Date(d).getFullYear().toString();
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
        groupKey = (d) => d.toISOString().split("T")[0];
    }

    const holdings = await Holding.find({ userId });
    if (!holdings.length) return res.json([]);

    const tickers = holdings.map((h) => h.ticker);
    const quantities = Object.fromEntries(
      holdings.map((h) => [h.ticker, h.quantity])
    );

    // Fetch all price histories for user's tickers
    const priceDocs = await StockPrice.find({ ticker: { $in: tickers } });

    // Build a date-keyed map of ticker prices
    const grouped = {};

    for (const doc of priceDocs) {
      const ticker = doc.ticker;
      for (const value of doc.values) {
        const date = new Date(value.datetime);
        if (date < startDate || date > now) continue;
        const key = groupKey(date);
        if (!grouped[key]) grouped[key] = {};
        // Always use the latest price for the date (overwrite if exists)
        grouped[key][ticker] = value.close;
      }
    }

    // Calculate net worth for each date group
    const data = Object.entries(grouped).map(([key, tickersData]) => {
      let total = 0;
      for (const [ticker, price] of Object.entries(tickersData)) {
        const qty = quantities[ticker] || 0;
        total += price * qty;
      }
      return {
        date: key,
        value: parseFloat(total.toFixed(2)),
      };
    });

    // Sort by date ascending
    data.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(data);
  } catch (error) {
    console.error("Net worth error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

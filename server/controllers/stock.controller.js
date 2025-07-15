// controllers/stock.controller.js
import { fetchLivePrice } from "../services/stock.service.js"; // for USA stocks
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

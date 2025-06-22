import axios from "axios";
import Holding from "../config/models/holding.model.js";
import StockPrice from "../config/models/stockPrice.model.js";

export const updateStockPrices = async () => {
  try {
    const tickers = await Holding.distinct("ticker");

    for (const ticker of tickers) {
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`
      );

      const price = response.data.quoteResponse.result[0]?.regularMarketPrice;

      if (price) {
        await StockPrice.create({
          ticker,
          price,
          date: new Date()
        });
      }
    }

    console.log("✅ Stock prices updated.");
  } catch (err) {
    console.error("❌ Stock price update failed:", err.message);
  }
};
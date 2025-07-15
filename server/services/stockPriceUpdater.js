import axios from "axios";
import Holding from "../config/models/holding.model.js";
import StockPrice from "../config/models/stockPrice.model.js";

export const updateStockPrices = async () => {
  try {
    const tickers = await Holding.distinct("ticker");

    for (const ticker of tickers) {
      try {
        const response = await axios.get(
          `https://www.nseindia.com/api/quote-equity?symbol=${ticker}`,
          {
            headers: {
              "User-Agent": "Mozilla/5.0", // NSE blocks requests without this
              "Accept": "application/json",
              "Referer": "https://www.nseindia.com/"
            }
          }
        );

        const price = response.data.priceInfo?.lastPrice;

        if (price) {
          await StockPrice.findOneAndUpdate(
            { ticker },
            { price, date: new Date() },
            { upsert: true }
          );
        }
      } catch (err) {
        console.error(`❌ Failed for ${ticker}:`, err.message);
      }
    }

    console.log("✅ Stock prices updated from NSE.");
  } catch (err) {
    console.error("❌ Stock price update failed:", err.message);
  }
};
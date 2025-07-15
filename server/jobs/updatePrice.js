import cron from "node-cron";
import StockPrice from "../config/models/stockPrice.model.js";
import { fetchLivePrice } from "../services/stock.service.js";

// Run every day at 4pm US Eastern Time (use UTC if your server is UTC)
cron.schedule("0 21 * * *", async () => {
  console.log("🔄 Running daily stock price update...");

  const tickers = await StockPrice.find().distinct("ticker");
  for (const ticker of tickers) {
    // Fetch latest price details (you may want to fetch open/high/low/close/volume)
    const close = await fetchLivePrice(ticker);

    // Build new price object (add other fields if available)
    const newPriceObj = {
      datetime: new Date(), // or set to market close time
      open: null, // fill if available
      high: null,
      low: null,
      close,
      volume: null,
    };

    await StockPrice.updateOne(
      { ticker },
      { $push: { values: newPriceObj } },
      { upsert: true }
    );
  }
});

import cron from "node-cron";
import { updateStockPrices } from "../services/stockPriceUpdater.js";

// ⏰ Run every day at 9 PM (server time)
cron.schedule("0 21 * * *", async () => {
  console.log("🔄 Running daily stock price update...");
  await updateStockPrices();
});
import cron from "node-cron";
import StockPrice from "../config/models/stockPrice.model.js";
import Holding from "../config/models/holding.model.js";
import { fetchLivePrice } from "../services/stock.service.js";
import yahooFinanceService from "../services/yahooFinance.service.js";

// Schedule for 9:30 PM EST (after US market close at 4 PM EST)
// 9:30 PM EST = 2:30 AM UTC (next day) = 8:00 AM IST (next day)
// Cron format: "30 2 * * *" = 02:30 UTC
const CRON_SCHEDULE = "30 2 * * *";

console.log(
  `📅 Cron job scheduled for: ${CRON_SCHEDULE} (9:30 PM EST / 8:00 AM IST)`
);

cron.schedule(
  CRON_SCHEDULE,
  async () => {
    const startTime = new Date();
    console.log(
      `🔄 [${startTime.toISOString()}] Starting daily stock data update (prices + metadata)...`
    );

    try {
      // Get all unique tickers from holdings
      const uniqueTickers = await Holding.find().distinct("ticker");
      console.log(`📊 Found ${uniqueTickers.length} unique tickers to update`);

      if (uniqueTickers.length === 0) {
        console.log("⚠️ No tickers found in holdings. Skipping update.");
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const ticker of uniqueTickers) {
        try {
          console.log(`🔄 Updating data for ${ticker}...`);

          // Fetch latest metadata (includes current price)
          const metadata = await yahooFinanceService.getStockMetadata(ticker);

          if (!metadata.currentPrice || metadata.currentPrice === 0) {
            console.log(`⚠️ No valid price received for ${ticker}`);
            errorCount++;
            continue;
          }

          // Update price in StockPrice collection
          const newPriceObj = {
            datetime: new Date(),
            open: metadata.currentPrice, // Using current price as placeholder
            high: metadata.currentPrice,
            low: metadata.currentPrice,
            close: metadata.currentPrice,
            volume: 0, // Default volume
          };

          await StockPrice.updateOne(
            { ticker },
            { $push: { values: newPriceObj } },
            { upsert: true }
          );

          // Update all holdings with fresh metadata
          await Holding.updateMany(
            { ticker },
            {
              $set: {
                stockMetadata: metadata,
                "stockMetadata.lastUpdated": new Date(),
              },
            }
          );

          console.log(
            `✅ Updated ${ticker}: $${metadata.currentPrice} with metadata`
          );
          successCount++;
        } catch (error) {
          console.error(`❌ Error updating ${ticker}:`, error.message);
          errorCount++;
        }
      }

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log(`🎉 Stock price update completed!`);
      console.log(`📊 Summary:`);
      console.log(`   ✅ Successful: ${successCount}`);
      console.log(`   ❌ Errors: ${errorCount}`);
      console.log(`   ⏱️ Duration: ${duration}ms`);
      console.log(`   🕐 Started: ${startTime.toISOString()}`);
      console.log(`   🕐 Finished: ${endTime.toISOString()}`);
    } catch (error) {
      console.error(`💥 Fatal error in stock price update:`, error);
    }
  },
  {
    timezone: "Asia/Kolkata", // Set timezone to India
  }
);

// Also run a test job every hour for debugging
cron.schedule("0 * * * *", () => {
  console.log(
    `🕐 [${new Date().toISOString()}] Hourly check - Cron job is active`
  );
});

// Manual trigger function for testing (remove in production)
export const triggerManualUpdate = async () => {
  const startTime = new Date();
  console.log(
    `🔄 [${startTime.toISOString()}] Manual trigger - Starting stock data update...`
  );

  try {
    // Get all unique tickers from holdings
    const uniqueTickers = await Holding.find().distinct("ticker");
    console.log(`📊 Found ${uniqueTickers.length} unique tickers to update`);

    if (uniqueTickers.length === 0) {
      console.log("⚠️ No tickers found in holdings. Skipping update.");
      return { success: false, message: "No tickers found" };
    }

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const ticker of uniqueTickers) {
      try {
        console.log(`🔄 Updating data for ${ticker}...`);

        // Fetch latest metadata (includes current price)
        const metadata = await yahooFinanceService.getStockMetadata(ticker);

        if (!metadata.currentPrice || metadata.currentPrice === 0) {
          console.log(`⚠️ No valid price received for ${ticker}`);
          errorCount++;
          results.push({ ticker, status: "error", message: "No valid price" });
          continue;
        }

        // Update price in StockPrice collection
        const newPriceObj = {
          datetime: new Date(),
          open: metadata.currentPrice,
          high: metadata.currentPrice,
          low: metadata.currentPrice,
          close: metadata.currentPrice,
          volume: 0,
        };

        await StockPrice.updateOne(
          { ticker },
          { $push: { values: newPriceObj } },
          { upsert: true }
        );

        // Update all holdings with fresh metadata
        await Holding.updateMany(
          { ticker },
          {
            $set: {
              stockMetadata: metadata,
              "stockMetadata.lastUpdated": new Date(),
            },
          }
        );

        console.log(
          `✅ Updated ${ticker}: $${metadata.currentPrice} with metadata`
        );
        successCount++;
        results.push({
          ticker,
          status: "success",
          price: metadata.currentPrice,
          marketCap: metadata.marketCap,
          marketCapCategory: metadata.marketCapCategory,
        });
      } catch (error) {
        console.error(`❌ Error updating ${ticker}:`, error.message);
        errorCount++;
        results.push({ ticker, status: "error", message: error.message });
      }
    }

    const endTime = new Date();
    const duration = endTime - startTime;

    const summary = {
      success: true,
      successCount,
      errorCount,
      duration: duration + "ms",
      results,
    };

    console.log(`🎉 Manual stock price update completed!`);
    console.log(`📊 Summary:`, summary);

    return summary;
  } catch (error) {
    console.error(`💥 Fatal error in manual stock price update:`, error);
    return { success: false, message: error.message };
  }
};

console.log("✅ Cron jobs initialized successfully");

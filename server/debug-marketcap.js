// Quick test to debug market cap for one stock
import yahooFinanceService from "./services/yahooFinance.service.js";
import connectDB from "./config/db.js";

await connectDB();

try {
  console.log("Testing market cap fetch for AAPL...");
  const metadata = await yahooFinanceService.getStockMetadata("AAPL");
  console.log("\nFinal metadata:", {
    marketCap: metadata.marketCap,
    marketCapCategory: metadata.marketCapCategory,
    currentPrice: metadata.currentPrice,
  });
} catch (error) {
  console.error("Error:", error.message);
}

process.exit(0);

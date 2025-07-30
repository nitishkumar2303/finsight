// Test script to verify the caching system works
import yahooFinanceService from "./services/yahooFinance.service.js";
import StockPrice from "./config/models/stockPrice.model.js";
import connectDB from "./config/db.js";

// Connect to database
await connectDB();

console.log("🧪 Testing stock metadata caching system...");

// Test ticker
const testTicker = "AAPL";

try {
  console.log(`\n1. Testing fresh metadata fetch for ${testTicker}...`);
  const freshMetadata = await yahooFinanceService.getStockMetadata(testTicker);
  console.log("Fresh metadata:", {
    companyName: freshMetadata.companyName,
    currentPrice: freshMetadata.currentPrice,
    marketCap: freshMetadata.marketCap,
    marketCapCategory: freshMetadata.marketCapCategory,
    sector: freshMetadata.sector,
  });

  console.log(`\n2. Testing cached metadata fetch for ${testTicker}...`);
  const cachedMetadata = await yahooFinanceService.getCachedStockMetadata(
    testTicker
  );
  console.log("Cached metadata:", {
    companyName: cachedMetadata.companyName,
    currentPrice: cachedMetadata.currentPrice,
    fromCache: cachedMetadata.fromCache,
  });

  console.log(`\n3. Testing cached price for ${testTicker}...`);
  const cachedPrice = await yahooFinanceService.getCachedPrice(testTicker);
  console.log("Cached price:", cachedPrice);

  console.log("\n✅ All tests completed successfully!");
} catch (error) {
  console.error("❌ Test failed:", error.message);
}

process.exit(0);

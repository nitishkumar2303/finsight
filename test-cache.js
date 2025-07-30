// Test script to verify stock insights caching
import fetch from "node-fetch";

const API_BASE = "http://localhost:5050/api";

async function testCaching() {
  console.log("🧪 Testing Stock Insights Caching System\n");

  // Test 1: First request (should fetch from AI and cache)
  console.log(
    "📋 Test 1: First request for AAPL (should use cached data since we have it)"
  );
  try {
    const response1 = await fetch(`${API_BASE}/stock-insights/AAPL`);
    const data1 = await response1.json();

    if (data1.success) {
      console.log("✅ First request successful");
      console.log(
        `📊 Data source: ${data1.data.cached ? "Cache" : "Fresh AI"}`
      );
      if (data1.data.cached) {
        console.log(`⏰ Cache age: ${data1.data.cacheAge} minutes`);
      }
      if (data1.data.fallback) {
        console.log(`⚠️  Fallback data due to: ${data1.data.apiError}`);
      }
    } else {
      console.log("❌ First request failed:", data1.error);
    }
  } catch (error) {
    console.error("❌ Error in first request:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 2: Second request immediately (should use cache)
  console.log("📋 Test 2: Second request for AAPL (should use cache)");
  try {
    const response2 = await fetch(`${API_BASE}/stock-insights/AAPL`);
    const data2 = await response2.json();

    if (data2.success) {
      console.log("✅ Second request successful");
      console.log(
        `📊 Data source: ${data2.data.cached ? "Cache" : "Fresh AI"}`
      );
      if (data2.data.cached) {
        console.log(`⏰ Cache age: ${data2.data.cacheAge} minutes`);
      }
    } else {
      console.log("❌ Second request failed:", data2.error);
    }
  } catch (error) {
    console.error("❌ Error in second request:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 3: Force refresh
  console.log("📋 Test 3: Force refresh for AAPL (should bypass cache)");
  try {
    const response3 = await fetch(
      `${API_BASE}/stock-insights/AAPL?refresh=true`
    );
    const data3 = await response3.json();

    if (data3.success) {
      console.log("✅ Force refresh successful");
      console.log(
        `📊 Data source: ${data3.data.cached ? "Cache" : "Fresh AI"}`
      );
      if (data3.data.fresh) {
        console.log("🆕 Fresh AI data retrieved");
      }
    } else {
      console.log("❌ Force refresh failed:", data3.error);
      console.log("ℹ️  This might be expected if AI API is overloaded");
    }
  } catch (error) {
    console.error("❌ Error in force refresh:", error.message);
  }

  console.log("\n" + "=".repeat(50) + "\n");

  // Test 4: Check cache status
  console.log("📋 Test 4: Check cache status");
  try {
    const response4 = await fetch(`${API_BASE}/stock-insights/cache/status`);
    const data4 = await response4.json();

    if (data4.success) {
      console.log("✅ Cache status retrieved");
      console.log(`📊 Total cache entries: ${data4.data.totalEntries}`);
      data4.data.entries.forEach((entry) => {
        console.log(
          `   ${entry.ticker}: cached ${entry.ageInMinutes} min ago, expires in ${entry.expiresIn} min`
        );
      });
    } else {
      console.log("❌ Cache status failed:", data4.error);
    }
  } catch (error) {
    console.error("❌ Error getting cache status:", error.message);
  }

  console.log("\n🏁 Testing completed!\n");
}

// Run the test
testCaching();

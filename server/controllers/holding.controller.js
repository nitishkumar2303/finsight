import { createHolding } from "../services/holding.service.js";
import { getHoldings } from "../services/holding.service.js";
import { fetchPriceHistory } from "../services/stock.service.js";
import StockPrice from "../config/models/stockPrice.model.js";
import yahooFinanceService from "../services/yahooFinance.service.js";

// Add this function to save price history
const savePriceHistory = async (ticker, priceHistory) => {
  await StockPrice.updateOne(
    { ticker },
    { $set: { values: priceHistory } },
    { upsert: true }
  );
};

export const addHolding = async (req, res) => {
  try {
    const { ticker, quantity, purchasePrice, purchaseDate, notes } = req.body;
    const userId = req.user._id; // Assuming user ID is available in req.user

    if (!ticker || !quantity || !purchasePrice) {
      return res.status(400).json({
        message: "Ticker, quantity, and purchase price are required.",
      });
    }

    const existingHoldings = await getHoldings(userId);
    const existingHolding = existingHoldings.find(
      (h) => h.ticker.toUpperCase() === ticker.toUpperCase()
    );

    // For new holdings, fetch full metadata; for existing, use cached price only
    let stockMetadata = {};
    try {
      if (existingHolding) {
        // For existing holdings, use cached data to avoid API calls
        stockMetadata = await yahooFinanceService.getCachedStockMetadata(
          ticker
        );
        console.log("Using cached stock metadata:", stockMetadata);
      } else {
        // For new holdings, fetch full metadata once
        stockMetadata = await yahooFinanceService.getStockMetadata(ticker);
        console.log("Fetched fresh stock metadata:", stockMetadata);
      }
    } catch (error) {
      console.error("Error fetching stock metadata:", error.message);
      // Continue with empty metadata if API fails
      stockMetadata = yahooFinanceService.getDefaultMetadata(ticker);
    }

    if (existingHolding) {
      // Ensure quantity is treated as a number
      const prevQuantity = Number(existingHolding.quantity);
      const addQuantity = Number(quantity);
      const totalQuantity = prevQuantity + addQuantity;
      const avgPrice =
        (existingHolding.purchasePrice * prevQuantity +
          purchasePrice * addQuantity) /
        totalQuantity;

      // Update the existing holding with new metadata
      await existingHolding.updateOne({
        $set: {
          quantity: totalQuantity,
          purchasePrice: avgPrice,
          purchaseDate,
          notes,
          stockMetadata, // Update metadata
        },
      });

      return res.status(200).json({
        message: "Holding updated successfully",
        ticker,
        quantity: totalQuantity,
        avgPrice,
        stockMetadata,
      });
    }

    // Fetch 100-day price history from Yahoo API
    const priceHistory = await fetchPriceHistory(ticker);
    // console.log("Price history fetched:", priceHistory);

    if (priceHistory && priceHistory.length > 0) {
      await savePriceHistory(ticker, priceHistory);
    }

    const holding = await createHolding({
      userId,
      ticker,
      quantity: Number(quantity),
      purchasePrice,
      purchaseDate,
      notes,
      stockMetadata, // Include metadata
    });

    res.status(201).json({
      message: "Holding added successfully",
      holding,
      stockMetadata,
    });
  } catch (error) {
    console.error("Error adding holding:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getUserHoldings = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user ID is available in req.user

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const holdings = await getHoldings(userId);
    // console.log(holdings);

    // Always return holdings array, even if empty
    res.status(200).json(holdings);
  } catch (error) {
    console.error("Error fetching holdings:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getPortfolioInsights = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const holdings = await getHoldings(userId);

    if (!holdings || holdings.length === 0) {
      // Return empty insights structure for empty portfolio
      const emptyInsights = {
        sectorAllocation: {},
        marketCapAllocation: {},
        recommendationDistribution: {},
        topPerformers: [],
        riskMetrics: {
          averagePE: 0,
          averageROE: 0,
          diversificationScore: 0,
        },
        totalValue: 0,
        totalInvested: 0,
      };
      return res.status(200).json(emptyInsights);
    }

    // Calculate portfolio insights
    const insights = {
      sectorAllocation: {},
      marketCapAllocation: {},
      recommendationDistribution: {},
      topPerformers: [],
      riskMetrics: {
        averagePE: 0,
        averageROE: 0,
        diversificationScore: 0,
      },
      totalValue: 0,
      totalInvested: 0,
    };

    let totalValue = 0;
    let totalInvested = 0;
    let peSum = 0;
    let roeSum = 0;
    let peCount = 0;
    let roeCount = 0;

    holdings.forEach((holding) => {
      const currentValue =
        (holding.livePrice || holding.purchasePrice) * holding.quantity;
      const investedValue = holding.purchasePrice * holding.quantity;

      totalValue += currentValue;
      totalInvested += investedValue;

      const metadata = holding.stockMetadata;
      if (metadata) {
        // Sector allocation
        const sector = metadata.sector || "Unknown";
        insights.sectorAllocation[sector] =
          (insights.sectorAllocation[sector] || 0) + currentValue;

        // Market cap allocation
        const marketCap = metadata.marketCapCategory || "Unknown";
        insights.marketCapAllocation[marketCap] =
          (insights.marketCapAllocation[marketCap] || 0) + currentValue;

        // Recommendation distribution
        const recommendation = metadata.recommendationKey || "Unknown";
        insights.recommendationDistribution[recommendation] =
          (insights.recommendationDistribution[recommendation] || 0) + 1;

        // PE and ROE calculations
        if (metadata.peRatio && metadata.peRatio > 0) {
          peSum += metadata.peRatio * currentValue;
          peCount += currentValue;
        }
        if (metadata.returnOnEquity && metadata.returnOnEquity > 0) {
          roeSum += metadata.returnOnEquity * currentValue;
          roeCount += currentValue;
        }
      }

      // Add to top performers list
      const profitLoss = currentValue - investedValue;
      const percentReturn =
        investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

      insights.topPerformers.push({
        ticker: holding.ticker,
        companyName: metadata?.companyName || holding.ticker,
        sector: metadata?.sector || "Unknown",
        marketCapCategory: metadata?.marketCapCategory || "Unknown",
        currentValue,
        investedValue,
        profitLoss,
        percentReturn,
        recommendation: metadata?.recommendationKey || "Unknown",
      });
    });

    // Sort top performers by percentage return
    insights.topPerformers.sort((a, b) => b.percentReturn - a.percentReturn);

    // Calculate weighted averages
    insights.riskMetrics.averagePE = peCount > 0 ? peSum / peCount : 0;
    insights.riskMetrics.averageROE = roeCount > 0 ? roeSum / roeCount : 0;

    // Calculate diversification score (simple metric based on number of sectors)
    const numberOfSectors = Object.keys(insights.sectorAllocation).length;
    insights.riskMetrics.diversificationScore =
      Math.min(numberOfSectors / 5, 1) * 100; // Max score of 100 for 5+ sectors

    insights.totalValue = totalValue;
    insights.totalInvested = totalInvested;

    // Convert absolute values to percentages for allocations
    Object.keys(insights.sectorAllocation).forEach((sector) => {
      insights.sectorAllocation[sector] = {
        value: insights.sectorAllocation[sector],
        percentage:
          totalValue > 0
            ? (insights.sectorAllocation[sector] / totalValue) * 100
            : 0,
      };
    });

    Object.keys(insights.marketCapAllocation).forEach((cap) => {
      insights.marketCapAllocation[cap] = {
        value: insights.marketCapAllocation[cap],
        percentage:
          totalValue > 0
            ? (insights.marketCapAllocation[cap] / totalValue) * 100
            : 0,
      };
    });

    res.status(200).json(insights);
  } catch (error) {
    console.error("Error fetching portfolio insights:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

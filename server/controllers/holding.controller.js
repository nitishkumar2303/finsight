import { createHolding } from "../services/holding.service.js";
import { getHoldings } from "../services/holding.service.js";
import { fetchPriceHistory } from "../services/stock.service.js";
import StockPrice from "../config/models/stockPrice.model.js";

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

    // console.log("Existing holding:", existingHolding);

    if (existingHolding) {
      // Ensure quantity is treated as a number
      const prevQuantity = Number(existingHolding.quantity);
      const addQuantity = Number(quantity);
      const totalQuantity = prevQuantity + addQuantity;
      const avgPrice =
        (existingHolding.purchasePrice * prevQuantity +
          purchasePrice * addQuantity) /
        totalQuantity;

      // Update the existing holding instead of creating a new one
      await existingHolding.updateOne({
        $set: {
          quantity: totalQuantity,
          purchasePrice: avgPrice,
          purchaseDate,
          notes,
        },
      });

      return res
        .status(200)
        .json({ message: "Holding updated successfully", ticker, quantity: totalQuantity, avgPrice });
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
    });

    res.status(201).json({ message: "Holding added successfully", holding });
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

    if (!holdings || holdings.length === 0) {
      return res
        .status(404)
        .json({ message: "No holdings found for this user" });
    }

    res.status(200).json(holdings);
  } catch (error) {
    console.error("Error fetching holdings:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

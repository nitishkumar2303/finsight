import Holding from "../config/models/holding.model.js";

export const createHolding = async ({
  userId,
  ticker,
  quantity,
  purchasePrice,
  purchaseDate,
  notes,
  stockMetadata,
}) => {
  try {
    if (!ticker || !quantity || !purchasePrice) {
      throw new Error("Ticker, quantity, and purchase price are required.");
    }

    const holding = new Holding({
      userId: userId,
      ticker: ticker.toUpperCase(),
      quantity,
      purchasePrice,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      notes: notes || "",
      stockMetadata: stockMetadata || {},
    });

    await holding.save();
    return { message: "Holding added successfully", holding };
  } catch (error) {
    console.error("Error creating holding:", error);
    throw new Error(error.message || "Internal server error");
  }
};

export const getHoldings = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required.");
    }

    const holdings = await Holding.find({ userId });
    // console.log("Holdings fetched:", holdings);

    // Return empty array instead of throwing error for no holdings
    return holdings || [];
  } catch (error) {
    console.error("Error fetching holdings:", error);
    throw new Error(error.message || "Internal server error");
  }
};

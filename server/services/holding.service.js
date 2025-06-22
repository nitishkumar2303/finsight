import Holding from "../config/models/holding.model.js";

export const createHolding = async ({userId , ticker , quantity, purchasePrice, purchaseDate, notes}) => {
  try {
    if (!ticker || !quantity || !purchasePrice) {
      throw new Error("Ticker, quantity, and purchase price are required.");
    }

    const holding = new Holding({
      userId: userIs,
      ticker: ticker.toUpperCase(),
      quantity,
      purchasePrice,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      notes: notes || "",
    });

    await holding.save();
    return { message: "Holding added successfully", holding };
  } catch (error) {
    console.error("Error creating holding:", error);
    throw new Error(error.message || "Internal server error");
  }
}
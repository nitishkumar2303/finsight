import { createHolding } from "../services/holding.service.js";

export const addHolding = async (req, res) => {
  try {
    const { ticker, quantity, purchasePrice, purchaseDate, notes } = req.body;
    const userId = req.user._id; // Assuming user ID is available in req.user

    if (!ticker || !quantity || !purchasePrice) {
      return res
        .status(400)
        .json({
          message: "Ticker, quantity, and purchase price are required.",
        });
    }

    const holding = await createHolding({
      userId,
      ticker,
      quantity,
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

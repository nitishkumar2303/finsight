import Holding from "../config/models/holding.model.js";
import mongoose from "mongoose";

export const getNetWorthHistory = async (req, res) => {
  try {
    const userId = req.user._id;
     const holdings1 = await Holding.find({ userId });
     console.log("Holdings:", holdings1);
     

    const holdings = [
      {
        userId,
        ticker: "AAPL",
        quantity: 10,
        purchasePrice: 150,
        purchaseDate: new Date("2024-07-01"),
      },
      {
        userId,
        ticker: "TSLA",
        quantity: 5,
        purchasePrice: 700,
        purchaseDate: new Date("2024-06-15"),
      },
      {
        userId,
        ticker: "MSFT",
        quantity: 12,
        purchasePrice: 300,
        purchaseDate: new Date("2024-05-10"),
      },
    ];

    const stockPrices = [
      { ticker: "AAPL", price: 155, date: new Date("2024-06-22") },
      { ticker: "AAPL", price: 160, date: new Date("2024-06-23") },
      { ticker: "TSLA", price: 710, date: new Date("2024-06-22") },
      { ticker: "MSFT", price: 310, date: new Date("2024-06-23") },
    ];

    const grouped = {};

    for (const holding of holdings) {
      const pricesForTicker = stockPrices.filter(
        (p) => p.ticker === holding.ticker
      );

      for (const priceEntry of pricesForTicker) {
        const dateKey = priceEntry.date.toISOString().split("T")[0];

        if (!grouped[dateKey]) grouped[dateKey] = 0;

        grouped[dateKey] += holding.quantity * priceEntry.price;
      }
    }

    const data = Object.entries(grouped).map(([date, value]) => ({
      date,
      value: parseFloat(value.toFixed(2)),
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

import mongoose from "mongoose";

const priceValueSchema = new mongoose.Schema(
  {
    datetime: { type: Date, required: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, required: true },
  },
  { _id: false }
);

const stockPriceSchema = new mongoose.Schema({
  ticker: { type: String, required: true, trim: true, index: true },
  values: [priceValueSchema], // Array of daily price objects
});

const StockPrice = mongoose.model("StockPrice", stockPriceSchema);
export default StockPrice;

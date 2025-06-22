import mongoose from "mongoose";

const stockPriceSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});


const StockPrice = mongoose.model("StockPrice", stockPriceSchema);
export default StockPrice;

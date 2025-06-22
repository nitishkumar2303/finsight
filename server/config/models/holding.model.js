import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ticker: {
      type: String,
      required: true,
      uppercase: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0.01
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { timestamps: true } // ✅ this should be outside the fields
);

const Holding = mongoose.model('Holding', holdingSchema);
export default Holding;
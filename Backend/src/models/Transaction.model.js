import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      default: "Other",
    },
    source: {
      type: String,
      enum: ["manual", "bank_statement"],
      default: "bank_statement",
    },
  },
  { timestamps: true }
);

/**
 * Prevent duplicate transactions
 */
transactionSchema.index(
  { date: 1, description: 1, amount: 1 },
  { unique: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
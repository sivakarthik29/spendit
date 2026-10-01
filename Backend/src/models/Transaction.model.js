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
    // Not restricted with a schema enum on purpose — categories are
    // validated and normalized in transaction.service.js before a
    // transaction ever reaches this model, so bad values are handled
    // in application code instead of failing a DB write.
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

// Prevents the same statement from being inserted twice if a user
// uploads it (or an overlapping statement) more than once.
transactionSchema.index(
  { date: 1, description: 1, amount: 1 },
  { unique: true }
);

export default mongoose.model("Transaction", transactionSchema);

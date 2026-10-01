import mongoose from "mongoose";

const insightSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Insight", insightSchema);

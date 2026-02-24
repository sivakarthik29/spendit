import mongoose from "mongoose";

const insightsSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Insights = mongoose.model("Insights", insightsSchema);

export default Insights;
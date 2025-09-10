// server/src/models/FinanceEntry.js
import mongoose from "mongoose";

const FinanceEntrySchema = new mongoose.Schema({
  academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: "General" },
  date: { type: Date, default: Date.now },
  note: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("FinanceEntry", FinanceEntrySchema);

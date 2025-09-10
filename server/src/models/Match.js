// server/src/models/Match.js
import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema(
  {
    academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true },
    opponent: { type: mongoose.Schema.Types.ObjectId, ref: "Academy" },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    ageGroup: { type: String, required: true },
    phone: { type: String },
    duration: { type: String },
    description: { type: String, default: "Friendly match" },

    // ✅ Merge into one datetime
    dateTime: { type: Date, required: true },

    homeAway: { type: String, enum: ["home", "away"], required: true },

    locationDescription: { type: String },
    locationGeo: {
      lat: Number,
      lng: Number,
    },

    status: {
      type: String,
      enum: ["requested", "confirmed", "finished", "rejected"],
      default: "requested",
    },

  },
  { timestamps: true }
);

export default mongoose.model("Match", MatchSchema);

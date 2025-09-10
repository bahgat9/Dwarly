// server/src/models/PlayerRequest.js
import mongoose from "mongoose";

const PlayerRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true },

    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    academyName: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    message: { type: String, trim: true }, // optional user note

    age: { type: Number, required: false },
    position: { type: String, required: false },

    expireAt: { type: Date }, // For TTL index on rejected requests

  },
  { timestamps: true }
)

// Optional: Prevent duplicate pending requests
PlayerRequestSchema.index(
  { user: 1, academy: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
)

// TTL index for auto-deleting rejected requests after 15 minutes
PlayerRequestSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model("PlayerRequest", PlayerRequestSchema)

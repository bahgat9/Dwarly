// server/src/models/Player.js
import mongoose from "mongoose";

const PlayerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number },
    position: { type: String },
    avatar: { type: String }, // Cloudinary URL
    academy: { type: mongoose.Schema.Types.ObjectId, ref: "Academy", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Player", PlayerSchema);

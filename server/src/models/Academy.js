// server/src/models/Academy.js
import mongoose from "mongoose";

const TrainingTimeSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },   // e.g. "Monday"
    time: { type: String, required: true },  // e.g. "5:00 PM - 7:00 PM"
  },
  { _id: false }
);

// Each academy can have one or more branches (locations)
const BranchSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Main Branch" },
    // Textual address/description
    locationDescription: { type: String, default: "" },
    // Coordinates for maps
    locationGeo: {
      lat: { type: Number },
      lng: { type: Number },
    },
    phone: { type: String },
    trainingTimes: [TrainingTimeSchema],
    // Optional flag to indicate default branch used for previews
    isMain: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AcademySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameAr: { type: String },

    // Location description (text address)
    locationDescription: { type: String, default: "" },
    
    // Location coordinates (for maps)
    locationGeo: {
      lat: { type: Number },
      lng: { type: Number }
    },

    phone: { type: String },
    rating: { type: Number, default: 0 },

    // Multi-select ages (from dropdown)
    ages: [{ type: String }], // e.g. ["2005", "2006", "2007"]

    verified: { type: Boolean, default: false },
    offersGirls: { type: Boolean, default: false },
    offersBoys: { type: Boolean, default: false },

    subscriptionPrice: { type: Number, default: 0 },

    trainingTimes: [TrainingTimeSchema],

    // New: branches (at least one). For backward compatibility, existing fields above
    // represent the historical single-branch data. New UIs should prefer `branches`.
    branches: { type: [BranchSchema], default: [] },

    // 🔹 Store Cloudinary URL instead of Base64
    logo: { type: String }, // e.g. "https://res.cloudinary.com/xxx/image/upload/v12345/academy.png"
  },
  { timestamps: true }
);

export default mongoose.model("Academy", AcademySchema);

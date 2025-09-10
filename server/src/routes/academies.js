import express from "express";
import multer from "multer";
import Academy from "../models/Academy.js";
import { auth, requireRole } from "../middleware/auth.js";
import cloudinary from "../utils/cloudinary.js";
import academyPlayers from "./academyPlayers.js";
import academyMatches from "./academyMatches.js";
import academyRequests from "./academyRequests.js";
import academyAnalytics from "./academyAnalytics.js";
import academyFinance from "./academyFinance.js";

// 🔒 Helper: async error wrapper
function safeHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

const router = express.Router();

// 📂 Multer memory storage (buffer upload)
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Safe JSON.parse wrapper
function safeJSONParse(value) {
  if (!value) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/* ------------------ Routes ------------------ */

/**
 * 📌 List all academies (paginated, public)
 */
router.get(
  "/",
  safeHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Academy.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Academy.countDocuments(),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  })
);

/**
 * 📌 Create new academy (admin only, with optional logo file)
 */
router.post(
  "/",
  auth(),
  requireRole("admin"),
  upload.single("logo"),
  safeHandler(async (req, res) => {
    let logoUrl = null;

    // If file was uploaded → upload to Cloudinary
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "academies/logos",
      });
      logoUrl = result.secure_url;
    }

    const b = req.body;
    const academy = await Academy.create({
      name: b.name,
      nameAr: b.nameAr,
      locationDescription: b.locationDescription || "",
      locationGeo: safeJSONParse(b.locationGeo),
      phone: b.phone || "",
      rating: Number(b.rating) || 0,
      verified: !!b.verified,
      offersGirls: !!b.offersGirls,
      offersBoys: !!b.offersBoys,
      subscriptionPrice: Number(b.subscriptionPrice) || 0,
      ages: safeJSONParse(b.ages) || [],
      trainingTimes: safeJSONParse(b.trainingTimes) || [],
      logo: logoUrl,
    });

    res.status(201).json({ success: true, data: academy });
  })
);

/**
 * 📌 Update academy (admin only)
 */
router.patch(
  "/:id",
  auth(),
  requireRole("admin"),
  upload.single("logo"),
  safeHandler(async (req, res) => {
    let logoUrl = req.body.logo || null;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataUri = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: "academies/logos",
      });
      logoUrl = result.secure_url;
    }

    const b = req.body;
    const academy = await Academy.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: b.name,
          nameAr: b.nameAr,
          locationDescription: b.locationDescription || "",
          locationGeo: safeJSONParse(b.locationGeo),
          phone: b.phone || "",
          rating: Number(b.rating) || 0,
          verified: !!b.verified,
          offersGirls: !!b.offersGirls,
          offersBoys: !!b.offersBoys,
          subscriptionPrice: Number(b.subscriptionPrice) || 0,
          ages: safeJSONParse(b.ages) || [],
          trainingTimes: safeJSONParse(b.trainingTimes) || [],
          logo: logoUrl,
        },
      },
      { new: true }
    );

    if (!academy) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    res.json({ success: true, data: academy });
  })
);

/**
 * 📌 Delete academy (admin only)
 */
router.delete(
  "/:id",
  auth(),
  requireRole("admin"),
  safeHandler(async (req, res) => {
    const deleted = await Academy.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    res.json({ success: true, message: "Academy deleted successfully" });
  })
);

// Mount subrouters
router.use('/:academyId/players', academyPlayers);
router.use('/:academyId/matches', academyMatches);
router.use('/:academyId/requests', academyRequests);
router.use('/:academyId/analytics', academyAnalytics);
router.use('/:academyId/finance', academyFinance);

export default router;

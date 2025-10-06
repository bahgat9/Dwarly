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
 * 📌 Get single academy by id (public)
 */
router.get(
  "/:id",
  safeHandler(async (req, res) => {
    const academy = await Academy.findById(req.params.id)
    if (!academy) return res.status(404).json({ success: false, error: "Not found" })
    res.json({ success: true, data: academy })
  })
)

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
      // Initialize branches: if branch info provided, seed; else seed from top-level fields
      branches: (() => {
        const provided = safeJSONParse(b.branches)
        if (Array.isArray(provided) && provided.length) return provided
        // Seed a single main branch from top-level location/phone/trainingTimes
        const geo = safeJSONParse(b.locationGeo)
        const times = safeJSONParse(b.trainingTimes) || []
        return [
          {
            name: "Main Branch",
            isMain: true,
            locationDescription: b.locationDescription || "",
            locationGeo: geo || undefined,
            phone: b.phone || "",
            trainingTimes: times,
          },
        ]
      })(),
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
          // Accept full replacement of branches if provided
          ...(b.branches ? { branches: safeJSONParse(b.branches) || [] } : {}),
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

/**
 * 📌 Add a branch to an academy (admin)
 */
router.post(
  "/:id/branches",
  auth(),
  requireRole("admin"),
  safeHandler(async (req, res) => {
    const b = req.body
    console.log("Creating branch for academy:", req.params.id)
    console.log("Branch data received:", b)
    const update = {
      name: b.name || "Branch",
      nameAr: b.nameAr || "",
      isMain: !!b.isMain,
      locationDescription: b.locationDescription || "",
      locationGeo: safeJSONParse(b.locationGeo),
      phone: b.phone || "",
      contact: b.contact || "",
      description: b.description || "",
      rating: Number(b.rating) || 4,
      verified: !!b.verified,
      offersGirls: !!b.offersGirls,
      offersBoys: !!b.offersBoys,
      subscriptionPrice: Number(b.subscriptionPrice) || 0,
      trainingTimes: safeJSONParse(b.trainingTimes) || [],
      ages: safeJSONParse(b.ages) || [],
    }
    const academy = await Academy.findByIdAndUpdate(
      req.params.id,
      { $push: { branches: update } },
      { new: true }
    )
    if (!academy) return res.status(404).json({ success: false, error: "Not found" })
    // If setting isMain, unset others
    if (update.isMain) {
      academy.branches = academy.branches.map((br, idx) => {
        if (idx === academy.branches.length - 1) return { ...br.toObject?.() || br, isMain: true }
        return { ...br.toObject?.() || br, isMain: false }
      })
      await academy.save()
    }
    console.log("Academy after branch creation:", academy.branches)
    res.status(201).json({ success: true, data: academy })
  })
)

/**
 * 📌 Update a branch by index (admin)
 */
router.patch(
  "/:id/branches/:index",
  auth(),
  requireRole("admin"),
  safeHandler(async (req, res) => {
    const academy = await Academy.findById(req.params.id)
    if (!academy) return res.status(404).json({ success: false, error: "Not found" })
    const idx = Number(req.params.index)
    if (Number.isNaN(idx) || idx < 0 || idx >= academy.branches.length) {
      return res.status(400).json({ success: false, error: "Invalid branch index" })
    }
    const b = req.body
    const branch = academy.branches[idx]
    if (b.name !== undefined) branch.name = b.name
    if (b.locationDescription !== undefined) branch.locationDescription = b.locationDescription
    if (b.locationGeo !== undefined) branch.locationGeo = safeJSONParse(b.locationGeo)
    if (b.phone !== undefined) branch.phone = b.phone
    if (b.trainingTimes !== undefined) branch.trainingTimes = safeJSONParse(b.trainingTimes) || []
    if (b.isMain !== undefined) branch.isMain = !!b.isMain
    if (branch.isMain) {
      academy.branches = academy.branches.map((br, i) => ({ ...br.toObject?.() || br, isMain: i === idx }))
    }
    await academy.save()
    res.json({ success: true, data: academy })
  })
)

/**
 * 📌 Delete a branch by index (admin)
 */
router.delete(
  "/:id/branches/:index",
  auth(),
  requireRole("admin"),
  safeHandler(async (req, res) => {
    const academy = await Academy.findById(req.params.id)
    if (!academy) return res.status(404).json({ success: false, error: "Not found" })
    const idx = Number(req.params.index)
    if (Number.isNaN(idx) || idx < 0 || idx >= academy.branches.length) {
      return res.status(400).json({ success: false, error: "Invalid branch index" })
    }
    academy.branches.splice(idx, 1)
    await academy.save()
    res.json({ success: true, data: academy })
  })
)

// Mount subrouters
router.use('/:academyId/players', academyPlayers);
router.use('/:academyId/matches', academyMatches);
router.use('/:academyId/requests', academyRequests);
router.use('/:academyId/analytics', academyAnalytics);
router.use('/:academyId/finance', academyFinance);

export default router;

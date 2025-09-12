// routes/admin.js
import express from "express";
import { auth, requireRole } from "../middleware/auth.js";
import User from "../models/User.js";
import Academy from "../models/Academy.js";
import Match from "../models/Match.js";
import PlayerRequest from "../models/PlayerRequest.js";

/**
 * Utility wrapper for async routes
 */
function safeHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error("❌ Admin route error:", err);
      res.status(500).json({ success: false, error: "Server error" });
    });
  };
}

/**
 * Pagination + sorting helper
 */
async function paginate(modelQuery, req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);

  let query = modelQuery;
  if (req.query.sort) {
    query = query.sort(req.query.sort);
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    query.skip(skip).limit(limit),
    modelQuery.model.countDocuments(modelQuery.getFilter()),
  ]);

  return {
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

const router = express.Router();

// Middleware: only admin
router.use(auth(), requireRole("admin"));

/**
 * Dashboard stats
 */
router.get(
  "/stats",
  safeHandler(async (_req, res) => {
    // Prevent caching to ensure fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const [users, academies, matches, requests] = await Promise.all([
      User.countDocuments(),
      Academy.countDocuments(),
      Match.countDocuments(),
      PlayerRequest.countDocuments(),
    ]);

    res.json({
      success: true,
      data: { users, academies, matches, playerRequests: requests },
    });
  })
);

/**
 * List all users (paginated + sortable)
 */
router.get(
  "/users",
  safeHandler(async (req, res) => {
    const query = User.find().select("-password");
    const result = await paginate(query, req);
    res.json({ success: true, ...result });
  })
);

/**
 * Delete user
 */
router.delete(
  "/users/:id",
  safeHandler(async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ success: true });
  })
);

/**
 * List all academies (paginated + sortable)
 */
router.get(
  "/academies",
  safeHandler(async (req, res) => {
    const query = Academy.find();
    const result = await paginate(query, req);
    res.json({ success: true, ...result });
  })
);

/**
 * Update academy (PATCH)
 */
router.patch(
  "/academies/:id",
  safeHandler(async (req, res) => {
    const { id } = req.params;
    const update = req.body;
    const academy = await Academy.findByIdAndUpdate(id, update, { new: true });
    res.json({ success: true, data: academy });
  })
);

/**
 * Delete academy
 */
router.delete(
  "/academies/:id",
  safeHandler(async (req, res) => {
    const { id } = req.params;
    await Academy.findByIdAndDelete(id);
    res.json({ success: true });
  })
);

/**
 * List academy accounts (Users with role 'academy')
 */
router.get(
  "/academy-accounts",
  safeHandler(async (req, res) => {
    const query = User.find({ role: 'academy' })
      .select("-password")
      .populate('academyId', 'name nameAr logo');
    const result = await paginate(query, req);
    res.json({ success: true, ...result });
  })
);

/**
 * Create academy account (User with role 'academy')
 */
router.post(
  "/academy-accounts",
  safeHandler(async (req, res) => {
    const { academyId, email, password, name, phone } = req.body;
    
    if (!academyId || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Academy ID, email, and password are required" 
      });
    }
    
    // Check if academy exists
    const academy = await Academy.findById(academyId);
    if (!academy) {
      return res.status(404).json({ 
        success: false, 
        error: "Academy not found" 
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: "Email already exists" 
      });
    }
    
    // Create academy account
    const academyUser = await User.create({
      name: name || academy.name,
      email: email.toLowerCase(),
      password,
      phone: phone || academy.phone,
      role: 'academy',
      academyId: academy._id,
      academyName: academy.name
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: academyUser._id,
        name: academyUser.name,
        email: academyUser.email,
        role: academyUser.role,
        academyId: academyUser.academyId,
        academyName: academyUser.academyName
      }
    });
  })
);

/**
 * List all matches (paginated + sortable)
 */
router.get(
  "/matches",
  safeHandler(async (req, res) => {
    const query = Match.find()
      .populate("academy", "name")
      .populate("opponent", "name");

    const result = await paginate(query, req);
    res.json({ success: true, ...result });
  })
);

/**
 * Delete match
 */
router.delete(
  "/matches/:id",
  safeHandler(async (req, res) => {
    const { id } = req.params;
    await Match.findByIdAndDelete(id);
    res.json({ success: true });
  })
);

/**
 * List all player requests (paginated + sortable)
 */
router.get(
  "/player-requests",
  safeHandler(async (req, res) => {
    const query = PlayerRequest.find()
      .populate("user", "name email")
      .populate("academy", "name");

    const result = await paginate(query, req);
    res.json({ success: true, ...result });
  })
);

/**
 * Delete player request
 */
router.delete(
  "/player-requests/:id",
  safeHandler(async (req, res) => {
    const { id } = req.params;
    await PlayerRequest.findByIdAndDelete(id);
    res.json({ success: true });
  })
);

export default router;

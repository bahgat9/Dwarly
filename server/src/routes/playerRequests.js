// server/src/routes/playerRequests.js
import express from "express";
import PlayerRequest from "../models/PlayerRequest.js";
import Academy from "../models/Academy.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * User: request to join academy
 */
router.post("/:academyId", auth(), requireRole("user"), async (req, res) => {
  const { academyId } = req.params;

  const existing = await PlayerRequest.findOne({
    user: req.user._id,
    academy: academyId,
    status: "pending",
  });
  if (existing) {
    return res.status(400).json({ error: "You already have a pending request" });
  }

  const pr = await PlayerRequest.create({
    user: req.user._id,
    academy: academyId,
    userName: req.body.userName || req.user.name,
    userEmail: req.body.userEmail || req.user.email,
    academyName: req.body.academyName || "", // Can be populated later if needed
    message: req.body.message || "",
    age: req.body.age,
    position: req.body.position,
  });

  res.status(201).json(pr);
});

/**
 * User: view my own requests
 */
router.get("/my", auth(), requireRole("user"), async (req, res) => {
  const list = await PlayerRequest.find({ user: req.user._id })
    .populate("academy", "name nameAr")
    .sort({ createdAt: -1 });

  res.json(list);
});

/**
 * Academy/Admin: view requests for an academy (paginated)
 */
router.get(
  "/academy/:academyId",
  auth(),
  requireRole("academy", "admin"),
  async (req, res) => {
    const { academyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    console.log("PlayerRequests /academy/:academyId endpoint - req.user:", req.user);
    console.log("PlayerRequests /academy/:academyId endpoint - requested academyId:", academyId);

    // Security check: academy can only view its own requests
    if (req.user.role === "academy" && (!req.user.academyId || req.user.academyId.toString() !== academyId)) {
      console.error("PlayerRequests security check failed:", {
        userRole: req.user.role,
        userAcademyId: req.user.academyId,
        requestedAcademyId: academyId
      });
      return res.status(403).json({ error: "Forbidden" });
    }

    const total = await PlayerRequest.countDocuments({ academy: academyId });
    const pages = Math.ceil(total / limit);

    const items = await PlayerRequest.find({ academy: academyId })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    console.log("PlayerRequests /academy/:academyId endpoint - Found requests:", total);

    res.json({ 
      success: true,
      data: { items, page, pages, total }
    });
  }
);

/**
 * Academy/Admin: approve or reject a request
 */
router.patch(
  "/academy/:academyId/:id",
  auth(),
  requireRole("academy", "admin"),
  async (req, res) => {
    console.log("PATCH /academy/:academyId/:id - req.params:", req.params);
    console.log("PATCH /academy/:academyId/:id - req.user:", req.user);
    console.log("PATCH /academy/:academyId/:id - req.body:", req.body);
    
    const { academyId, id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const pr = await PlayerRequest.findOne({ _id: id, academy: academyId });
    if (!pr) return res.status(404).json({ error: "Request not found" });

    // Academy security check
    if (req.user.role === "academy" && req.user.academyId.toString() !== academyId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    pr.status = status;
    pr.respondedAt = new Date();

    // If rejected, set expireAt for auto-delete after 15 minutes
    if (status === "rejected") {
      pr.expireAt = new Date(Date.now() + 15 * 60 * 1000);
    }

    await pr.save();

    // If approved, optionally add player to academy.players
    if (status === "approved") {
      await Academy.findByIdAndUpdate(academyId, {
        $addToSet: { players: pr.user },
      });
    }

    res.json(pr);
  }
);

/**
 * Admin: view all requests
 */
router.get("/admin", auth(), requireRole("admin"), async (_req, res) => {
  const list = await PlayerRequest.find({})
    .populate("user", "name email")
    .populate("academy", "name nameAr")
    .sort({ createdAt: -1 });

  res.json(list);
});

/**
 * Academy: delete a request for their academy
 */
router.delete("/academy/:academyId/:id", auth(), requireRole("academy"), async (req, res) => {
  console.log("DELETE /academy/:academyId/:id - req.params:", req.params);
  console.log("DELETE /academy/:academyId/:id - req.user:", req.user);
  
  const { academyId, id } = req.params;

  // Security check: academy can only delete their own requests
  if (req.user.academyId.toString() !== academyId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const deleted = await PlayerRequest.findOneAndDelete({ _id: id, academy: academyId });
  if (!deleted) return res.status(404).json({ error: "Request not found" });

  res.json({ success: true, message: "Player request deleted" });
});

/**
 * Admin: delete a request
 */
router.delete("/admin/:id", auth(), requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const deleted = await PlayerRequest.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Request not found" });

  res.json({ success: true, message: "Player request deleted" });
});

// Debug route to catch unmatched requests
router.all("*", (req, res) => {
  console.log("Unmatched playerRequests route:", req.method, req.path);
  console.log("Full URL:", req.url);
  res.status(404).json({ error: "Route not found", method: req.method, path: req.path });
});

export default router;

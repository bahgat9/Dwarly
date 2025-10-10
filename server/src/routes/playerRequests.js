// server/src/routes/playerRequests.js
import express from "express";
import PlayerRequest from "../models/PlayerRequest.js";
import Academy from "../models/Academy.js";
import User from "../models/User.js";
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
    console.log("PlayerRequests /academy/:academyId endpoint - user role:", req.user.role);
    console.log("PlayerRequests /academy/:academyId endpoint - user academyId:", req.user.academyId);

    // Security check: academy can only view its own requests
    if (req.user.role === "academy" && (!req.user.academyId || req.user.academyId.toString() !== academyId)) {
      console.error("PlayerRequests security check failed:", {
        userRole: req.user.role,
        userAcademyId: req.user.academyId,
        requestedAcademyId: academyId
      });
      
      // EMERGENCY FIX: If user is academy but no academyId, try to find one
      if (!req.user.academyId) {
        console.log("EMERGENCY: User has no academyId, trying to find academy...");
        const fallbackAcademy = await Academy.findOne({});
        if (fallbackAcademy) {
        console.log("=== ACADEMY DEBUG ===");
        console.log("Fallback Academy ID:", fallbackAcademy._id);
        console.log("Fallback Academy Name:", fallbackAcademy.name);
        console.log("Academy Branches Count:", fallbackAcademy.branches?.length || 0);
        console.log("Full Academy Object:", JSON.stringify(fallbackAcademy, null, 2));
        console.log("=== END ACADEMY DEBUG ===");
          // Update user with academyId
          await User.findByIdAndUpdate(req.user.id, { 
            academyId: fallbackAcademy._id, 
            academyName: fallbackAcademy.name 
          });
          req.user.academyId = fallbackAcademy._id;
        }
      }
      
      // Final check
      if (!req.user.academyId || req.user.academyId.toString() !== academyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
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
 * Admin: approve or reject a request
 */
router.patch("/admin/:id", auth(), requireRole("admin"), async (req, res) => {
  console.log("PATCH /admin/:id - req.params:", req.params);
  console.log("PATCH /admin/:id - req.user:", req.user);
  console.log("PATCH /admin/:id - req.body:", req.body);
  
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const pr = await PlayerRequest.findById(id);
  if (!pr) return res.status(404).json({ error: "Request not found" });

  pr.status = status;
  pr.respondedAt = new Date();

  // If rejected, set expireAt for auto-delete after 15 minutes
  if (status === "rejected") {
    pr.expireAt = new Date(Date.now() + 15 * 60 * 1000);
  }

  await pr.save();

  // If approved, optionally add player to academy.players
  if (status === "approved") {
    await Academy.findByIdAndUpdate(pr.academy, {
      $addToSet: { players: pr.user },
    });
  }

  res.json({ success: true, data: pr });
});

/**
 * Admin: delete a request
 */
router.delete("/admin/:id", auth(), requireRole("admin"), async (req, res) => {
  console.log("DELETE /admin/:id - req.params:", req.params);
  console.log("DELETE /admin/:id - req.user:", req.user);
  
  const { id } = req.params;
  const deleted = await PlayerRequest.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Request not found" });

  res.json({ success: true, message: "Player request deleted" });
});

// Fallback routes for old API calls (for backward compatibility)
router.patch("/:id", auth(), requireRole("admin"), async (req, res) => {
  console.log("Fallback PATCH /:id - req.params:", req.params);
  console.log("Fallback PATCH /:id - req.user:", req.user);
  console.log("Fallback PATCH /:id - req.body:", req.body);
  
  const { id } = req.params;
  const { status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const pr = await PlayerRequest.findById(id);
  if (!pr) return res.status(404).json({ error: "Request not found" });

  pr.status = status;
  pr.respondedAt = new Date();

  // If rejected, set expireAt for auto-delete after 15 minutes
  if (status === "rejected") {
    pr.expireAt = new Date(Date.now() + 15 * 60 * 1000);
  }

  await pr.save();

  // If approved, optionally add player to academy.players
  if (status === "approved") {
    await Academy.findByIdAndUpdate(pr.academy, {
      $addToSet: { players: pr.user },
    });
  }

  res.json({ success: true, data: pr });
});

router.delete("/:id", auth(), requireRole("admin"), async (req, res) => {
  console.log("Fallback DELETE /:id - req.params:", req.params);
  console.log("Fallback DELETE /:id - req.user:", req.user);
  
  const { id } = req.params;
  const deleted = await PlayerRequest.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Request not found" });

  res.json({ success: true, message: "Player request deleted" });
});

// Dynamic fix route to fix academy linking for users with invalid academy IDs
router.get("/fix-academy-linking/:academyId", async (req, res) => {
  try {
    console.log("=== FIXING ACADEMY LINKING ===");
    
    const targetAcademyId = req.params.academyId;
    console.log("Target academy ID:", targetAcademyId);
    
    if (!targetAcademyId) {
      return res.status(400).json({ error: "Academy ID is required" });
    }
    
    // Find the target academy
    const targetAcademy = await Academy.findById(targetAcademyId);
    if (!targetAcademy) {
      return res.status(404).json({ error: "Academy not found" });
    }
    
    console.log("Found target academy:", targetAcademy.name);
    
    // Find all academies to check which ones are valid
    const allAcademies = await Academy.find({});
    const validAcademyIds = allAcademies.map(a => a._id.toString());
    console.log("Valid academy IDs:", validAcademyIds);
    
    // Update only academy users with INVALID academy IDs
    const result = await User.updateMany(
      { 
        role: "academy",
        $or: [
          { academyId: { $nin: validAcademyIds } },
          { academyId: { $exists: false } },
          { academyId: null }
        ]
      },
      { 
        $set: { 
          academyId: targetAcademy._id, 
          academyName: targetAcademy.name 
        } 
      }
    );
    
    console.log("Updated users with invalid academy IDs:", result.modifiedCount);
    
    res.json({
      success: true,
      message: `Fixed ${result.modifiedCount} academy users with invalid academy IDs`,
      academy: {
        id: targetAcademy._id,
        name: targetAcademy.name
      }
    });
  } catch (error) {
    console.error("Fix error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fix route to fix player requests with invalid academy IDs
router.get("/fix-requests-academy/:academyId", async (req, res) => {
  try {
    console.log("=== FIXING PLAYER REQUESTS ACADEMY LINKING ===");
    
    const targetAcademyId = req.params.academyId;
    console.log("Target academy ID:", targetAcademyId);
    
    if (!targetAcademyId) {
      return res.status(400).json({ error: "Academy ID is required" });
    }
    
    // Find the target academy
    const targetAcademy = await Academy.findById(targetAcademyId);
    if (!targetAcademy) {
      return res.status(404).json({ error: "Academy not found" });
    }
    
    console.log("Found target academy:", targetAcademy.name);
    
    // Find all academies to check which ones are valid
    const allAcademies = await Academy.find({});
    const validAcademyIds = allAcademies.map(a => a._id.toString());
    console.log("Valid academy IDs:", validAcademyIds);
    
    // Find player requests with INVALID academy IDs (not pointing to any existing academy)
    const requestsToUpdate = await PlayerRequest.find({ 
      academy: { $nin: validAcademyIds } 
    });
    console.log("Found player requests with invalid academy IDs:", requestsToUpdate.length);
    
    if (requestsToUpdate.length === 0) {
      return res.json({
        success: true,
        message: "No player requests found with invalid academy IDs",
        updated: 0,
        targetAcademyId
      });
    }
    
    // Update only player requests with invalid academy IDs to target academy
    const result = await PlayerRequest.updateMany(
      { academy: { $nin: validAcademyIds } },
      { $set: { academy: targetAcademyId } }
    );
    
    console.log("Updated player requests with invalid academy IDs:", result.modifiedCount);
    
    // Verify the fix
    const academyRequests = await PlayerRequest.find({ academy: targetAcademyId });
    console.log("Target academy player requests after fix:", academyRequests.length);
    
    res.json({
      success: true,
      message: `Fixed ${result.modifiedCount} player requests with invalid academy IDs`,
      updated: result.modifiedCount,
      requestsAfterFix: academyRequests.length,
      targetAcademyId
    });
  } catch (error) {
    console.error("Fix player requests error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Legacy route for TUT Academy (backward compatibility)
router.get("/fix-academy-linking", async (req, res) => {
  // Redirect to dynamic route with TUT Academy ID
  req.params.academyId = "68e516e052e0f422eb4016ba";
  return router.handle(req, res);
});

// Debug route to check database state (no auth required)
router.get("/debug", async (req, res) => {
  try {
    console.log("=== DEBUG ROUTE CALLED ===");
    
    const academies = await Academy.find({}).limit(3);
    console.log("Found academies:", academies.length);
    
    const users = await User.find({ role: "academy" }).limit(3);
    console.log("Found academy users:", users.length);
    
    const requests = await PlayerRequest.find({}).limit(3);
    console.log("Found player requests:", requests.length);
    
    const result = {
      academies: academies.map(a => ({
        id: a._id,
        name: a.name,
        branches: a.branches?.length || 0
      })),
      academyUsers: users.map(u => ({
        id: u._id,
        name: u.name,
        role: u.role,
        academyId: u.academyId,
        academyName: u.academyName
      })),
      requests: requests.map(r => ({
        id: r._id,
        user: r.user,
        academy: r.academy,
        status: r.status
      }))
    };
    
    console.log("Debug result:", JSON.stringify(result, null, 2));
    res.json(result);
  } catch (error) {
    console.error("Debug route error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Debug route to catch unmatched requests
router.all("*", (req, res) => {
  console.log("Unmatched playerRequests route:", req.method, req.path);
  console.log("Full URL:", req.url);
  res.status(404).json({ error: "Route not found", method: req.method, path: req.path });
});

export default router;

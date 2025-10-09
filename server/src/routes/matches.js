// server/src/routes/matches.js
import express from "express";
import Match from "../models/Match.js";
import Academy from "../models/Academy.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * List all matches (public feed)
 */
router.get("/", async (_req, res) => {
  const list = await Match.find({})
    .populate("academy", "name nameAr phone logo")
    .populate("opponent", "name nameAr phone logo")
    .sort({ dateTime: 1 }); // ✅ chronological order

  res.json(list);
});

/**
 * Create a match request (academy only)
 */
router.post("/", auth(), requireRole("academy"), async (req, res) => {
  console.log("POST /api/matches - Request body:", req.body);
  console.log("POST /api/matches - User:", req.user);
  console.log("POST /api/matches - User academyId:", req.user.academyId);
  
  const { ageGroup, dateTime, locationDescription, locationGeo, homeAway, phone, duration, description } = req.body;

  if (!req.user.academyId) {
    console.log("No academyId in user session:", req.user);
    return res.status(400).json({ error: "User is not linked to an academy" });
  }

  const academy = await Academy.findById(req.user.academyId);
  if (!academy) {
    console.log("Academy not found for user:", req.user.academyId);
    return res.status(400).json({ error: "Academy not found for user" });
  }

  // Clean ageGroup string: remove duplicates and sort
  let cleanedAgeGroup = ageGroup;
  if (ageGroup && ageGroup !== "Mixed Ages") {
    const groups = ageGroup.split(',')
      .map(g => g.trim())
      .filter((g, i, arr) => arr.indexOf(g) === i)
      .sort();
    cleanedAgeGroup = groups.join(", ");
  }

  let match;
  try {
    match = await Match.create({
      academy: academy._id,
      creatorId: req.user.id, // Store the user who created the match
      ageGroup: cleanedAgeGroup,
      dateTime: new Date(dateTime), // ✅ store as Date
      homeAway,
      locationDescription,
      locationGeo,
      phone,
      duration,
      description: description || "Friendly match",
      status: "requested",
    });
    console.log("Match created successfully:", match._id);
  } catch (error) {
    console.error("Error creating match:", error);
    return res.status(400).json({ error: "Failed to create match", details: error.message });
  }

  // Populate academy info in response
  const populatedMatch = await Match.findById(match._id)
    .populate("academy", "name nameAr phone logo");

  res.status(201).json(populatedMatch);
});

/**
 * Accept a match request (academy only)
 */
router.post("/:id/accept", auth(), requireRole("academy"), async (req, res) => {
  const { id } = req.params;

  const match = await Match.findById(id);
  if (!match) return res.status(404).json({ error: "Match not found" });

  if (match.academy.toString() === req.user.academyId.toString()) {
    return res.status(400).json({ error: "Cannot accept your own match request" });
  }

  const opponent = await Academy.findById(req.user.academyId);
  if (!opponent) return res.status(400).json({ error: "Opponent academy not found" });

  match.opponent = opponent._id;
  match.status = "confirmed";
  await match.save();

  res.json(match);
});

/**
 * List matches for the logged-in academy
 */
router.get("/my", auth(), requireRole("academy"), async (req, res) => {
  console.log("Matches /my endpoint - req.user:", req.user);

  if (!req.user.academyId) {
    console.error("Matches /my endpoint - No academyId in user:", req.user);
    return res.status(400).json({ error: "Academy ID not found in user session" });
  }

  const myMatches = await Match.find({
    $or: [{ academy: req.user.academyId }, { opponent: req.user.academyId }],
  })
    .populate("academy", "name nameAr phone logo")
    .populate("opponent", "name nameAr phone logo")
    .sort({ dateTime: 1 });

  console.log("Matches /my endpoint - Found matches:", myMatches.length);

  res.json(myMatches);
});

/**
 * Admin: view all matches
 */
router.get("/admin", auth(), requireRole("admin"), async (_req, res) => {
  const matches = await Match.find({})
    .populate("academy", "name nameAr")
    .populate("opponent", "name nameAr")
    .sort({ dateTime: 1 });

  res.json(matches);
});

/**
 * Delete a match (academy can delete their own, admin can delete any)
 */
router.delete("/:id", auth(), async (req, res) => {
  const { id } = req.params;
  console.log("DELETE /api/matches/:id - User:", req.user);
  console.log("DELETE /api/matches/:id - Match ID:", id);

  const match = await Match.findById(id);
  if (!match) {
    console.log("DELETE /api/matches/:id - Match not found");
    return res.status(404).json({ error: "Match not found" });
  }

  console.log("DELETE /api/matches/:id - Match creatorId:", match.creatorId);
  console.log("DELETE /api/matches/:id - User id:", req.user.id);

  // Allow if user is admin
  if (req.user.role === "admin") {
    console.log("DELETE /api/matches/:id - Deleting as admin");
    await Match.findByIdAndDelete(id);
    return res.json({ success: true, message: "Match deleted by admin" });
  }

  // Allow if user is creator of the match (academy user)
  if (match.creatorId.toString() === req.user.id.toString()) {
    console.log("DELETE /api/matches/:id - Deleting as creator");
    await Match.findByIdAndDelete(id);
    return res.json({ success: true, message: "Match deleted by creator" });
  }

  console.log("DELETE /api/matches/:id - Not authorized");
  return res.status(403).json({ error: "Not authorized to delete this match" });
});

/**
 * Public: available age groups (dynamic list for frontend)
 */
router.get("/age-groups", async (_req, res) => {
  try {
    const ageGroups = [];
    const currentYear = new Date().getFullYear();
    for (let year = 2010; year <= currentYear - 5; year++) {
      ageGroups.push(year);
    }
    res.json(ageGroups);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch age groups" });
  }
});

/**
 * Finish a match (creator academy only)
 */
router.post("/:id/finish", auth(), requireRole("academy"), async (req, res) => {
  const { id } = req.params;

  const match = await Match.findById(id);
  if (!match) return res.status(404).json({ error: "Match not found" });

  // Only creator academy can finish the match
  if (match.academy.toString() !== req.user.academyId.toString()) {
    return res.status(403).json({ error: "Only the creator academy can finish this match" });
  }

  if (match.status !== "confirmed" && match.status !== "accepted") {
    return res.status(400).json({ error: "Match must be in confirmed or accepted status to be finished" });
  }

  match.status = "finished";
  match.finishedAt = new Date();
  await match.save();

  // Schedule auto-deletion after 15 minutes
  setTimeout(async () => {
    try {
      const matchToDelete = await Match.findById(id);
      if (matchToDelete && matchToDelete.status === "finished") {
        await Match.findByIdAndDelete(id);
        console.log(`Auto-deleted finished match ${id} after 15 minutes`);
      }
    } catch (error) {
      console.error(`Failed to auto-delete match ${id}:`, error);
    }
  }, 15 * 60 * 1000); // 15 minutes

  res.json(match);
});

/**
 * Update match status (drag & drop)
 */
router.patch("/:id/status", auth(), requireRole("academy"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["requested", "confirmed", "finished", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const match = await Match.findById(id);
  if (!match) return res.status(404).json({ error: "Match not found" });

  // allow creator academy or opponent to update
  if (
    match.academy.toString() !== req.user.academyId.toString() &&
    match.opponent?.toString() !== req.user.academyId.toString()
  ) {
    return res.status(403).json({ error: "Not authorized" });
  }

  match.status = status;
  if (status === "finished") {
    match.finishedAt = new Date();
  }
  await match.save();

  // Schedule auto-deletion after 15 minutes if finished
  if (status === "finished") {
    setTimeout(async () => {
      try {
        const matchToDelete = await Match.findById(id);
        if (matchToDelete && matchToDelete.status === "finished") {
          await Match.findByIdAndDelete(id);
          console.log(`Auto-deleted finished match ${id} after 15 minutes`);
        }
      } catch (error) {
        console.error(`Failed to auto-delete match ${id}:`, error);
      }
    }, 15 * 60 * 1000); // 15 minutes
  }

  res.json(match);
});


export default router;

import express from "express"
import multer from "multer"
import Player from "../models/Player.js"
import { auth, requireRole } from "../middleware/auth.js"
import { safeHandler } from "../utils/safeHandler.js"
import cloudinary from "../utils/cloudinary.js"

const router = express.Router({ mergeParams: true })

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() })

// --- GET paginated players
router.get(
  "/",
  safeHandler(async (req, res) => {
    console.log("=== ACADEMY PLAYERS DEBUG ===");
    console.log("AcademyId from params:", req.params.academyId);
    console.log("Query params:", req.query);
    
    const { page = 1, limit = 10 } = req.query
    const academyId = req.params.academyId

    if (!academyId) {
      console.log("ERROR: No academyId provided");
      return res.status(400).json({ error: "Academy ID is required" });
    }

    console.log("Searching for players with academy:", academyId);
    
    const [items, total] = await Promise.all([
      Player.find({ academy: academyId })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Player.countDocuments({ academy: academyId }),
    ])

    console.log("Found players:", items.length);
    console.log("Total players:", total);
    console.log("Players data:", JSON.stringify(items, null, 2));
    console.log("=== END ACADEMY PLAYERS DEBUG ===");

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) })
  })
)

// --- POST create player (supports both JSON and FormData with avatar upload)
router.post(
  "/",
  auth(),
  requireRole("academy"),
  upload.single('avatar'),
  safeHandler(async (req, res) => {
    const academyId = req.params.academyId
    const { name, age, position } = req.body

    if (!name) {
      return res.status(400).json({ error: "Player name is required" })
    }

    let avatarUrl = null
    
    // Handle avatar upload if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: "academy-players",
              transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" }
              ]
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error)
                reject(error)
              } else {
                resolve(result)
              }
            }
          ).end(req.file.buffer)
        })
        
        avatarUrl = result.secure_url
      } catch (error) {
        console.error("Avatar upload error:", error)
        return res.status(500).json({ error: "Failed to upload avatar" })
      }
    }

    const player = await Player.create({ 
      name, 
      age: age ? parseInt(age) : undefined, 
      position, 
      academy: academyId,
      avatar: avatarUrl
    })
    
    res.status(201).json(player)
  })
)

// --- PATCH update player
router.patch(
  "/:id",
  auth(),
  requireRole("academy"),
  safeHandler(async (req, res) => {
    const academyId = req.params.academyId
    const { id } = req.params

    const player = await Player.findOneAndUpdate(
      { _id: id, academy: academyId },
      { $set: req.body },
      { new: true }
    )

    if (!player) return res.status(404).json({ error: "Player not found" })
    res.json(player)
  })
)

// --- DELETE player
router.delete(
  "/:id",
  auth(),
  requireRole("academy"),
  safeHandler(async (req, res) => {
    const academyId = req.params.academyId
    const { id } = req.params

    const deleted = await Player.findOneAndDelete({ _id: id, academy: academyId })
    if (!deleted) return res.status(404).json({ error: "Player not found" })

    res.json({ message: "Player deleted successfully" })
  })
)

// Fix route to update all players to correct academy
router.get("/fix-players-academy", async (req, res) => {
  try {
    console.log("=== FIXING PLAYERS ACADEMY LINKING ===");
    
    // Get the target academy ID from the URL params
    const targetAcademyId = req.params.academyId;
    console.log("Target academy ID:", targetAcademyId);
    
    if (!targetAcademyId) {
      return res.status(400).json({ error: "Academy ID is required" });
    }
    
    // Find all players that are NOT linked to the target academy
    const playersToUpdate = await Player.find({ 
      academy: { $ne: targetAcademyId } 
    });
    console.log("Found players to update:", playersToUpdate.length);
    
    if (playersToUpdate.length === 0) {
      return res.json({
        success: true,
        message: "No players found that need updating",
        updated: 0,
        targetAcademyId
      });
    }
    
    // Update all players to target academy ID
    const result = await Player.updateMany(
      { academy: { $ne: targetAcademyId } },
      { $set: { academy: targetAcademyId } }
    );
    
    console.log("Updated players:", result.modifiedCount);
    
    // Verify the fix
    const academyPlayers = await Player.find({ academy: targetAcademyId });
    console.log("Academy players after fix:", academyPlayers.length);
    
    res.json({
      success: true,
      message: `Fixed ${result.modifiedCount} players`,
      updated: result.modifiedCount,
      playersAfterFix: academyPlayers.length,
      targetAcademyId
    });
  } catch (error) {
    console.error("Fix players error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Debug route to check players in database
router.get("/debug", async (req, res) => {
  try {
    console.log("=== PLAYERS DEBUG ROUTE ===");
    
    const allPlayers = await Player.find({}).limit(10);
    console.log("All players in database:", allPlayers.length);
    
    const tutAcademyPlayers = await Player.find({ academy: "68e516e052e0f422eb4016ba" });
    console.log("TUT Academy players:", tutAcademyPlayers.length);
    
    res.json({
      allPlayers: allPlayers.map(p => ({
        id: p._id,
        name: p.name,
        academy: p.academy,
        position: p.position
      })),
      tutAcademyPlayers: tutAcademyPlayers.map(p => ({
        id: p._id,
        name: p.name,
        academy: p.academy,
        position: p.position
      }))
    });
  } catch (error) {
    console.error("Players debug error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router

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
    const { page = 1, limit = 10 } = req.query
    const academyId = req.params.academyId

    const [items, total] = await Promise.all([
      Player.find({ academy: academyId })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Player.countDocuments({ academy: academyId }),
    ])

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

export default router

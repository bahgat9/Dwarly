import express from "express"
import Match from "../models/Match.js"
import { auth, requireRole } from "../middleware/auth.js"
import { safeHandler } from "../utils/safeHandler.js"

const router = express.Router({ mergeParams: true })

// --- GET paginated matches
router.get(
  "/",
  safeHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query
    const academyId = req.params.academyId

    const [items, total] = await Promise.all([
      Match.find({ academy: academyId })
        .populate("opponent", "name")
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ date: -1 }),
      Match.countDocuments({ academy: academyId }),
    ])

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) })
  })
)

// --- POST create match
router.post(
  "/",
  auth(),
  requireRole("academy"),
  safeHandler(async (req, res) => {
    const academyId = req.params.academyId
    const { opponent, date, location, score } = req.body

    const match = await Match.create({
      academy: academyId,
      opponent,
      date,
      location,
      score,
    })

    res.status(201).json(match)
  })
)

// --- PATCH update match
router.patch(
  "/:id",
  auth(),
  requireRole("academy"),
  safeHandler(async (req, res) => {
    const academyId = req.params.academyId
    const { id } = req.params

    const match = await Match.findOneAndUpdate(
      { _id: id, academy: academyId },
      { $set: req.body },
      { new: true }
    )

    if (!match) return res.status(404).json({ error: "Match not found" })
    res.json(match)
  })
)

// --- DELETE match
router.delete(
  "/:id",
  auth(),
  requireRole("academy"),
  safeHandler(async (req, res) => {
    const academyId = req.params.academyId
    const { id } = req.params

    const deleted = await Match.findOneAndDelete({ _id: id, academy: academyId })
    if (!deleted) return res.status(404).json({ error: "Match not found" })

    res.json({ message: "Match deleted successfully" })
  })
)

export default router

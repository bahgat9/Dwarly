import express from "express"
import User from "../models/User.js"
import PlayerRequest from "../models/PlayerRequest.js"
import Match from "../models/Match.js"
import { auth, requireRole } from "../middleware/auth.js"
import { safeHandler } from "../utils/safeHandler.js"

const router = express.Router()

router.get(
  "/",
  auth(),
  requireRole("admin"),
  safeHandler(async (req, res) => {
    const users = await User.find().select("-password"); // Exclude password
    res.json(users);
  })
);

// --- GET current user profile
router.get(
  "/me",
  auth(),
  safeHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password") // never send password
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json(user)
  })
)

// --- PATCH update current user profile
router.patch(
  "/me",
  auth(),
  requireRole("user"),
  safeHandler(async (req, res) => {
    const { name, email, phone, age, position } = req.body

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name, email, phone, age, position } },
      { new: true }
    ).select("-password")

    if (!updated) return res.status(404).json({ error: "User not found" })
    res.json(updated)
  })
)

// --- DELETE current user account
router.delete(
  "/me",
  auth(),
  requireRole("user"),
  safeHandler(async (req, res) => {
    const deleted = await User.findByIdAndDelete(req.user.id)
    if (!deleted) return res.status(404).json({ error: "User not found" })
    res.json({ message: "User account deleted successfully" })
  })
)

// --- GET my player requests
router.get(
  "/me/requests",
  auth(),
  requireRole("user"),
  safeHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query

    const [items, total] = await Promise.all([
      PlayerRequest.find({ user: req.user.id })
        .populate("academy", "name location")
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      PlayerRequest.countDocuments({ user: req.user.id }),
    ])

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) })
  })
)

// --- DELETE a specific request (user cancels it)
router.delete(
  "/me/requests/:id",
  auth(),
  requireRole("user"),
  safeHandler(async (req, res) => {
    const deleted = await PlayerRequest.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    })
    if (!deleted) return res.status(404).json({ error: "Request not found" })
    res.json({ message: "Request deleted successfully" })
  })
)

// --- GET my matches (academy invites me or I'm in a player record)
router.get(
  "/me/matches",
  auth(),
  requireRole("user"),
  safeHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query

    // Option 1: if User is directly linked to Match via "players" field
    const [items, total] = await Promise.all([
      Match.find({ players: req.user.id })
        .populate("academy", "name")
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ date: -1 }),
      Match.countDocuments({ players: req.user.id }),
    ])

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) })
  })
)

export default router

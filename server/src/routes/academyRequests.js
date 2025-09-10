// src/routes/academyRequests.js
import express from "express"
import PlayerRequest from "../models/PlayerRequest.js"
import Academy from "../models/Academy.js"
import { auth, requireRole } from "../middleware/auth.js"
import { safeHandler } from "../utils/safeHandler.js"

const router = express.Router({ mergeParams: true })

// =========================================================
// ACADEMY-SCOPED ROUTES (/api/academies/:academyId/requests)
// =========================================================

// --- GET paginated requests (academy only)
router.get(
  "/",
  auth(),
  requireRole("academy"),
  safeHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query
    const academyId = req.params.academyId

    const [items, total] = await Promise.all([
      PlayerRequest.find({ academy: academyId })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      PlayerRequest.countDocuments({ academy: academyId }),
    ])

    res.json({
      success: true,
      data: items.map((r) => ({
        id: r._id,
        userName: r.userName,
        userEmail: r.userEmail,
        status: r.status,
        message: r.message,
        createdAt: r.createdAt,
      })),
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    })
  })
)

  // --- POST user applies to academy
  router.post(
    "/",
    auth(),
    requireRole("user"),
    safeHandler(async (req, res) => {
      const academyId = req.params.academyId

      // prevent duplicate pending requests
      const exists = await PlayerRequest.findOne({
        user: req.user.id,
        academy: academyId,
        status: "pending",
      })
      if (exists) {
        return res.status(400).json({ error: "You already have a pending request" })
      }

      // Fetch user info for name and email
      const user = req.user

      // Fetch academy name
      const academy = await Academy.findById(academyId)
      if (!academy) {
        return res.status(404).json({ error: "Academy not found" })
      }

    const request = await PlayerRequest.create({
      user: req.user.id,
      academy: academyId,
      userName: req.body.userName || user.name || "Unknown User",
      userEmail: req.body.userEmail || user.email || "",
      academyName: academy.name || "Unknown Academy",
      message: req.body.message || "",
      age: req.body.age || null,
      position: req.body.position || "",
      status: "pending",
    })

      res.status(201).json({
        success: true,
        data: {
          id: request._id,
          academy: request.academy,
          status: request.status,
          message: request.message,
          createdAt: request.createdAt,
        },
      })
    })
  )

// --- PATCH update request (academy only, e.g., approve/reject)
router.patch(
  "/:id",
  auth(),
  requireRole("academy"),
  safeHandler(async (req, res) => {
    const academyId = req.params.academyId
    const { id } = req.params

    const allowedFields = ["status", "message"]
    const updates = {}
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field]
    })

    // Set expireAt for rejected requests (15 minutes from now)
    if (updates.status === "rejected") {
      updates.expireAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    }

    const updated = await PlayerRequest.findOneAndUpdate(
      { _id: id, academy: academyId },
      { $set: updates },
      { new: true }
    )

    if (!updated) return res.status(404).json({ error: "Request not found" })

    res.json({
      success: true,
      data: {
        id: updated._id,
        userName: updated.userName,
        userEmail: updated.userEmail,
        status: updated.status,
        message: updated.message,
        createdAt: updated.createdAt,
      },
    })
  })
)

// --- DELETE request (academy only)
router.delete(
  "/:id",
  auth(),
  requireRole("academy"),
  safeHandler(async (req, res) => {
    const academyId = req.params.academyId
    const { id } = req.params

    const deleted = await PlayerRequest.findOneAndDelete({
      _id: id,
      academy: academyId,
    })
    if (!deleted) return res.status(404).json({ error: "Request not found" })

    res.json({ success: true, message: "Request deleted successfully" })
  })
)

// =========================================================
// GLOBAL ROUTES (/api/academy-requests/...)
// =========================================================

// --- GET all requests made by the logged-in user (User Dashboard)
router.get(
  "/mine",
  auth(),
  requireRole("user"),
  safeHandler(async (req, res) => {
    const requests = await PlayerRequest.find({ user: req.user.id })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: requests.map((r) => ({
        id: r._id,
        academy: r.academy,
        academyName: r.academyName,
        status: r.status,
        message: r.message,
        createdAt: r.createdAt,
      })),
    })
  })
)

// --- GET requests received by the logged-in academy (Academy Dashboard)
router.get(
  "/received",
  auth(),
  requireRole("academy"),
  safeHandler(async (req, res) => {
    const academyId = req.user.academyId // fixed to use academyId from token
    const requests = await PlayerRequest.find({ academy: academyId })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      data: requests.map((r) => ({
        id: r._id,
        userName: r.userName,
        userEmail: r.userEmail,
        status: r.status,
        message: r.message,
        createdAt: r.createdAt,
      })),
    })
  })
)

// --- GET recent requests (Admin Dashboard)
router.get(
  "/recent",
  auth(),
  requireRole("admin"),
  safeHandler(async (req, res) => {
    const requests = await PlayerRequest.find()
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      success: true,
      data: requests.map((r) => ({
        id: r._id,
        userName: r.userName,
        academyName: r.academyName,
        status: r.status,
        createdAt: r.createdAt,
      })),
    })
  })
)

export default router

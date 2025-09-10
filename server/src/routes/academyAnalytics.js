// server/src/routes/academyAnalytics.js
import express from "express";
import Player from "../models/Player.js";
import Match from "../models/Match.js";
import FinanceEntry from "../models/FinanceEntry.js";
import PlayerRequest from "../models/PlayerRequest.js";
import mongoose from "mongoose";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

// GET /api/academies/:academyId/analytics
router.get("/", auth(), requireRole("academy"), async (req, res) => {
  try {
    const academyId = req.params.academyId;
    console.log("Analytics API called for academyId:", academyId);
    console.log("User making request:", req.user);
    
    const academyObjectId = new mongoose.Types.ObjectId(academyId);

    const [
      playerCount,
      playersByPosition,
      playersByAge,
      matchCount,
      matchesByStatus,
      monthlyMatches,
      financeAgg,
      playerRequestCount,
      playerRequestsByStatus
    ] = await Promise.all([
      // Count actual Player documents
      Player.countDocuments({ academy: academyObjectId }),
      // Get position data from Player documents
      Player.aggregate([
        { $match: { academy: academyObjectId } },
        { $group: { _id: "$position", count: { $sum: 1 } } }
      ]),
      // Get age data from Player documents
      Player.aggregate([
        { $match: { academy: academyObjectId } },
        { $group: { _id: "$age", count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Match.countDocuments({ academy: academyObjectId }),
      Match.aggregate([
        { $match: { academy: academyObjectId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Match.aggregate([
        { $match: { academy: academyObjectId } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$dateTime" } }, count: { $sum: 1 } } },
        { $sort: { "_id": 1 } }
      ]),
      FinanceEntry.aggregate([
        { $match: { academy: academyObjectId } },
        { $group: { _id: "$type", total: { $sum: "$amount" } } }
      ]),
      PlayerRequest.countDocuments({ academy: academyObjectId }),
      PlayerRequest.aggregate([
        { $match: { academy: academyObjectId } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
    ]);

    const income = financeAgg.find(x => x._id === "income")?.total || 0;
    const expense = financeAgg.find(x => x._id === "expense")?.total || 0;

    // Debug: Check both Player documents and PlayerRequest documents
    const allPlayers = await Player.find({ academy: academyObjectId });
    const allRequests = await PlayerRequest.find({ academy: academyObjectId });
    console.log("Player documents for academy:", allPlayers.length);
    console.log("Player details:", allPlayers.map(p => ({ name: p.name, age: p.age, position: p.position })));
    console.log("PlayerRequest documents for academy:", allRequests.length);
    console.log("Approved requests:", allRequests.filter(r => r.status === 'approved').length);

    console.log("Analytics results:", {
      playerCount,
      playersByPosition,
      playersByAge,
      matchCount,
      playerRequestCount,
      playerRequestsByStatus
    });

    res.json({
      success: true,
      data: {
        playerCount,
        playersByPosition,
        playersByAge,
        matchCount,
        matchesByStatus,
        monthlyMatches,
        finance: { income, expense, balance: income - expense },
        playerRequests: {
          total: playerRequestCount,
          byStatus: playerRequestsByStatus
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute analytics" });
  }
});

export default router;

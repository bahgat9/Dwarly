// server/src/routes/academyFinance.js
import express from "express";
import FinanceEntry from "../models/FinanceEntry.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router({ mergeParams: true });

// List
router.get("/", auth(), requireRole("academy"), async (req, res) => {
  const academy = req.params.academyId;
  const items = await FinanceEntry.find({ academy }).sort({ date: -1 });
  res.json({ success: true, data: items });
});

// Create
router.post("/", auth(), requireRole("academy"), async (req, res) => {
  const academy = req.params.academyId;
  const { type, amount, category, date, note } = req.body;
  const item = await FinanceEntry.create({ academy, type, amount, category, date, note });
  res.status(201).json({ success: true, data: item });
});

// Delete
router.delete("/:id", auth(), requireRole("academy"), async (req, res) => {
  const academy = req.params.academyId;
  const { id } = req.params;
  const deleted = await FinanceEntry.findOneAndDelete({ _id: id, academy });
  if (!deleted) return res.status(404).json({ error: "Finance entry not found" });
  res.json({ success: true, message: "Deleted" });
});

export default router;

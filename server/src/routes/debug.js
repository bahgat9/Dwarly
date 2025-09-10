import express from "express";
import Academy from "../models/Academy.js";

const router = express.Router();

router.get("/debug/academies", async (req, res) => {
  try {
    const academies = await Academy.find();
    console.log("Academies in the database:", academies);
    res.json({ success: true, data: academies });
  } catch (error) {
    console.error("Error fetching academies:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;

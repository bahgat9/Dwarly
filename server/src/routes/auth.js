// src/routes/auth.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Academy from "../models/Academy.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Helper: issue cookie + return token
function setToken(res, user) {
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      academyId: user.academyId,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "none", // ✅ allow cross-site
    secure: true,     // ✅ required when SameSite=None
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
}

// --- Register / Signup (merged)
router.post(["/register", "/signup"], async (req, res) => {
  try {
    let name = (req.body?.name ?? "").trim();
    const email = (req.body?.email ?? "").trim().toLowerCase();
    const password = (req.body?.password ?? "").trim();
    const phone = (req.body?.phone ?? "").trim();
    const role = (req.body?.role ?? "user").trim();

    const academyIdFromBody = req.body?.academyId || null;
    const academyName = (req.body?.academyName ?? "").trim();

    // check duplicate
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already exists" });

    // resolve academyId
    let resolvedAcademyId = null;
    let resolvedAcademyName = academyName;

    if (academyIdFromBody) {
      const linkedAcademy = await Academy.findById(academyIdFromBody);
      if (linkedAcademy) {
        resolvedAcademyId = linkedAcademy._id;
        resolvedAcademyName = linkedAcademy.name;
        if (!name) name = linkedAcademy.name;
      }
    } else if ((role === "academy" || role === "user") && academyName) {
      const byName = await Academy.findOne({
        $or: [
          { name: new RegExp("^" + academyName + "$", "i") },
          { nameAr: new RegExp("^" + academyName + "$", "i") },
        ],
      });
      if (byName) {
        resolvedAcademyId = byName._id;
        resolvedAcademyName = byName.name;
        if (!name) name = byName.name;
      }
    }

    // create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      academyId: resolvedAcademyId || undefined,
      academyName: resolvedAcademyName || undefined,
    });

    setToken(res, user);

    res.json({
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        academyId: user.academyId,
        academyName: user.academyName,
      },
    });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ error: "Registration failed", detail: e.message });
  }
});

// --- Login
router.post("/login", async (req, res) => {
  try {
    const email = (req.body?.email ?? "").trim().toLowerCase();
    const password = (req.body?.password ?? "").trim();

    let user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    // 🔧 Auto-link academy account if missing academyId
    if (user.role === "academy" && !user.academyId) {
      let linked = null;
      const candidateName = (user.academyName || user.name || "").trim();
      if (candidateName) {
        linked = await Academy.findOne({
          $or: [
            { name: new RegExp("^" + candidateName + "$", "i") },
            { nameAr: new RegExp("^" + candidateName + "$", "i") },
          ],
        });
      }
      if (!linked && candidateName) {
        // Auto-provision minimal academy to unblock login, mark unverified
        linked = await Academy.create({
          name: candidateName,
          verified: false,
        });
      }
      if (linked) {
        user.academyId = linked._id;
        user.academyName = linked.name;
        await user.save();
      }
    }

    setToken(res, user);

    res.json({
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        academyId: user.academyId,
        academyName: user.academyName,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Login failed", detail: e.message });
  }
});

// --- Session check
router.get("/session", auth(false), async (req, res) => {
  if (!req.user) return res.json({ user: null });
  try {
    let user = await User.findById(req.user.id).select("-password");
    if (!user) return res.json({ user: null });

    // 🔧 Auto-link on session as well
    if (user.role === "academy" && !user.academyId) {
      let linked = null;
      const candidateName = (user.academyName || user.name || "").trim();
      if (candidateName) {
        linked = await Academy.findOne({
          $or: [
            { name: new RegExp("^" + candidateName + "$", "i") },
            { nameAr: new RegExp("^" + candidateName + "$", "i") },
          ],
        });
      }
      if (!linked && candidateName) {
        linked = await Academy.create({ name: candidateName, verified: false });
      }
      if (linked) {
        user = await User.findByIdAndUpdate(
          req.user.id,
          { $set: { academyId: linked._id, academyName: linked.name } },
          { new: true }
        ).select("-password");
      }
    }

    res.json({
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        academyId: user.academyId,
        academyName: user.academyName,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Session check failed", detail: e.message });
  }
});

// --- Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none", // must match
    secure: true,
  });
  res.json({ message: "Logged out" });
});

export default router;

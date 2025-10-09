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

    const token = setToken(res, user);

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
      token,
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

    // 🔧 EMERGENCY FIX: Force academy linking for academy users
    if (user.role === "academy") {
      console.log("EMERGENCY FIX: Processing academy user:", user.name, user.email);
      console.log("Current academyId:", user.academyId);
      
      if (!user.academyId) {
        console.log("No academyId found, attempting to link...");
        
        // Try multiple strategies to find or create academy
        let linked = null;
        
        // Strategy 1: Try by user's academyName (handle branches structure)
        if (user.academyName) {
          linked = await Academy.findOne({
            $or: [
              { name: new RegExp("^" + user.academyName + "$", "i") },
              { nameAr: new RegExp("^" + user.academyName + "$", "i") },
              { "branches.name": new RegExp("^" + user.academyName + "$", "i") },
              { "branches.nameAr": new RegExp("^" + user.academyName + "$", "i") },
            ],
          });
          console.log("Strategy 1 - Found by academyName:", linked?.name);
        }
        
        // Strategy 2: Try by user's name (handle branches structure)
        if (!linked && user.name) {
          linked = await Academy.findOne({
            $or: [
              { name: new RegExp("^" + user.name + "$", "i") },
              { nameAr: new RegExp("^" + user.name + "$", "i") },
              { "branches.name": new RegExp("^" + user.name + "$", "i") },
              { "branches.nameAr": new RegExp("^" + user.name + "$", "i") },
            ],
          });
          console.log("Strategy 2 - Found by name:", linked?.name);
        }
        
        // Strategy 3: Try to find any academy (fallback)
        if (!linked) {
          linked = await Academy.findOne({});
          console.log("Strategy 3 - Using fallback academy:", linked?.name);
        }
        
        // Strategy 4: Create new academy if nothing found
        if (!linked) {
          const academyName = user.academyName || user.name || "Academy " + user.name;
          console.log("Strategy 4 - Creating new academy:", academyName);
          linked = await Academy.create({ 
            name: academyName, 
            verified: false,
            locationDescription: "TBD",
            phone: user.phone || ""
          });
        }
        
        if (linked) {
          console.log("SUCCESS: Linking user to academy:", linked.name, linked._id);
          user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: { academyId: linked._id, academyName: linked.name } },
            { new: true }
          ).select("-password");
          // Re-issue cookie token with academyId
          setToken(res, user);
          console.log("User updated with academyId:", user.academyId);
        } else {
          console.log("CRITICAL ERROR: Could not find or create academy for user:", user.name);
        }
      } else {
        console.log("User already has academyId:", user.academyId);
      }
    }

    const userData = {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      academyId: user.academyId,
      academyName: user.academyName,
    };
    
    console.log("Session endpoint - User data:", userData);
    console.log("Session endpoint - User academyId type:", typeof user.academyId);
    console.log("Session endpoint - User academyId value:", user.academyId);
    
    res.json({
      user: userData,
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

import jwt from "jsonwebtoken";

/**
 * Authentication middleware.
 * - Looks for JWT in Authorization header (Bearer) or cookies
 * - Validates and attaches user to req.user
 * - Refreshes token if it’s close to expiring (< 24h left)
 */
export function auth(required = true) {
  return (req, res, next) => {
    let token = null;

    // 1️⃣ Check header
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      token = header.slice(7);
    }

    // 2️⃣ Check cookie
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      if (required) return res.status(401).json({ error: "Unauthorized" });
      req.user = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // Sliding session refresh (< 24h left)
      const now = Math.floor(Date.now() / 1000);
      const expSoon = payload.exp - now < 60 * 60 * 24;

      if (expSoon) {
        const newPayload = {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          academyId: payload.academyId,
        };

        const newToken = jwt.sign(newPayload, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });

        res.cookie("token", newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        req.user = newPayload;
      } else {
        req.user = payload;
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Authenticated user:", req.user);
      }

      next();
    } catch (err) {
      if (required) {
        return res.status(401).json({
          error:
            err.name === "TokenExpiredError"
              ? "Token expired"
              : "Invalid token",
        });
      }
      req.user = null;
      next();
    }
  };
}

/**
 * Role-based access control
 * Example: app.get("/admin", auth(), requireRole("admin"), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

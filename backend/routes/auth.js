import express from "express"
import jwt from "jsonwebtoken"

const router = express.Router()

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Validate credentials against environment variables
    const adminUsername = process.env.ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD
    const jwtSecret = process.env.JWT_SECRET

    if (!adminUsername || !adminPassword || !jwtSecret) {
      return res.status(500).json({
        error: "Server configuration error. Please contact administrator.",
      })
    }

    // Check if credentials match
    if (username === adminUsername && password === adminPassword) {
      // Generate JWT token
      const token = jwt.sign({ username, role: "admin" }, jwtSecret, { expiresIn: "24h" })

      return res.json({
        success: true,
        token,
        user: { username, role: "admin" },
      })
    } else {
      return res.status(401).json({
        error: "Invalid username or password",
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed. Please try again." })
  }
})

// Verify token endpoint (optional - for checking if token is still valid)
router.get("/verify", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    res.json({ valid: true, user: decoded })
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" })
  }
})

export default router

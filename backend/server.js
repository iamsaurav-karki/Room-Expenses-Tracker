import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

// Import routes
import memberRoutes from "./routes/members.js"
import expenseRoutes from "./routes/expenses.js"
import roomRoutes from "./routes/rooms.js"
import analyticsRoutes from "./routes/analytics.js"
import authRoutes from "./routes/auth.js"

// Import auth middleware
import { authenticateToken } from "./middleware/auth.js"

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Room Expense Tracker API is running" })
})

app.use("/api/auth", authRoutes)

app.use("/api/rooms", authenticateToken, roomRoutes)
app.use("/api/members", authenticateToken, memberRoutes)
app.use("/api/expenses", authenticateToken, expenseRoutes)
app.use("/api/analytics", authenticateToken, analyticsRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)

  // Test database connection
  try {
    await prisma.$connect()
    console.log("Database connected successfully")
  } catch (error) {
    console.error("Database connection error:", error)
  }
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect()
  process.exit(0)
})

export default app

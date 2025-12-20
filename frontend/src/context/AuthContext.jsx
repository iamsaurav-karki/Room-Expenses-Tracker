"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [loading, setLoading] = useState(true)

  // Set up axios interceptor to include token in all requests
  useEffect(() => {
    console.log("[v0] AuthContext - Setting up axios with token:", token ? "exists" : "none")
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      localStorage.setItem("token", token)
    } else {
      delete axios.defaults.headers.common["Authorization"]
      localStorage.removeItem("token")
    }
  }, [token])

  useEffect(() => {
    const verifyToken = async () => {
      console.log("[v0] AuthContext - Verifying token:", token ? "exists" : "none")
      if (token) {
        try {
          const response = await axios.get("http://localhost:5000/api/auth/verify")
          console.log("[v0] AuthContext - Token verified, user:", response.data.user)
          setUser(response.data.user)
        } catch (error) {
          console.error("[v0] AuthContext - Token verification failed:", error)
          setToken(null)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
      console.log("[v0] AuthContext - Verification complete, loading:", false)
    }

    verifyToken()
  }, [token])

  const login = async (username, password) => {
    try {
      console.log("[v0] AuthContext - Attempting login...")
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      })

      const { token: newToken, user: userData } = response.data
      console.log("[v0] AuthContext - Login successful, setting token and user")

      setToken(newToken)
      setUser(userData)
      localStorage.setItem("token", newToken)

      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`

      console.log("[v0] AuthContext - Token and user set, ready to navigate")

      return { success: true, user: userData }
    } catch (error) {
      console.error("[v0] AuthContext - Login failed:", error)
      return {
        success: false,
        error: error.response?.data?.error || "Login failed. Please try again.",
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

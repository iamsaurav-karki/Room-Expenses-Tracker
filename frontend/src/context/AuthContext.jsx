"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

const AuthContext = createContext()

// ✅ API base URL (from env)
const API_URL = import.meta.env.VITE_API_URL

console.log("[AuthContext] API_URL =", API_URL)

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

  // 🔐 Attach token to axios globally
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      localStorage.setItem("token", token)
    } else {
      delete axios.defaults.headers.common["Authorization"]
      localStorage.removeItem("token")
    }
  }, [token])

  // 🔍 Verify token on load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const response = await axios.get(`${API_URL}/auth/verify`)
        setUser(response.data.user)
      } catch (error) {
        console.error("[AuthContext] Token verification failed", error)
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  // 🔑 Login
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password,
      })

      const { token: newToken, user: userData } = response.data

      setToken(newToken)
      setUser(userData)

      return { success: true, user: userData }
    } catch (error) {
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
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}


"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { roomAPI } from "../services/api"
import { useAuth } from "./AuthContext"

const RoomContext = createContext()

export const useRoom = () => {
  const context = useContext(RoomContext)
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider")
  }
  return context
}

export const RoomProvider = ({ children }) => {
  const [currentRoomId, setCurrentRoomId] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated, loading: authLoading } = useAuth()

  useEffect(() => {
    console.log("[v0] RoomContext - authLoading:", authLoading, "isAuthenticated:", isAuthenticated)
    if (!authLoading && isAuthenticated) {
      console.log("[v0] RoomContext - Loading rooms...")
      loadRooms()
    } else if (!authLoading && !isAuthenticated) {
      console.log("[v0] RoomContext - Not authenticated, skipping room load")
      setLoading(false)
    }
  }, [authLoading, isAuthenticated])

  const loadRooms = async () => {
    try {
      setLoading(true)
      console.log("[v0] RoomContext - Fetching rooms from API...")
      const response = await roomAPI.getAll()
      console.log("[v0] RoomContext - Rooms loaded:", response.data.length)
      setRooms(response.data)

      // Set first room as current if none selected
      if (!currentRoomId && response.data.length > 0) {
        setCurrentRoomId(response.data[0].id)
        console.log("[v0] RoomContext - Set current room to:", response.data[0].id)
      }
    } catch (error) {
      console.error("[v0] RoomContext - Error loading rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const createRoom = async (roomData) => {
    try {
      const response = await roomAPI.create(roomData)
      const newRoom = response.data
      setRooms([...rooms, newRoom])
      setCurrentRoomId(newRoom.id)
      return newRoom
    } catch (error) {
      console.error("Error creating room:", error)
      throw error
    }
  }

  const value = {
    currentRoomId,
    setCurrentRoomId,
    rooms,
    currentRoom: rooms.find((r) => r.id === currentRoomId),
    loading,
    loadRooms,
    createRoom,
  }

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}

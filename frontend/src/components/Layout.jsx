"use client"

import { Link, useLocation } from "react-router-dom"
import { useRoom } from "../context/RoomContext"
import { useAuth } from "../context/AuthContext"
import { roomAPI } from "../services/api"
import { useState } from "react"
import Modal from "./Modal"

const Layout = ({ children }) => {
  const location = useLocation()
  const { currentRoom, rooms, setCurrentRoomId, loading, loadRooms } = useRoom()
  const { logout, user } = useAuth()
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState(currentRoom?.currencyCode || "USD")
  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Cancel",
    showCancel: false,
  })

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "NPR", name: "Nepali Rupee", symbol: "Rs." },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "EUR", name: "Euro", symbol: "€" },
  ]

  const handleCurrencyChange = async (currencyCode) => {
    if (!currentRoom) return
    try {
      await roomAPI.update(currentRoom.id, { currencyCode })
      setSelectedCurrency(currencyCode)
      setShowCurrencyModal(false)
      loadRooms()
      setModal({
        isOpen: true,
        title: "Success",
        message: "Currency updated successfully!",
        type: "success",
        onConfirm: null,
        confirmText: "OK",
        showCancel: false,
      })
    } catch (error) {
      console.error("Error updating currency:", error)
      setModal({
        isOpen: true,
        title: "Error",
        message: "Failed to update currency. Please try again.",
        type: "error",
        onConfirm: null,
        confirmText: "OK",
        showCancel: false,
      })
    }
  }

  const handleLogout = () => {
    setModal({
      isOpen: true,
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      type: "warning",
      onConfirm: () => {
        logout()
        setModal({ ...modal, isOpen: false })
      },
      confirmText: "Logout",
      cancelText: "Cancel",
      showCancel: true,
    })
  }

  const navigation = [
    { name: "Dashboard", path: "/", icon: "📊" },
    { name: "Expenses", path: "/expenses", icon: "💰" },
    { name: "Members", path: "/members", icon: "👥" },
    { name: "Analytics", path: "/analytics", icon: "📈" },
  ]

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-lg font-semibold text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Professional Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        showCancel={modal.showCancel}
      />

      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-5 gap-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent leading-tight">
              Room Expense Tracker
            </h1>
            {currentRoom && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <select
                  value={currentRoom.id}
                  onChange={(e) => setCurrentRoomId(e.target.value)}
                  className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-300 transition-all w-full sm:w-auto"
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <button
                    onClick={() => setShowCurrencyModal(true)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 border-2 border-gray-200 rounded-lg text-sm font-semibold hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all w-full sm:w-auto"
                  >
                    <span className="text-primary-600">
                      {currencies.find((c) => c.code === currentRoom.currencyCode)?.symbol || "$"}
                    </span>
                    <span className="text-gray-700">{currentRoom.currencyCode}</span>
                    <span className="text-gray-400 text-xs">▼</span>
                  </button>

                  {showCurrencyModal && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCurrencyModal(false)}></div>
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-50 border-2 border-gray-100 overflow-hidden">
                        <div className="p-2">
                          {currencies.map((currency) => (
                            <button
                              key={currency.code}
                              onClick={() => handleCurrencyChange(currency.code)}
                              className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center justify-between transition-all ${
                                currentRoom.currencyCode === currency.code
                                  ? "bg-primary-50 border-2 border-primary-200"
                                  : ""
                              }`}
                            >
                              <div>
                                <div className="font-semibold text-gray-900">{currency.name}</div>
                                <div className="text-xs text-gray-500 font-medium">{currency.code}</div>
                              </div>
                              <span className="text-primary-600 font-bold">{currency.symbol}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-red-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white transition-all"
                  title={`Logout ${user?.username || ""}`}
                >
                  <span>🚪</span>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b-2 border-gray-200 shadow-sm sticky top-[73px] sm:top-[81px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`relative py-3 sm:py-4 px-3 sm:px-6 font-semibold text-sm sm:text-base transition-all whitespace-nowrap ${
                  isActive(item.path) ? "text-primary-600" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base sm:text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </span>
                {isActive(item.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 to-primary-800 rounded-t-full"></span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</main>
    </div>
  )
}

export default Layout

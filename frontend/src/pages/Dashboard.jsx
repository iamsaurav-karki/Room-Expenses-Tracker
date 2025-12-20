import { useEffect, useState } from 'react'
import { useRoom } from '../context/RoomContext'
import { analyticsAPI, expenseAPI } from '../services/api'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const Dashboard = () => {
  const { currentRoomId, currentRoom } = useRoom()
  const [dashboardData, setDashboardData] = useState(null)
  const [whoOwesWhom, setWhoOwesWhom] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const currencySymbols = {
    USD: '$',
    NPR: 'Rs.',
    GBP: '£',
    EUR: '€',
  }

  const getCurrencySymbol = () => {
    return currencySymbols[currentRoom?.currencyCode || 'USD'] || '$'
  }

  useEffect(() => {
    if (currentRoomId) {
      loadDashboard()
    }
  }, [currentRoomId, selectedMonth, selectedYear])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const [dashboardRes, balancesRes] = await Promise.all([
        analyticsAPI.getDashboard(currentRoomId, selectedYear, selectedMonth),
        expenseAPI.getBalances(currentRoomId, selectedYear, selectedMonth),
      ])
      setDashboardData(dashboardRes.data)
      setWhoOwesWhom(balancesRes.data.whoOwesWhom || [])
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (direction) => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12)
        setSelectedYear(selectedYear - 1)
      } else {
        setSelectedMonth(selectedMonth - 1)
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1)
        setSelectedYear(selectedYear + 1)
      } else {
        setSelectedMonth(selectedMonth + 1)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg font-semibold text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">{error}</p>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 font-medium">No data available</p>
      </div>
    )
  }

  const { stats, members } = dashboardData
  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })

  return (
    <div className="space-y-6">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent leading-tight">
        Dashboard
      </h2>

      {/* Balance Summary */}
      {whoOwesWhom.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">Balance Summary</h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 font-medium">Who owes whom</p>
          <div className="space-y-3">
            {whoOwesWhom.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-4 sm:p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-primary-300 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="font-bold text-sm sm:text-base text-gray-900">{item.from}</span>
                  <span className="text-gray-400 text-lg">→</span>
                  <span className="font-bold text-sm sm:text-base text-primary-600">
                    {getCurrencySymbol()} {item.amount.toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-lg">→</span>
                  <span className="font-bold text-sm sm:text-base text-gray-900">{item.to}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Month Filter */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Filter by Month</h3>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <button
            onClick={() => handleMonthChange('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-xl"
            aria-label="Previous month"
          >
            ←
          </button>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-300 transition-all"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-300 transition-all"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
              (year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              )
            )}
          </select>
          <button
            onClick={() => handleMonthChange('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-xl"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Expenses"
          value={`${getCurrencySymbol()} ${stats.allTimeTotal.toFixed(2)}`}
          subtitle="All time"
          icon="💰"
          color="blue"
        />
        <StatCard
          title="This Month"
          value={`${getCurrencySymbol()} ${stats.currentMonthTotal.toFixed(2)}`}
          subtitle={`${monthName} ${selectedYear}`}
          icon="📅"
          color="green"
        />
        <StatCard
          title="Roommates"
          value={stats.totalRoommates}
          subtitle="Active members"
          icon="👥"
          color="purple"
        />
        <StatCard
          title="Avg per Person"
          value={`${getCurrencySymbol()} ${stats.averageCostPerPerson.toFixed(2)}`}
          subtitle="This month"
          icon="📈"
          color="orange"
        />
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Room Members</h3>
        {members.length === 0 ? (
          <p className="text-gray-500 font-medium">No members added yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-all hover:border-primary-300"
              >
                <div className="font-semibold text-base sm:text-lg text-gray-900">{member.fullName}</div>
                {member.nickname && (
                  <div className="text-sm text-gray-500 mt-1">@{member.nickname}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const StatCard = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">{title}</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-2 text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        <div className="text-3xl sm:text-4xl ml-2">{icon}</div>
      </div>
    </div>
  )
}

export default Dashboard

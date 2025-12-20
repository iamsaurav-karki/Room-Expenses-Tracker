import { useEffect, useState } from 'react'
import { useRoom } from '../context/RoomContext'
import { analyticsAPI, expenseAPI } from '../services/api'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const Analytics = () => {
  const { currentRoomId, currentRoom } = useRoom()
  const [dashboardData, setDashboardData] = useState(null)
  const [categoryData, setCategoryData] = useState(null)
  const [trendData, setTrendData] = useState(null)
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

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
      loadAnalytics()
    }
  }, [currentRoomId, selectedMonth, selectedYear])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [dashboardRes, categoryRes, trendRes, balancesRes] = await Promise.all([
        analyticsAPI.getDashboard(currentRoomId, selectedYear, selectedMonth),
        analyticsAPI.getCategories(currentRoomId, selectedYear, selectedMonth),
        analyticsAPI.getTrends(currentRoomId, 6),
        expenseAPI.getBalances(currentRoomId, selectedYear, selectedMonth),
      ])
      setDashboardData(dashboardRes.data)
      setCategoryData(categoryRes.data)
      setTrendData(trendRes.data)
      setBalances(balancesRes.data.balances || [])
    } catch (error) {
      console.error('Error loading analytics:', error)
      setBalances([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent leading-tight">
          Analytics & Reports
        </h2>
        <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="flex-1 sm:flex-none border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-300 transition-all"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month}>
                {new Date(2000, month - 1).toLocaleString('default', {
                  month: 'long',
                })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="flex-1 sm:flex-none border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-300 transition-all"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(
              (year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Balances */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 border-2 border-gray-100">
        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4">
          Member Balances
        </h3>
        {balances.length === 0 ? (
          <p className="text-gray-500">No balance data available</p>
        ) : (
          <div className="space-y-3">
            {balances.map((balance) => (
              <div
                key={balance.memberId}
                className="flex justify-between items-center p-4 border border-gray-200 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {balance.memberName}
                  </div>
                  <div className="text-sm text-gray-500">
                    Paid: {getCurrencySymbol()}{balance.totalPaid.toFixed(2)} | Owed: {getCurrencySymbol()}
                    {balance.totalOwed.toFixed(2)}
                  </div>
                </div>
                <div
                  className={`text-lg font-semibold ${
                    balance.balance > 0
                      ? 'text-red-600'
                      : balance.balance < 0
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  {balance.balance > 0
                    ? `Owes ${getCurrencySymbol()}${balance.balance.toFixed(2)}`
                    : balance.balance < 0
                    ? `Owed ${getCurrencySymbol()}${Math.abs(balance.balance).toFixed(2)}`
                    : 'Settled'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-100">
          <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-4">
            Expenses by Category
          </h3>
          {categoryData && categoryData.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData.categories}
                  dataKey="totalAmount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {categoryData.categories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${getCurrencySymbol()}${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No category data for selected period
            </p>
          )}
        </div>

        {/* Monthly Trends */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-100">
          <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-4">
            Monthly Trends (Last 6 Months)
          </h3>
          {trendData && trendData.trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${getCurrencySymbol()}${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="totalAmount" fill="#0ea5e9" name="Total Expenses" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">
              No trend data available
            </p>
          )}
        </div>
      </div>

      {/* Category Breakdown Table */}
      {categoryData && categoryData.categories.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-100">
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4">
            Category Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expense Count
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryData.categories.map((cat) => (
                  <tr key={cat.category}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {cat.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCurrencySymbol()}{cat.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cat.expenseCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics


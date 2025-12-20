import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Room API
export const roomAPI = {
  getAll: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
}

// Member API
export const memberAPI = {
  getByRoom: (roomId, includeInactive = false) => 
    api.get(`/members/room/${roomId}`, { params: { includeInactive } }),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id, hardDelete = false) => 
    api.delete(`/members/${id}`, { params: { hardDelete } }),
}

// Expense API
export const expenseAPI = {
  getByRoom: (roomId, filters = {}) => 
    api.get(`/expenses/room/${roomId}`, { params: filters }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getBalances: (roomId, year, month) => 
    api.get(`/expenses/room/${roomId}/balances`, { params: { year, month } }),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: (roomId, year, month) => 
    api.get(`/analytics/room/${roomId}/dashboard`, { params: { year, month } }),
  getMonthly: (roomId, year, month) => 
    api.get(`/analytics/room/${roomId}/monthly`, { params: { year, month } }),
  getCategories: (roomId, year, month) => 
    api.get(`/analytics/room/${roomId}/categories`, { params: { year, month } }),
  getTrends: (roomId, months = 6) => 
    api.get(`/analytics/room/${roomId}/trends`, { params: { months } }),
}

export default api


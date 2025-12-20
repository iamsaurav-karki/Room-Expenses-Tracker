import { useEffect, useState } from 'react'
import { useRoom } from '../context/RoomContext'
import { expenseAPI, memberAPI } from '../services/api'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import Modal from '../components/Modal'

const Expenses = () => {
  const { currentRoomId, currentRoom } = useRoom()
  const [expenses, setExpenses] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [viewingExpense, setViewingExpense] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, confirmText: 'OK', cancelText: 'Cancel', showCancel: false })
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    payments: [{ memberId: '', paidAmount: '' }],
    splitBetween: [],
  })

  const categories = [
    'rent',
    'groceries',
    'utilities',
    'internet',
    'supplies',
    'maintenance',
    'other',
  ]

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
      loadData()
    }
  }, [currentRoomId, selectedMonth, selectedYear])

  const loadData = async () => {
    try {
      setLoading(true)
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
      
      const [expensesRes, membersRes] = await Promise.all([
        expenseAPI.getByRoom(currentRoomId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
        memberAPI.getByRoom(currentRoomId),
      ])
      setExpenses(expensesRes.data)
      setMembers(membersRes.data)
      
      // Initialize splitBetween with all members
      if (membersRes.data.length > 0 && formData.splitBetween.length === 0) {
        setFormData(prev => ({
          ...prev,
          splitBetween: membersRes.data.map(m => ({ memberId: m.id, selected: true }))
        }))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Calculate shares based on split between members
      const totalAmount = parseFloat(formData.amount) || 0
      const selectedMembers = formData.splitBetween.filter(s => s.selected)
      const sharePerPerson = selectedMembers.length > 0 
        ? totalAmount / selectedMembers.length 
        : 0

      const expenseData = {
        title: formData.title || formData.description || 'Untitled Expense',
        description: formData.description,
        category: formData.category || 'other',
        roomId: currentRoomId,
        expenseDate: formData.expenseDate || format(new Date(), 'yyyy-MM-dd'),
        payments: formData.payments
          .filter((p) => p.memberId && p.paidAmount)
          .map((p) => ({
            memberId: p.memberId,
            paidAmount: parseFloat(p.paidAmount),
          })),
        shares: selectedMembers.map(s => ({
          memberId: s.memberId,
          owedAmount: sharePerPerson,
        })),
      }

      if (editingExpense) {
        await expenseAPI.update(editingExpense.id, expenseData)
      } else {
        await expenseAPI.create(expenseData)
      }

      setShowAddForm(false)
      setEditingExpense(null)
      resetForm()
      loadData()
      setModal({
        isOpen: true,
        title: 'Success',
        message: editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!',
        type: 'success',
        onConfirm: null,
        confirmText: 'OK',
        showCancel: false
      })
    } catch (error) {
      console.error('Error saving expense:', error)
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to save expense. Please try again.',
        type: 'error',
        onConfirm: null,
        confirmText: 'OK',
        showCancel: false
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      expenseDate: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      payments: [{ memberId: '', paidAmount: '' }],
      splitBetween: members.map(m => ({ memberId: m.id, selected: true })),
    })
  }

  const handleViewDetails = async (expense) => {
    try {
      // Load full expense details with payments and shares
      const expenseRes = await expenseAPI.getById(expense.id)
      setViewingExpense(expenseRes.data)
    } catch (error) {
      console.error('Error loading expense details:', error)
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load expense details. Please try again.',
        type: 'error',
        onConfirm: null,
        confirmText: 'OK',
        showCancel: false
      })
    }
  }

  const handleEdit = async (expense) => {
    try {
      // Load expense details with payments and shares
      const expenseRes = await expenseAPI.getById(expense.id)
      const expenseData = expenseRes.data
      
      // Calculate total amount from payments
      const totalAmount = expenseData.expensePayments.reduce(
        (sum, p) => sum + parseFloat(p.paidAmount),
        0
      )

      // Set form data for editing
      setFormData({
        title: expenseData.title,
        description: expenseData.description || '',
        category: expenseData.category,
        expenseDate: format(new Date(expenseData.expenseDate), 'yyyy-MM-dd'),
        amount: totalAmount.toString(),
        payments: expenseData.expensePayments.map(p => ({
          memberId: p.memberId || '',
          paidAmount: parseFloat(p.paidAmount).toString(),
        })),
        splitBetween: members.map(m => ({
          memberId: m.id,
          selected: expenseData.expenseShares.some(s => s.memberId === m.id),
        })),
      })
      
      setEditingExpense(expenseData)
      setShowAddForm(true)
    } catch (error) {
      console.error('Error loading expense:', error)
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load expense details. Please try again.',
        type: 'error',
        onConfirm: null,
        confirmText: 'OK',
        showCancel: false
      })
    }
  }

  const handleDelete = async (id) => {
    setModal({
      isOpen: true,
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense? This action cannot be undone.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await expenseAPI.delete(id)
          loadData()
          setModal({
            isOpen: true,
            title: 'Success',
            message: 'Expense deleted successfully.',
            type: 'success',
            onConfirm: null,
            confirmText: 'OK',
            showCancel: false
          })
        } catch (error) {
          console.error('Error deleting expense:', error)
          setModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete expense. Please try again.',
            type: 'error',
            onConfirm: null,
            confirmText: 'OK',
            showCancel: false
          })
        }
      },
      confirmText: 'Delete',
      cancelText: 'Cancel',
      showCancel: true
    })
  }

  const addPayment = () => {
    setFormData({
      ...formData,
      payments: [...formData.payments, { memberId: '', paidAmount: '' }],
    })
  }

  const removePayment = (index) => {
    setFormData({
      ...formData,
      payments: formData.payments.filter((_, i) => i !== index),
    })
  }

  const updatePayment = (index, field, value) => {
    const newPayments = [...formData.payments]
    newPayments[index] = { ...newPayments[index], [field]: value }
    setFormData({ ...formData, payments: newPayments })
  }

  const payFullAmount = (index) => {
    const totalAmount = parseFloat(formData.amount) || 0
    const newPayments = [...formData.payments]
    newPayments[index] = { ...newPayments[index], paidAmount: totalAmount.toFixed(2) }
    setFormData({ ...formData, payments: newPayments })
  }

  const splitPaymentEvenly = () => {
    const totalAmount = parseFloat(formData.amount) || 0
    const numPayments = formData.payments.length
    if (numPayments === 0) return
    
    const amountPerPerson = totalAmount / numPayments
    const newPayments = formData.payments.map(p => ({
      ...p,
      paidAmount: amountPerPerson.toFixed(2)
    }))
    setFormData({ ...formData, payments: newPayments })
  }

  const toggleSplitMember = (memberId) => {
    setFormData({
      ...formData,
      splitBetween: formData.splitBetween.map(s =>
        s.memberId === memberId ? { ...s, selected: !s.selected } : s
      ),
    })
  }

  const calculateTotalPaid = () => {
    return formData.payments.reduce((sum, p) => {
      return sum + (parseFloat(p.paidAmount) || 0)
    }, 0)
  }

  const totalPaid = calculateTotalPaid()
  const totalAmount = parseFloat(formData.amount) || 0
  const isFullyPaid = totalPaid >= totalAmount && totalAmount > 0

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading expenses...</div>
      </div>
    )
  }

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })

  const handleExportToExcel = async () => {
    try {
      // Get all expenses for the selected month
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
      
      const expensesRes = await expenseAPI.getByRoom(currentRoomId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const expensesData = expensesRes.data

      // Prepare data for Excel
      const excelData = expensesData.map((expense) => {
        const totalPaid = expense.expensePayments.reduce(
          (sum, p) => sum + parseFloat(p.paidAmount),
          0
        )
        
        // Get all payers as comma-separated string
        const payers = expense.expensePayments
          .map(p => `${p.member?.fullName || 'Unknown'}: ${getCurrencySymbol()}${parseFloat(p.paidAmount).toFixed(2)}`)
          .join('; ')

        // Get all members in split as comma-separated string
        const splitMembers = expense.expenseShares
          .map(s => `${s.member?.fullName || 'Unknown'}: ${getCurrencySymbol()}${parseFloat(s.owedAmount).toFixed(2)}`)
          .join('; ')

        return {
          'Date': format(new Date(expense.expenseDate), 'MMM dd, yyyy'),
          'Title': expense.title,
          'Description': expense.description || '',
          'Category': expense.category,
          'Amount': totalPaid,
          'Currency': currentRoom?.currencyCode || 'USD',
          'Paid By': payers,
          'Split Between': splitMembers || 'N/A',
          'Number of Payers': expense.expensePayments.length,
          'Number in Split': expense.expenseShares.length,
        }
      })

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 25 }, // Title
        { wch: 30 }, // Description
        { wch: 15 }, // Category
        { wch: 12 }, // Amount
        { wch: 8 },  // Currency
        { wch: 40 }, // Paid By
        { wch: 40 }, // Split Between
        { wch: 15 }, // Number of Payers
        { wch: 15 }, // Number in Split
      ]
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses')

      // Generate filename
      const filename = `Expenses_${monthName}_${selectedYear}_${currentRoom?.name || 'Room'}.xlsx`

      // Write and download file
      XLSX.writeFile(wb, filename)

      // Show success message
      setModal({
        isOpen: true,
        title: 'Export Successful',
        message: `Expenses exported successfully to ${filename}`,
        type: 'success',
        onConfirm: null,
        confirmText: 'OK',
        showCancel: false
      })
    } catch (error) {
      console.error('Error exporting expenses:', error)
      setModal({
        isOpen: true,
        title: 'Export Failed',
        message: 'Failed to export expenses. Please try again.',
        type: 'error',
        onConfirm: null,
        confirmText: 'OK',
        showCancel: false
      })
    }
  }

  return (
    <div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent leading-tight">
          Expenses
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={handleExportToExcel}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            📊 Export to Excel
          </button>
          <button
            onClick={() => {
              resetForm()
              setEditingExpense(null)
              setFormData({
                ...formData,
                splitBetween: members.map(m => ({ memberId: m.id, selected: true })),
              })
              setShowAddForm(true)
            }}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Month Filter */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <span className="text-sm sm:text-base font-semibold text-gray-700">Filter by Month:</span>
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 sm:flex-none border-2 border-gray-200 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white hover:border-gray-300 transition-all"
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
      </div>

      {/* Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <p className="text-sm text-gray-500">
                  {editingExpense ? 'Update expense details' : 'Track a new shared expense'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingExpense(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Expense Details */}
              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Expense Details</h4>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="What was this expense for?"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount ({currentRoom?.currencyCode || 'USD'})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expenseDate: e.target.value })
                    }
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                  />
                </div>
              </div>

              {/* Who Paid */}
              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Who paid?</h4>
                
                {formData.payments.map((payment, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payer
                      </label>
                      <select
                        required
                        value={payment.memberId}
                        onChange={(e) =>
                          updatePayment(index, 'memberId', e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Who paid?</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={payment.paidAmount}
                          onChange={(e) =>
                            updatePayment(index, 'paidAmount', e.target.value)
                          }
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => payFullAmount(index)}
                          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm whitespace-nowrap"
                        >
                          Pay Full
                        </button>
                        {formData.payments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePayment(index)}
                            className="bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold text-gray-700">
                      Total paid: {getCurrencySymbol()} {totalPaid.toFixed(2)}
                    </span>
                    {isFullyPaid && (
                      <span className="text-green-600 text-sm font-semibold">✓ Fully paid</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={splitPaymentEvenly}
                      className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      Split Payment Evenly
                    </button>
                    <button
                      type="button"
                      onClick={addPayment}
                      className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-semibold"
                    >
                      + Add Payer
                    </button>
                  </div>
                </div>
              </div>

              {/* Split Between */}
              <div className="space-y-3">
                <h4 className="text-base sm:text-lg font-bold text-gray-900">Split Between:</h4>
                <div className="space-y-2">
                  {members.map((member) => {
                    const splitMember = formData.splitBetween.find(s => s.memberId === member.id)
                    const isSelected = splitMember?.selected ?? true
                    return (
                      <label
                        key={member.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSplitMember(member.id)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-900">{member.fullName}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingExpense(null)
                    resetForm()
                  }}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm sm:text-base w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto"
                >
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-5 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Expense Details</h3>
                <p className="text-sm text-gray-500 mt-1">View complete expense information</p>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl font-light transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Expense Header */}
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 sm:p-6 border-2 border-primary-100">
                <h4 className="text-xl sm:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                  {viewingExpense.title}
                </h4>
                {viewingExpense.description && (
                  <p className="text-gray-600 text-sm sm:text-lg mb-4 leading-relaxed font-medium">{viewingExpense.description}</p>
                )}
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <span className="bg-primary-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold">
                    {viewingExpense.category}
                  </span>
                  <span className="text-gray-600 font-semibold text-xs sm:text-base">
                    📅 {format(new Date(viewingExpense.expenseDate), 'MMMM dd, yyyy')}
                  </span>
                  <span className="text-lg sm:text-2xl font-extrabold text-gray-900">
                    {getCurrencySymbol()}
                    {viewingExpense.expensePayments.reduce(
                      (sum, p) => sum + parseFloat(p.paidAmount),
                      0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3 sm:space-y-4">
                <h5 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <span>💳</span> Payment Details
                </h5>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                  {viewingExpense.expensePayments.length > 0 ? (
                    viewingExpense.expensePayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-all"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-600 font-bold text-sm sm:text-base">
                              {payment.member?.fullName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-900 text-sm sm:text-base truncate">
                              {payment.member?.fullName || 'Unknown Member'}
                            </div>
                            {payment.member?.email && (
                              <div className="text-xs sm:text-sm text-gray-500 truncate">{payment.member.email}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-base sm:text-lg font-extrabold text-gray-900">
                            {getCurrencySymbol()}{parseFloat(payment.paidAmount).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            Paid
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4 font-medium">No payment information available</p>
                  )}
                </div>
              </div>

              {/* Split Details */}
              {viewingExpense.expenseShares && viewingExpense.expenseShares.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <h5 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                    <span>👥</span> Split Between Members
                  </h5>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {viewingExpense.expenseShares.map((share) => (
                      <div
                        key={share.id}
                        className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-all"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold text-sm sm:text-base">
                              {share.member?.fullName?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-900 text-sm sm:text-base truncate">
                              {share.member?.fullName || 'Unknown Member'}
                            </div>
                            {share.member?.email && (
                              <div className="text-xs sm:text-sm text-gray-500 truncate">{share.member.email}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-base sm:text-lg font-extrabold text-gray-900">
                            {getCurrencySymbol()}{parseFloat(share.owedAmount).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            Owes
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 border-2 border-gray-200">
                <h5 className="text-base sm:text-lg font-extrabold text-gray-900 mb-3 sm:mb-4">Summary</h5>
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-semibold text-sm sm:text-base">Total Amount:</span>
                    <span className="text-lg sm:text-xl font-extrabold text-gray-900">
                      {getCurrencySymbol()}
                      {viewingExpense.expensePayments.reduce(
                        (sum, p) => sum + parseFloat(p.paidAmount),
                        0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-semibold text-sm sm:text-base">Total Paid:</span>
                    <span className="text-base sm:text-lg font-bold text-green-600">
                      {getCurrencySymbol()}
                      {viewingExpense.expensePayments.reduce(
                        (sum, p) => sum + parseFloat(p.paidAmount),
                        0
                      ).toFixed(2)}
                    </span>
                  </div>
                  {viewingExpense.expenseShares && viewingExpense.expenseShares.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-semibold text-sm sm:text-base">Total Owed:</span>
                      <span className="text-base sm:text-lg font-bold text-blue-600">
                        {getCurrencySymbol()}
                        {viewingExpense.expenseShares.reduce(
                          (sum, s) => sum + parseFloat(s.owedAmount),
                          0
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                    <span className="text-gray-700 font-bold text-sm sm:text-base">Number of Payers:</span>
                    <span className="text-base sm:text-lg font-extrabold text-primary-600">
                      {viewingExpense.expensePayments.length}
                    </span>
                  </div>
                  {viewingExpense.expenseShares && viewingExpense.expenseShares.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-bold text-sm sm:text-base">Split Between:</span>
                      <span className="text-base sm:text-lg font-extrabold text-primary-600">
                        {viewingExpense.expenseShares.length} members
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => setViewingExpense(null)}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm sm:text-base w-full sm:w-auto"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewingExpense(null)
                    handleEdit(viewingExpense)
                  }}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base"
                >
                  ✏️ Edit Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
          <div className="text-6xl mb-4">💰</div>
          <p className="text-gray-600 text-xl font-semibold">No expenses found</p>
          <p className="text-gray-400 text-sm mt-2">
            No expenses found for {monthName} {selectedYear}. Add your first expense to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => {
            const totalPaid = expense.expensePayments.reduce(
              (sum, p) => sum + parseFloat(p.paidAmount),
              0
            )
            return (
              <div
                key={expense.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {expense.title}
                    </h3>
                    {expense.description && (
                      <p className="text-sm text-gray-600 mt-1 mb-3">
                        {expense.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                        {expense.category}
                      </span>
                      <span className="text-sm text-gray-600">
                        📅 {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {getCurrencySymbol()}{totalPaid.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(expense)}
                      className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all font-semibold text-sm"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-primary-600 hover:text-primary-700 px-3 py-2 rounded-lg hover:bg-primary-50 transition-all font-semibold text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-all font-semibold text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                <div className="border-t-2 border-gray-100 pt-4 mt-4">
                  <div className="text-sm sm:text-base">
                    <div className="font-bold text-gray-700 mb-3">Paid by:</div>
                    <div className="space-y-2">
                      {expense.expensePayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <span className="font-semibold text-gray-700 text-sm sm:text-base">
                            {payment.member?.fullName || 'Unknown'}
                          </span>
                          <span className="font-bold text-gray-900 text-sm sm:text-base">
                            {getCurrencySymbol()}{parseFloat(payment.paidAmount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Expenses

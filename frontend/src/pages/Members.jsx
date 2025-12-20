import { useEffect, useState } from 'react'
import { useRoom } from '../context/RoomContext'
import { memberAPI } from '../services/api'
import Modal from '../components/Modal'

const Members = () => {
  const { currentRoomId } = useRoom()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null, confirmText: 'OK', cancelText: 'Cancel', showCancel: false })
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    nickname: '',
    phoneNumber: '',
  })

  useEffect(() => {
    if (currentRoomId) {
      loadMembers()
    }
  }, [currentRoomId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await memberAPI.getByRoom(currentRoomId)
      setMembers(response.data)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingMember) {
        await memberAPI.update(editingMember.id, formData)
      } else {
        await memberAPI.create({
          ...formData,
          roomId: currentRoomId,
        })
      }
      setShowAddForm(false)
      setEditingMember(null)
      setFormData({ fullName: '', email: '', nickname: '', phoneNumber: '' })
      loadMembers()
    } catch (error) {
      console.error('Error saving member:', error)
      alert('Failed to save member. Please try again.')
    }
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setFormData({
      fullName: member.fullName,
      email: member.email || '',
      nickname: member.nickname || '',
      phoneNumber: member.phoneNumber || '',
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id) => {
    setModal({
      isOpen: true,
      title: 'Remove Member',
      message: 'Are you sure you want to remove this member? This action cannot be undone.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await memberAPI.delete(id)
          loadMembers()
          setModal({
            isOpen: true,
            title: 'Success',
            message: 'Member removed successfully.',
            type: 'success',
            onConfirm: null,
            confirmText: 'OK',
            showCancel: false
          })
        } catch (error) {
          console.error('Error deleting member:', error)
          setModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to remove member. Please try again.',
            type: 'error',
            onConfirm: null,
            confirmText: 'OK',
            showCancel: false
          })
        }
      },
      confirmText: 'Remove',
      cancelText: 'Cancel',
      showCancel: true
    })
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingMember(null)
    setFormData({ fullName: '', email: '', nickname: '', phoneNumber: '' })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading members...</div>
      </div>
    )
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
          Room Members
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto"
        >
          + Add Member
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-xl p-5 sm:p-8 mb-6 sm:mb-8 border-2 border-gray-100">
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-5 sm:mb-6">
            {editingMember ? 'Edit Member' : 'Add New Member'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nickname
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
                placeholder="Optional nickname"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row space-y-reverse space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-100 text-gray-700 px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm sm:text-base w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto"
              >
                {editingMember ? 'Update' : 'Add'} Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      {members.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center border-2 border-gray-100">
          <div className="text-5xl sm:text-6xl mb-4">👥</div>
          <p className="text-gray-600 text-lg sm:text-xl font-bold">No members added yet</p>
          <p className="text-gray-400 text-sm sm:text-base mt-2 font-medium">
            Click "Add Member" to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-all border-2 border-gray-100 hover:border-primary-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-1 leading-tight">
                    {member.fullName}
                  </h3>
                  {member.nickname && (
                    <p className="text-sm text-primary-600 font-bold mb-2">@{member.nickname}</p>
                  )}
                  <div className="space-y-1.5">
                    {member.email && (
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 font-medium">
                        <span>📧</span> {member.email}
                      </p>
                    )}
                    {member.phoneNumber && (
                      <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2 font-medium">
                        <span>📱</span> {member.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
                {!member.isActive && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 sm:px-3 py-1 rounded-full font-bold">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex space-x-2 pt-4 border-t-2 border-gray-100">
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 bg-primary-50 text-primary-700 px-3 sm:px-4 py-2.5 rounded-lg hover:bg-primary-100 transition-all text-xs sm:text-sm font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="flex-1 bg-red-50 text-red-700 px-3 sm:px-4 py-2.5 rounded-lg hover:bg-red-100 transition-all text-xs sm:text-sm font-bold"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Members

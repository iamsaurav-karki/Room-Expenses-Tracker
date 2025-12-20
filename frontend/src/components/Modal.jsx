import { useEffect } from 'react'

const Modal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'OK', cancelText = 'Cancel', showCancel = false }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'confirm':
        return '❓'
      default:
        return 'ℹ️'
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconText: 'text-green-600',
          button: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
          border: 'border-green-200'
        }
      case 'error':
        return {
          iconBg: 'bg-red-100',
          iconText: 'text-red-600',
          button: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
          border: 'border-red-200'
        }
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          iconText: 'text-yellow-600',
          button: 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800',
          border: 'border-yellow-200'
        }
      case 'confirm':
        return {
          iconBg: 'bg-blue-100',
          iconText: 'text-blue-600',
          button: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800',
          border: 'border-blue-200'
        }
      default:
        return {
          iconBg: 'bg-blue-100',
          iconText: 'text-blue-600',
          button: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800',
          border: 'border-blue-200'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
        {/* Header */}
        <div className={`px-5 sm:px-6 py-4 sm:py-5 border-b-2 ${colors.border}`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`${colors.iconBg} w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0`}>
              {getIcon()}
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 flex-1 leading-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl font-light transition-colors flex-shrink-0"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5 sm:py-6">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 bg-gray-50 rounded-b-2xl flex flex-col-reverse sm:flex-row justify-end gap-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold text-sm sm:text-base w-full sm:w-auto"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-5 sm:px-6 py-2.5 sm:py-3 text-white rounded-lg transition-all shadow-lg hover:shadow-xl font-semibold text-sm sm:text-base w-full sm:w-auto ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal

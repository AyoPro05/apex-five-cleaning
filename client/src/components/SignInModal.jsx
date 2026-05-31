import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import SignInForm from './SignInForm'
import SignUpForm from './SignUpForm'
import { buildAccountUrl, sanitizeReturnTo } from '../utils/authRedirect'

export default function SignInModal({ isOpen, onClose, onSwitchToSignUp }) {
  const navigate = useNavigate()
  const location = useLocation()

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSuccess = ({ returnTo } = {}) => {
    onClose()
    const redirectTo = sanitizeReturnTo(returnTo || location.state?.from?.pathname)
    if (redirectTo !== location.pathname) {
      navigate(redirectTo, { replace: true, state: {} })
    }
  }

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log in or sign up"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative my-auto" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Log in or sign up</h2>
        <p className="text-gray-600 mb-6">Access your dashboard, bookings, and payments.</p>
        <SignInForm
          onSuccess={handleSuccess}
          onSwitchToSignUp={() => {
            onClose()
            onSwitchToSignUp?.()
          }}
          idPrefix="modal-signin"
        />
        <p className="mt-4 text-center text-xs text-gray-500">
          Prefer a full page?{' '}
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate(buildAccountUrl({ signIn: true, returnTo: location.pathname }))
            }}
            className="text-teal-600 font-medium hover:underline"
          >
            Open account page
          </button>
        </p>
      </div>
    </div>
  )
  return createPortal(modal, document.body)
}

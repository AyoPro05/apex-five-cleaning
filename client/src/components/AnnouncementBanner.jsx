import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAnnouncement } from '../context/AnnouncementContext'

const STORAGE_KEY = 'apex_announcement_dismissed'

export default function AnnouncementBanner() {
  const { isAuthenticated } = useAuth()
  const { setVisible } = useAnnouncement()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const isDismissed = stored === '1'
      setDismissed(isDismissed)
      setVisible(!isDismissed)
    } catch {
      setDismissed(false)
      setVisible(true)
    }
    return () => setVisible(false)
  }, [setVisible])

  const handleDismiss = (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      localStorage.setItem(STORAGE_KEY, '1')
      setDismissed(true)
      setVisible(false)
    } catch {}
  }

  if (dismissed) return null

  const referralLink = isAuthenticated ? '/dashboard?tab=referral' : '/faq'

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#1e3a5f] text-white text-center h-[4vh] min-h-[28px] flex items-center justify-center px-4">
      <Link
        to={referralLink}
        className="block w-full pr-8 hover:opacity-90 transition text-sm"
      >
        <span className="font-semibold">ANNOUNCEMENT: </span>
        REFER A FRIEND AND BOTH SHARE £10! CLICK TO FIND OUT HOW.
      </Link>
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-white/90 hover:text-white transition"
        aria-label="Dismiss announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

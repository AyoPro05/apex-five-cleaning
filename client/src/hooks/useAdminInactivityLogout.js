import { useEffect, useRef } from 'react'

export const ADMIN_IDLE_MS = 10 * 60 * 1000
export const ADMIN_LAST_ACTIVITY_KEY = 'adminLastActivityAt'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

function readLastActivity() {
  const raw = sessionStorage.getItem(ADMIN_LAST_ACTIVITY_KEY)
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : Date.now()
}

function writeLastActivity() {
  sessionStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()))
}

/**
 * Signs admin out after ADMIN_IDLE_MS without pointer/keyboard/scroll activity.
 */
export function useAdminInactivityLogout(isLoggedIn, onIdleLogout) {
  const logoutRef = useRef(onIdleLogout)
  logoutRef.current = onIdleLogout

  useEffect(() => {
    if (!isLoggedIn) return undefined

    if (Date.now() - readLastActivity() >= ADMIN_IDLE_MS) {
      logoutRef.current()
      return undefined
    }

    writeLastActivity()

    const onActivity = () => writeLastActivity()
    ACTIVITY_EVENTS.forEach((name) => {
      window.addEventListener(name, onActivity, { passive: true })
    })

    const timer = window.setInterval(() => {
      if (Date.now() - readLastActivity() >= ADMIN_IDLE_MS) {
        logoutRef.current()
      }
    }, 30_000)

    return () => {
      ACTIVITY_EVENTS.forEach((name) => {
        window.removeEventListener(name, onActivity)
      })
      window.clearInterval(timer)
    }
  }, [isLoggedIn])
}

export function clearAdminActivityTimestamp() {
  sessionStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY)
}

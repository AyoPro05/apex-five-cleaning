import { useEffect, useRef } from 'react'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

function readLastActivity(storageKey) {
  const raw = sessionStorage.getItem(storageKey)
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : Date.now()
}

function writeLastActivity(storageKey) {
  sessionStorage.setItem(storageKey, String(Date.now()))
}

/**
 * Signs the user out after idleMs without pointer/keyboard/scroll activity.
 */
export function useInactivityLogout(isLoggedIn, idleMs, storageKey, onIdleLogout) {
  const logoutRef = useRef(onIdleLogout)
  logoutRef.current = onIdleLogout

  useEffect(() => {
    if (!isLoggedIn) return undefined

    if (Date.now() - readLastActivity(storageKey) >= idleMs) {
      logoutRef.current()
      return undefined
    }

    writeLastActivity(storageKey)

    const onActivity = () => writeLastActivity(storageKey)
    ACTIVITY_EVENTS.forEach((name) => {
      window.addEventListener(name, onActivity, { passive: true })
    })

    const timer = window.setInterval(() => {
      if (Date.now() - readLastActivity(storageKey) >= idleMs) {
        logoutRef.current()
      }
    }, 30_000)

    return () => {
      ACTIVITY_EVENTS.forEach((name) => {
        window.removeEventListener(name, onActivity)
      })
      window.clearInterval(timer)
    }
  }, [isLoggedIn, idleMs, storageKey])
}

export function clearInactivityTimestamp(storageKey) {
  sessionStorage.removeItem(storageKey)
}

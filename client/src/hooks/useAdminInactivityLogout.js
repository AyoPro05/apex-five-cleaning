import { useInactivityLogout, clearInactivityTimestamp } from './useInactivityLogout'

export const ADMIN_IDLE_MS = 10 * 60 * 1000
export const ADMIN_LAST_ACTIVITY_KEY = 'adminLastActivityAt'

export function useAdminInactivityLogout(isLoggedIn, onIdleLogout) {
  return useInactivityLogout(isLoggedIn, ADMIN_IDLE_MS, ADMIN_LAST_ACTIVITY_KEY, onIdleLogout)
}

export function clearAdminActivityTimestamp() {
  clearInactivityTimestamp(ADMIN_LAST_ACTIVITY_KEY)
}

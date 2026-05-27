import { useInactivityLogout, clearInactivityTimestamp } from './useInactivityLogout'

export const CUSTOMER_IDLE_MS = 20 * 60 * 1000
export const CUSTOMER_LAST_ACTIVITY_KEY = 'customerLastActivityAt'

export function useCustomerInactivityLogout(isLoggedIn, onIdleLogout) {
  return useInactivityLogout(isLoggedIn, CUSTOMER_IDLE_MS, CUSTOMER_LAST_ACTIVITY_KEY, onIdleLogout)
}

export function clearCustomerActivityTimestamp() {
  clearInactivityTimestamp(CUSTOMER_LAST_ACTIVITY_KEY)
}

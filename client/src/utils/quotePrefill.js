/**
 * One-time profile → quote form prefill (sessionStorage, consumed on Quote mount).
 */

const KEY = 'apexQuotePrefill'

export function setQuotePrefill(data) {
  if (typeof window === 'undefined' || !data) return
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() }))
  } catch {
    /* ignore quota errors */
  }
}

export function loadAndClearQuotePrefill() {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    sessionStorage.removeItem(KEY)
    const parsed = JSON.parse(raw)
    delete parsed.savedAt
    return parsed
  } catch {
    sessionStorage.removeItem(KEY)
    return null
  }
}

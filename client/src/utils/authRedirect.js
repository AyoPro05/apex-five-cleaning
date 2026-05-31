/** Only allow same-origin relative paths for post-login redirects. */
export function sanitizeReturnTo(value, fallback = '/dashboard') {
  if (!value || typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  if (trimmed.startsWith('/admin')) return fallback
  if (trimmed.startsWith('/account')) return fallback
  return trimmed
}

export function buildAccountUrl({ signIn = false, signUp = false, returnTo } = {}) {
  const params = new URLSearchParams()
  if (signIn) params.set('signin', '1')
  if (signUp) params.set('signup', '1')
  if (returnTo) params.set('returnTo', sanitizeReturnTo(returnTo))
  const query = params.toString()
  return query ? `/account?${query}` : '/account'
}

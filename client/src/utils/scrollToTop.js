/**
 * Scroll window and document roots to top (used on route change and repeat nav clicks).
 */
export function scrollPageToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  if (typeof document.documentElement.scrollTo === 'function') {
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
  const main = document.querySelector('main')
  if (main) main.scrollTop = 0
}

/** Normalize react-router `to` prop to a pathname for comparison. */
export function pathFromTo(to) {
  if (typeof to === 'string') {
    return to.split('?')[0].split('#')[0] || '/'
  }
  if (to && typeof to === 'object' && to.pathname) {
    return to.pathname
  }
  return '/'
}

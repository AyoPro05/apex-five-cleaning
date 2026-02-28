import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to top of page when route changes (e.g. navbar navigation).
 * Without this, React Router keeps the previous scroll position.
 * Ensures window and document roots are scrolled so the page always starts from the top.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Immediate scroll so the new page is shown from the top (no smooth scroll delay)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    if (typeof document.documentElement.scrollTo === 'function') {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    const main = document.querySelector('main')
    if (main) main.scrollTop = 0
  }, [pathname])

  return null
}

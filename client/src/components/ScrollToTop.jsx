import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scrolls to top of page when route changes (e.g. navbar navigation).
 * Without this, React Router keeps the previous scroll position.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

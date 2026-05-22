import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { scrollPageToTop } from '../utils/scrollToTop'

/**
 * Scrolls to top when the route pathname changes.
 * Repeat clicks on the current route are handled by ScrollRestoringLink.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    scrollPageToTop()
  }, [pathname])

  return null
}

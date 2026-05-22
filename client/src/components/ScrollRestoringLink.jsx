import { Link, useLocation } from 'react-router-dom'
import { pathFromTo, scrollPageToTop } from '../utils/scrollToTop'

/**
 * Like Link, but scrolls to top when the target path is already active
 * (e.g. Home while already on /).
 */
export default function ScrollRestoringLink({ to, onClick, children, ...props }) {
  const location = useLocation()
  const targetPath = pathFromTo(to)

  const handleClick = (e) => {
    onClick?.(e)
    if (!e.defaultPrevented && location.pathname === targetPath) {
      scrollPageToTop()
    }
  }

  return (
    <Link to={to} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}

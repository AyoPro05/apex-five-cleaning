import { GOOGLE_MAPS_URL, COMPANY_ADDRESS_LINE1, COMPANY_ADDRESS_LINE2 } from '../config/site'

/**
 * Two-line company address with optional link to Google Maps.
 */
export default function CompanyAddress({ asLink = true, className = '', linkClassName = '' }) {
  const content = (
    <>
      {COMPANY_ADDRESS_LINE1}
      <br />
      {COMPANY_ADDRESS_LINE2}
    </>
  )

  if (asLink) {
    return (
      <a
        href={GOOGLE_MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName || className}
      >
        {content}
      </a>
    )
  }

  return <address className={`not-italic ${className}`}>{content}</address>
}

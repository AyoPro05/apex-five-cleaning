import { Facebook, Instagram } from 'lucide-react'

const SocialBrandIcon = ({ type, className = 'w-5 h-5', ...props }) => {
  if (type === 'facebook') {
    return <Facebook className={className} aria-hidden="true" {...props} />
  }

  if (type === 'instagram') {
    return <Instagram className={className} aria-hidden="true" {...props} />
  }

  if (type === 'tiktok') {
    return (
      <svg
        className={className}
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        {...props}
      >
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.1 1.72 2.89 2.89 0 0 1 5.1-1.72V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 9 20.1a6.34 6.34 0 0 0 5.29-2.61 6.27 6.27 0 0 0 1.19-3.63v-6.16a7.28 7.28 0 0 0 4.81 1.65c.18 0 .37 0 .56-.01v-3.4a4.9 4.9 0 0 1-.56.03z" />
      </svg>
    )
  }

  return null
}

export default SocialBrandIcon

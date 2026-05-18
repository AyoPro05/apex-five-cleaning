/**
 * Site configuration - single source of truth for domain/URLs and contact numbers.
 * Update here when changing domains or phone numbers.
 */
export const SITE_URL = 'https://www.apexfivecleaning.co.uk'
export const SITE_NAME = 'Apex Five Cleaning'
export const CONTACT_EMAIL = 'info@apexfivecleaning.co.uk'

/** Main landline — call / contact on site and in emails */
export const PHONE_MAIN_DISPLAY = '020 3535 6331'
export const PHONE_MAIN_TEL = '+442035356331'
export const PHONE_MAIN_HREF = `tel:${PHONE_MAIN_TEL}`

/** Mobile — WhatsApp only */
export const WHATSAPP_NUMBER = '447377280558'
export const WHATSAPP_DISPLAY = '+44 7377 280558'

const DEFAULT_WHATSAPP_TEXT = "Hi Apex Five Cleaning, I'd like to enquire about your services."

export function whatsappHref(text = DEFAULT_WHATSAPP_TEXT) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

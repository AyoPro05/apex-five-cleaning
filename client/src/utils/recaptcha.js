/**
 * reCAPTCHA v3 helpers (shared by quote and contact forms).
 */

export function loadRecaptchaScript(dataset = 'site-forms') {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  if (!siteKey || typeof window === 'undefined' || window.grecaptcha) return

  const existing = document.querySelector(`script[data-recaptcha="${dataset}"]`)
  if (existing) return

  const script = document.createElement('script')
  script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
  script.async = true
  script.defer = true
  script.dataset.recaptcha = dataset
  document.head.appendChild(script)
}

export function getRecaptchaSiteKey() {
  return import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''
}

/**
 * @param {string} action - reCAPTCHA action name
 * @returns {Promise<string>} token or empty string when site key not configured
 */
export async function getRecaptchaToken(action = 'submit') {
  const siteKey = getRecaptchaSiteKey()
  if (!siteKey) return ''

  if (!window.grecaptcha) {
    throw new Error('Security check is still loading. Please wait a few seconds and try again.')
  }

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(siteKey, { action }).then(resolve).catch(reject)
    })
  })
}

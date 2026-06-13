import * as Sentry from '@sentry/react'

const parseSampleRate = (value, fallback) => {
  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed
  return fallback
}

export const isClientSentryEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN)

export const initClientSentry = () => {
  if (!isClientSentryEnabled) return

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    tracesSampleRate: parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE, 0.1),
  })
}

export const captureClientException = (error, context = {}) => {
  if (!isClientSentryEnabled) return
  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })
    }
    if (context.extra) {
      scope.setExtras(context.extra)
    }
    Sentry.captureException(error)
  })
}

export const triggerClientSentryTest = () => {
  throw new Error('Client Sentry test error')
}


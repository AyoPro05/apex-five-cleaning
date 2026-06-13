import * as Sentry from "@sentry/node";

const parseSampleRate = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed;
  return fallback;
};

export const isServerSentryEnabled = () => Boolean(process.env.SENTRY_DSN);

export const initServerSentry = () => {
  if (!isServerSentryEnabled()) return false;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.1),
  });

  return true;
};

export const captureServerException = (error, context = {}) => {
  if (!isServerSentryEnabled()) return;

  const normalizedError =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown server error");

  Sentry.withScope((scope) => {
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, String(value));
      });
    }
    if (context.extra) {
      scope.setExtras(context.extra);
    }
    if (context.user) {
      scope.setUser(context.user);
    }
    if (context.request) {
      scope.setContext("request", context.request);
    }
    Sentry.captureException(normalizedError);
  });
};

export const sentryRequestContext = (req, res, next) => {
  if (!isServerSentryEnabled()) return next();
  req.captureException = (error, extras = {}) => {
    captureServerException(error, {
      ...extras,
      request: {
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        params: req.params,
      },
      user: req.user?._id
        ? {
            id: String(req.user._id),
            email: req.user.email || undefined,
            username: req.user.firstName || undefined,
          }
        : extras.user,
    });
  };
  next();
};


const DEFAULT_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

const PRODUCTION_FRONTEND_ORIGINS = [
  "https://www.apexfivecleaning.co.uk",
  "https://apexfivecleaning.co.uk",
];

export function getCorsOrigins({ env = process.env } = {}) {
  const corsOrigins = [...DEFAULT_CORS_ORIGINS];

  for (const origin of PRODUCTION_FRONTEND_ORIGINS) {
    if (!corsOrigins.includes(origin)) {
      corsOrigins.push(origin);
    }
  }

  if (env.CLIENT_URL) {
    const url = env.CLIENT_URL.replace(/\/$/, "");
    if (!corsOrigins.includes(url)) corsOrigins.push(url);
  }

  if (env.VERCEL_URL) {
    const url = `https://${env.VERCEL_URL.replace(/\/$/, "")}`;
    if (!corsOrigins.includes(url)) corsOrigins.push(url);
  }

  if (env.RENDER_EXTERNAL_URL) {
    const url = env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
    if (!corsOrigins.includes(url)) corsOrigins.push(url);
  }

  if (env.ADDITIONAL_CORS_ORIGINS) {
    env.ADDITIONAL_CORS_ORIGINS.split(",")
      .map((s) => s.trim().replace(/\/$/, ""))
      .filter(Boolean)
      .forEach((origin) => {
        if (!corsOrigins.includes(origin)) corsOrigins.push(origin);
      });
  }

  if (env.PRODUCTION_CORS_ORIGINS) {
    env.PRODUCTION_CORS_ORIGINS.split(",")
      .map((s) => s.trim().replace(/\/$/, ""))
      .filter(Boolean)
      .forEach((origin) => {
        if (!corsOrigins.includes(origin)) corsOrigins.push(origin);
      });
  }

  return corsOrigins;
}

export function buildCorsOptions({ env = process.env } = {}) {
  return {
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const corsOrigins = getCorsOrigins({ env });
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS origin denied: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "X-Idempotency-Key",
    ],
    exposedHeaders: ["Content-Length", "X-Kuma-Revision"],
  };
}

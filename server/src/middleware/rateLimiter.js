import rateLimit from 'express-rate-limit';

// Limit quote submissions: 5 quotes per 24 hours per IP
export const quoteRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'You have reached the maximum number of quote requests (5 per 24 hours). Please try again tomorrow or contact support.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for admin requests with valid auth
    return req.isAdmin === true;
  },
  keyGenerator: (req) => {
    // Use IP address as key, can also combine with email for more granular control
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many quote requests. Please try again in 24 hours.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// Limit by email: prevent same email from submitting too many quotes
export const emailRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Max 3 quotes per email per day
  message: 'This email has reached the maximum number of quote requests for today.',
  skip: (req) => req.isAdmin === true,
  keyGenerator: (req) => {
    return req.body.email?.toLowerCase() || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'This email address has reached the maximum number of quote requests for today. Please try again tomorrow.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

// General API rate limiter: prevent abuse
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.isAdmin === true
});

// Stricter limiter for password reset / sensitive endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per hour
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  quoteRateLimiter,
  emailRateLimiter,
  apiRateLimiter,
  strictRateLimiter
};

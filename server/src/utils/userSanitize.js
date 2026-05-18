/**
 * Strip sensitive fields before sending user documents to clients.
 */

const SENSITIVE_USER_FIELDS = [
  'password',
  'verificationToken',
  'verificationTokenExpiry',
  'passwordResetToken',
  'passwordResetExpires',
  'loginAttempts',
  'lockUntil',
];

export function sanitizeUserForClient(user) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete obj[field];
  }
  return obj;
}

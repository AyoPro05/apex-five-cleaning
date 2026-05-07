import crypto from "crypto";

const DEFAULT_TTL_SECONDS = 10 * 60; // 10 minutes
const QUOTE_UPLOAD_PATH_REGEX = /^\/uploads\/quotes\/[A-Za-z0-9._-]+$/;

const getSigningSecret = () =>
  process.env.UPLOAD_SIGNING_SECRET || process.env.JWT_SECRET || "";

const createSignature = (path, expires) => {
  const secret = getSigningSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${path}:${expires}`)
    .digest("hex");
};

export const signUploadPath = (path, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  if (!path || !QUOTE_UPLOAD_PATH_REGEX.test(path)) return null;
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = createSignature(path, expires);
  const params = new URLSearchParams({
    path,
    expires: String(expires),
    sig,
  });
  return `/api/uploads/protected?${params.toString()}`;
};

export const verifyUploadSignature = ({ path, expires, sig }) => {
  if (!path || !expires || !sig) return false;
  if (!QUOTE_UPLOAD_PATH_REGEX.test(path)) return false;

  const expiresNum = Number(expires);
  if (!Number.isFinite(expiresNum)) return false;
  if (expiresNum < Math.floor(Date.now() / 1000)) return false;

  const expected = createSignature(path, expiresNum);
  const given = String(sig);
  if (expected.length !== given.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(given));
};

export const signQuoteImages = (quote, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  if (!quote || !Array.isArray(quote.images)) return quote;
  return {
    ...quote,
    images: quote.images.map((img) => {
      if (!img?.url) return img;
      const signed = signUploadPath(img.url, ttlSeconds);
      return signed ? { ...img, url: signed } : img;
    }),
  };
};

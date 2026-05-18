/**
 * Safe image validation for quote uploads — extension + magic-byte sniffing.
 */

const SAFE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif']);

export function isAllowedImageExtension(filename) {
  const ext = (filename || '').toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || '';
  return ALLOWED_EXTENSIONS.has(ext);
}

export function sniffImageMimeType(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  // GIF
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46
  ) {
    return 'image/gif';
  }
  // WebP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  // HEIC / HEIF (ftyp box)
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    const brand = buffer.slice(8, 12).toString('ascii');
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) {
      return brand.startsWith('hei') ? 'image/heic' : 'image/heif';
    }
  }

  return null;
}

export function validateQuoteImageBuffer(buffer) {
  const mimeType = sniffImageMimeType(buffer);
  if (!mimeType || !SAFE_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: 'Invalid image file' };
  }
  return { ok: true, mimeType };
}

export function safeImageContentType(mimeType) {
  const normalized = String(mimeType || '').toLowerCase();
  return SAFE_MIME_TYPES.has(normalized) ? normalized : 'image/jpeg';
}

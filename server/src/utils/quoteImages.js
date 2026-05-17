import fs from "fs";
import path from "path";
import { quotesUploadDir } from "../middleware/uploadMiddleware.js";

/** Strip base64 payloads from API JSON; use /api/admin/quotes/:id/images/:index to view. */
export function sanitizeQuoteImagesForApi(quote) {
  const obj = quote?.toObject ? quote.toObject() : { ...quote };
  if (!obj?._id || !Array.isArray(obj.images)) return obj;

  obj.images = obj.images.map((img, index) => ({
    filename: img?.filename,
    mimeType: img?.mimeType,
    hasData: Boolean(img?.data),
    url: `/api/admin/quotes/${obj._id}/images/${index}`,
  }));

  return obj;
}

export function resolveQuoteImageBuffer(image) {
  if (!image) return null;

  if (image.data) {
    try {
      return {
        buffer: Buffer.from(image.data, "base64"),
        mimeType: image.mimeType || "image/jpeg",
      };
    } catch {
      return null;
    }
  }

  if (!image.url) return null;

  const filename = path.basename(image.url);
  const filePath = path.join(quotesUploadDir, filename);
  if (!filePath.startsWith(quotesUploadDir) || !fs.existsSync(filePath)) {
    return null;
  }

  return {
    buffer: fs.readFileSync(filePath),
    mimeType: image.mimeType || "image/jpeg",
  };
}

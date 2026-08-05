import multer from "multer";
import path from "path";
import os from "os";

// Disk path is no longer created or written to in serverless (read-only FS).
// Kept as a constant for legacy disk-fallback readers (uploads route / quoteImages),
// which gracefully fall back to the MongoDB-stored base64 payload when the file
// is absent on disk.
export const quotesUploadDir = path.join(os.tmpdir(), "uploads", "quotes");

// Filter: allowlisted extensions only (no image/* wildcard — blocks SVG etc.)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowed = /^\.(jpe?g|png|gif|webp|heic|heif)$/i;
  if (allowed.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, GIF, WebP, and HEIC images are allowed"));
  }
};

// Memory storage — required for Vercel serverless (read-only filesystem).
// Uploaded files are exposed as buffers on req.file / req.files (.buffer).
export const quoteImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});

export default quoteImageUpload;

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use path relative to server root so uploads work regardless of cwd
const serverRoot = path.join(__dirname, "..");
const uploadDir = path.join(serverRoot, "uploads", "quotes");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage - save to uploads/quotes/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `quote-${uniqueSuffix}${ext}`);
  },
});

// Filter: only allow image files
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/i;
  const ext = path.extname(file.originalname)?.slice(1) || "";
  const mimetype = file.mimetype;
  if (allowed.test(ext) || mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed"));
  }
};

// Max 5 images, 3MB each
export const quoteImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024, files: 5 },
});

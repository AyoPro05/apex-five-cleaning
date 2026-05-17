/**
 * One-off: copy quote images from legacy server/src/uploads/quotes into MongoDB
 * and/or server/uploads/quotes. Run from server/: node scripts/backfill-quote-image-data.js
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Quote from "../src/models/Quote.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const legacyDir = path.resolve(__dirname, "..", "src", "uploads", "quotes");
const currentDir = path.resolve(__dirname, "..", "uploads", "quotes");

const readDirs = [currentDir, legacyDir].filter((dir) => fs.existsSync(dir));

const guessMime = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
  };
  return map[ext] || "image/jpeg";
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const quotes = await Quote.find({
    isDeleted: { $ne: true },
    "images.0": { $exists: true },
  });

  let updated = 0;

  for (const quote of quotes) {
    let changed = false;

    for (const img of quote.images) {
      if (!img?.url || img.data) continue;

      const filename = path.basename(img.url);
      let filePath = null;

      for (const dir of readDirs) {
        const candidate = path.join(dir, filename);
        if (fs.existsSync(candidate)) {
          filePath = candidate;
          break;
        }
      }

      if (!filePath) continue;

      const buffer = fs.readFileSync(filePath);
      img.data = buffer.toString("base64");
      if (!img.mimeType) img.mimeType = guessMime(filename);
      changed = true;

      const target = path.join(currentDir, filename);
      if (!fs.existsSync(target)) {
        fs.mkdirSync(currentDir, { recursive: true });
        fs.copyFileSync(filePath, target);
      }
    }

    if (changed) {
      await quote.save();
      updated += 1;
      console.log(`Updated ${quote.reference || quote._id}`);
    }
  }

  console.log(`Done. Quotes updated: ${updated}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

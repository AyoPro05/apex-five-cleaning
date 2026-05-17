import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Quote from "../models/Quote.js";
import { verifyUploadSignature } from "../utils/uploadSigning.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..", "..");
const uploadRoot = path.join(serverRoot, "uploads");
const quotesUploadRoot = path.join(uploadRoot, "quotes");

const serveQuoteImageFromDb = async (requested, res) => {
  const quote = await Quote.findOne({
    isDeleted: { $ne: true },
    "images.url": requested,
  })
    .select("images")
    .lean();

  const image = quote?.images?.find((img) => img?.url === requested);
  if (!image?.data) return false;

  const buffer = Buffer.from(image.data, "base64");
  res.setHeader("Content-Type", image.mimeType || "image/jpeg");
  res.setHeader("Cache-Control", "private, max-age=300");
  res.send(buffer);
  return true;
};

router.get("/protected", async (req, res) => {
  try {
    const { path: uploadPath, expires, sig } = req.query;
    if (
      !verifyUploadSignature({
        path: String(uploadPath || ""),
        expires: String(expires || ""),
        sig: String(sig || ""),
      })
    ) {
      return res.status(403).json({ success: false, error: "Invalid or expired upload link" });
    }

    const requested = String(uploadPath);
    const filename = path.basename(requested);
    const filePath = path.join(quotesUploadRoot, filename);

    if (!filePath.startsWith(quotesUploadRoot)) {
      return res.status(400).json({ success: false, error: "Invalid upload path" });
    }

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath, async (err) => {
        if (!err || res.headersSent) return undefined;
        try {
          if (await serveQuoteImageFromDb(requested, res)) return undefined;
        } catch (dbErr) {
          console.warn("Upload Mongo fallback failed:", dbErr?.message || dbErr);
        }
        return res.status(404).json({ success: false, error: "File not found" });
      });
    }

    try {
      if (await serveQuoteImageFromDb(requested, res)) return undefined;
    } catch (dbErr) {
      console.warn("Upload Mongo fallback failed:", dbErr?.message || dbErr);
    }

    return res.status(404).json({ success: false, error: "File not found" });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to load upload" });
  }
});

export default router;

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { verifyUploadSignature } from "../utils/uploadSigning.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..", "..");
const uploadRoot = path.join(serverRoot, "uploads");
const quotesUploadRoot = path.join(uploadRoot, "quotes");

router.get("/protected", (req, res) => {
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

    return res.sendFile(filePath, (err) => {
      if (err) {
        if (!res.headersSent) {
          return res.status(404).json({ success: false, error: "File not found" });
        }
      }
      return undefined;
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to load upload" });
  }
});

export default router;

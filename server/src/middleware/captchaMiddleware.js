import axios from "axios";

/** Map Google reCAPTCHA error codes to user-friendly messages */
function captchaErrorMessage(errorCodes = []) {
  if (!Array.isArray(errorCodes) || errorCodes.length === 0) {
    return "CAPTCHA verification failed. Please try again.";
  }
  if (errorCodes.includes("timeout-or-duplicate")) {
    return "CAPTCHA expired. Please submit the form again.";
  }
  if (errorCodes.includes("invalid-input-response")) {
    return "CAPTCHA expired or invalid. Please refresh the page and try again.";
  }
  if (errorCodes.includes("invalid-input-secret") || errorCodes.includes("missing-input-secret")) {
    return "CAPTCHA verification is misconfigured. Please contact support.";
  }
  if (errorCodes.includes("bad-request")) {
    return "CAPTCHA request was invalid. Please try again.";
  }
  return "CAPTCHA verification failed. Please try again.";
}

export const verifyCaptcha = async (req, res, next) => {
  try {
    const token = req.body?.captchaToken;

    if (!token || typeof token !== "string" || !token.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "CAPTCHA token is required" });
    }

    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      console.error("CAPTCHA: RECAPTCHA_SECRET_KEY is not set");
      return res.status(500).json({
        success: false,
        error: "CAPTCHA is not configured. Please contact support.",
      });
    }

    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token.trim());
    const remoteip = req.ip || req.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (remoteip) params.append("remoteip", remoteip);

    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 }
    );

    const { success, score, action, "error-codes": errorCodes = [] } = response.data;

    console.log(`reCAPTCHA - success: ${success}, score: ${score}, action: ${action}`);

    if (!success) {
      console.warn("reCAPTCHA verify failed, error-codes:", errorCodes);
      return res.status(400).json({
        success: false,
        error: captchaErrorMessage(errorCodes),
      });
    }

    if (score != null && score < 0.5) {
      return res.status(429).json({
        success: false,
        error: "Suspicious activity detected. Please try again.",
      });
    }

    req.captcha = { verified: true, score, action };
    next();
  } catch (error) {
    console.error("CAPTCHA verification error:", error.message);
    return res.status(500).json({ success: false, error: "CAPTCHA error. Please try again." });
  }
};

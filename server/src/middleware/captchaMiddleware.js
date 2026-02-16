import axios from "axios";

export const verifyCaptcha = async (req, res, next) => {
  try {
    const token = req.body.captchaToken;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, error: "CAPTCHA token is required" });
    }

    // Verify with Google reCAPTCHA using URLSearchParams for better compatibility
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET_KEY);
    params.append("response", token);

    const response = await axios.post(
      "https://www.google.com/recaptcha/api/siteverify",
      params,
    );

    const { success, score, action } = response.data;

    // Log this so you can see the actual score in your terminal!
    console.log(`reCAPTCHA Result - Success: ${success}, Score: ${score}`);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: "CAPTCHA verification failed. Your session may have expired.",
      });
    }

    if (score < 0.5) {
      return res.status(429).json({
        success: false,
        error: "Suspicious activity detected. Please try again.",
      });
    }

    req.captcha = { verified: true, score, action };
    next();
  } catch (error) {
    console.error("CAPTCHA verification error:", error.message);
    return res.status(500).json({ success: false, error: "CAPTCHA error." });
  }
};

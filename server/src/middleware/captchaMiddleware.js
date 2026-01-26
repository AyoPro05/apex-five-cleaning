import axios from 'axios';

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const CAPTCHA_SCORE_THRESHOLD = 0.5; // Adjust based on your needs (0.0 to 1.0)

export const verifyCaptcha = async (req, res, next) => {
  try {
    const token = req.body.captchaToken;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'CAPTCHA token is required'
      });
    }
    
    // Verify with Google reCAPTCHA
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );
    
    const { success, score, action } = response.data;
    
    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'CAPTCHA verification failed. Please try again.'
      });
    }
    
    // Check if score meets threshold
    if (score < CAPTCHA_SCORE_THRESHOLD) {
      return res.status(429).json({
        success: false,
        error: 'Your request appears to be suspicious. Please try again later or contact support.'
      });
    }
    
    // Attach CAPTCHA data to request for logging
    req.captcha = {
      verified: true,
      score,
      action
    };
    
    next();
  } catch (error) {
    console.error('CAPTCHA verification error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'CAPTCHA verification encountered an error. Please try again.'
    });
  }
};

export const getCaptchaScore = (captchaData) => {
  return captchaData?.score || 0;
};

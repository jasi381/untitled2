import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['POST', 'GET'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'reCAPTCHA Verification API is running' });
});

// reCAPTCHA verification endpoint
app.post('/api/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA token is required'
      });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY is not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Verify the token with Google
    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await axios.post(verificationURL, null, {
      params: {
        secret: secretKey,
        response: token
      }
    });

    const { success, score, action, challenge_ts, hostname } = response.data;

    // For reCAPTCHA v3, you can check the score (0.0 - 1.0)
    // Higher score means more likely to be human
    if (success && score >= 0.5) {
      return res.json({
        success: true,
        score: score,
        action: action,
        timestamp: challenge_ts,
        hostname: hostname,
        message: 'Verification successful'
      });
    } else {
      return res.json({
        success: false,
        score: score,
        message: 'Verification failed - score too low or invalid token'
      });
    }

  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Verification failed due to server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 reCAPTCHA Verification API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Verify endpoint: http://localhost:${PORT}/api/verify-recaptcha`);
});

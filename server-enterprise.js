import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow all origins for testing
const corsOptions = {
  origin: true,
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'reCAPTCHA Verification API is running' });
});

// reCAPTCHA Enterprise verification endpoint
app.post('/api/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        score: null,
        message: 'reCAPTCHA token is required'
      });
    }

    const apiKey = process.env.RECAPTCHA_SECRET_KEY;
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID; // You need to add this
    const siteKey = process.env.RECAPTCHA_SITE_KEY; // You need to add this

    if (!apiKey || !projectId) {
      console.error('API Key or Project ID not configured');
      return res.status(500).json({
        success: false,
        score: null,
        message: 'Server configuration error'
      });
    }

    // Google Cloud reCAPTCHA Enterprise API
    const verificationURL = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

    const requestBody = {
      event: {
        token: token,
        siteKey: siteKey,
        expectedAction: 'submit'
      }
    };

    console.log('Sending request to Google Cloud reCAPTCHA Enterprise...');

    const response = await axios.post(verificationURL, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Google reCAPTCHA Enterprise Response:', JSON.stringify(response.data, null, 2));

    const { tokenProperties, riskAnalysis } = response.data;

    if (tokenProperties && tokenProperties.valid) {
      const score = riskAnalysis?.score || 0;

      if (score >= 0.5) {
        return res.json({
          success: true,
          score: score,
          action: tokenProperties.action,
          timestamp: tokenProperties.createTime,
          hostname: tokenProperties.hostname,
          message: 'Verification successful'
        });
      } else {
        return res.json({
          success: false,
          score: score,
          action: tokenProperties.action,
          timestamp: tokenProperties.createTime,
          hostname: tokenProperties.hostname,
          message: 'Verification failed - score too low'
        });
      }
    } else {
      return res.json({
        success: false,
        score: null,
        message: `Token invalid: ${tokenProperties?.invalidReason || 'Unknown reason'}`
      });
    }

  } catch (error) {
    console.error('reCAPTCHA verification error:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      score: null,
      message: 'Verification failed due to server error',
      error: error.response?.data || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 reCAPTCHA Enterprise Verification API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Verify endpoint: http://localhost:${PORT}/api/verify-recaptcha`);
});

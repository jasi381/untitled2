# reCAPTCHA v3 Verification API

A Node.js API server for verifying Google reCAPTCHA v3 tokens. This API can be used with web and mobile applications to verify reCAPTCHA tokens server-side.

## Features

- ✅ Google reCAPTCHA v3 verification
- ✅ CORS enabled for client-side communication
- ✅ Score-based validation (configurable threshold)
- ✅ Easy deployment to free hosting platforms
- ✅ Environment-based configuration

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your reCAPTCHA secret key:

```env
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key_here
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Get your reCAPTCHA keys:**
1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Register your site for reCAPTCHA v3
3. Copy the **Secret Key** to your `.env` file
4. Use the **Site Key** in your client-side application

### 3. Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "message": "reCAPTCHA Verification API is running"
}
```

### Verify reCAPTCHA Token
```
POST /api/verify-recaptcha
Content-Type: application/json

{
  "token": "reCAPTCHA_token_from_client"
}
```

Success Response:
```json
{
  "success": true,
  "score": 0.9,
  "action": "submit",
  "timestamp": "2024-01-01T00:00:00Z",
  "hostname": "yourdomain.com",
  "message": "Verification successful"
}
```

Failed Response:
```json
{
  "success": false,
  "score": 0.3,
  "message": "Verification failed - score too low or invalid token"
}
```

## Client-Side Integration

### Web (JavaScript)

```html
<!-- Add reCAPTCHA script -->
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>

<script>
async function verifyRecaptcha() {
  // Get reCAPTCHA token
  const token = await grecaptcha.execute('YOUR_SITE_KEY', { action: 'submit' });

  // Send to your API
  const response = await fetch('https://your-api-url.com/api/verify-recaptcha', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token })
  });

  const result = await response.json();
  console.log('Verification result:', result);

  if (result.success) {
    // Proceed with form submission
  } else {
    // Handle verification failure
  }
}
</script>
```

### Android (Kotlin)

```kotlin
// Add dependency in build.gradle
implementation 'com.google.android.gms:play-services-safetynet:18.0.1'

// Get reCAPTCHA token
SafetyNet.getClient(this).verifyWithRecaptcha(SITE_KEY)
    .addOnSuccessListener { response ->
        val token = response.tokenResult

        // Send to your API
        verifyToken(token)
    }

private fun verifyToken(token: String) {
    val client = OkHttpClient()
    val json = JSONObject().put("token", token)
    val body = RequestBody.create(
        "application/json".toMediaType(),
        json.toString()
    )

    val request = Request.Builder()
        .url("https://your-api-url.com/api/verify-recaptcha")
        .post(body)
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            val result = response.body?.string()
            // Handle response
        }

        override fun onFailure(call: Call, e: IOException) {
            // Handle error
        }
    })
}
```

## Free Hosting Options

### 1. **Render** (Recommended)
- **Free Tier**: 750 hours/month (enough for one always-on service)
- **Features**: Auto-deploy from Git, HTTPS, custom domains
- **Deployment**:
  1. Push your code to GitHub
  2. Go to [render.com](https://render.com)
  3. Create new "Web Service"
  4. Connect your GitHub repo
  5. Set build command: `npm install`
  6. Set start command: `npm start`
  7. Add environment variables in dashboard
  8. Deploy!

### 2. **Railway**
- **Free Tier**: $5 credit/month (runs ~500 hours)
- **Features**: Easy deployment, PostgreSQL included
- **Deployment**:
  1. Push code to GitHub
  2. Go to [railway.app](https://railway.app)
  3. "New Project" → "Deploy from GitHub"
  4. Select your repo
  5. Add environment variables
  6. Deploy automatically

### 3. **Fly.io**
- **Free Tier**: 3 shared VMs, 3GB storage
- **Features**: Global deployment, fast cold starts
- **Deployment**:
  ```bash
  # Install flyctl
  curl -L https://fly.io/install.sh | sh

  # Login
  fly auth login

  # Launch app
  fly launch

  # Set secrets
  fly secrets set RECAPTCHA_SECRET_KEY=your_key

  # Deploy
  fly deploy
  ```

### 4. **Vercel** (Serverless)
- **Free Tier**: Unlimited deployments
- **Note**: Requires small modification for serverless functions
- **Deployment**:
  ```bash
  npm i -g vercel
  vercel
  ```

### 5. **Cyclic**
- **Free Tier**: Unlimited apps
- **Features**: AWS infrastructure, instant deployment
- **Deployment**: Connect GitHub and deploy

## Score Threshold

The API uses a default score threshold of `0.5`. You can modify this in `server.js`:

```javascript
if (success && score >= 0.5) { // Change 0.5 to your preferred threshold
```

**Score ranges:**
- `0.9 - 1.0`: Very likely human
- `0.5 - 0.8`: Likely human
- `0.0 - 0.4`: Likely bot

## Security Best Practices

1. **Never expose your secret key** - Keep it in `.env` and never commit to Git
2. **Use HTTPS** - Always use HTTPS in production
3. **Validate origins** - Configure `ALLOWED_ORIGINS` properly
4. **Monitor scores** - Adjust threshold based on your use case
5. **Rate limiting** - Consider adding rate limiting for production

## License

ISC

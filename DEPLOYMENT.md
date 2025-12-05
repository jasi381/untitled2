# Deployment Guide - Free Hosting Options

## Quick Comparison

| Platform | Free Tier | Best For | Limitations |
|----------|-----------|----------|-------------|
| **Render** | 750 hrs/month | Always-on APIs | Spins down after 15 min inactivity |
| **Railway** | $5 credit/month | Quick deployments | Credit-based (runs ~500 hrs) |
| **Fly.io** | 3 VMs free | Global apps | 3 apps max |
| **Vercel** | Unlimited | Serverless APIs | 10s timeout on free tier |
| **Cyclic** | Unlimited apps | Multiple projects | AWS Lambda cold starts |

---

## 1. Render (Recommended for Beginners)

### Why Render?
- Simple setup, no CLI needed
- Auto-deploy from Git
- Free SSL/HTTPS
- Good for always-on services

### Step-by-Step Deployment

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Create Render account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create new Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Click "Connect" next to your repo

4. **Configure service**
   - **Name**: `recaptcha-api` (or any name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free"

5. **Add Environment Variables**
   - Click "Advanced" → "Add Environment Variable"
   - Add:
     - `RECAPTCHA_SECRET_KEY` = your secret key
     - `ALLOWED_ORIGINS` = your client URLs (comma-separated)

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Your API URL will be: `https://recaptcha-api-xxxx.onrender.com`

### Testing
```bash
curl https://your-app.onrender.com/health
```

---

## 2. Railway

### Why Railway?
- Extremely fast deployment
- Great developer experience
- Database support included

### Step-by-Step Deployment

1. **Push to GitHub** (same as above)

2. **Sign up at Railway**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

3. **Deploy**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway auto-detects Node.js

4. **Add Environment Variables**
   - Go to your project
   - Click "Variables" tab
   - Add:
     - `RECAPTCHA_SECRET_KEY`
     - `ALLOWED_ORIGINS`
     - `PORT` (Railway sets this automatically, but you can override)

5. **Get your URL**
   - Click "Settings" → "Generate Domain"
   - Your API: `https://recaptcha-api-production.up.railway.app`

### CLI Deployment (Alternative)
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

---

## 3. Fly.io

### Why Fly.io?
- Deploy globally (multiple regions)
- Fast cold starts
- Great performance

### Step-by-Step Deployment

1. **Install Fly CLI**
   ```bash
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh

   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login**
   ```bash
   fly auth login
   ```

3. **Launch app**
   ```bash
   fly launch
   ```

   You'll be asked:
   - App name: `recaptcha-api` (or any name)
   - Region: Choose closest to your users
   - PostgreSQL: No
   - Redis: No

4. **Set environment variables**
   ```bash
   fly secrets set RECAPTCHA_SECRET_KEY=your_secret_key
   fly secrets set ALLOWED_ORIGINS=https://yourdomain.com
   ```

5. **Deploy**
   ```bash
   fly deploy
   ```

6. **Your URL**
   ```
   https://recaptcha-api.fly.dev
   ```

### Fly.toml Configuration
The `fly launch` command creates this file. You can edit it:

```toml
app = "recaptcha-api"

[http_service]
  internal_port = 3000
  force_https = true
```

---

## 4. Vercel (Serverless)

### Why Vercel?
- Instant deployments
- Excellent for serverless
- Auto-scaling

### Setup for Vercel

1. **Create `vercel.json`**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/server.js"
       }
     ]
   }
   ```

2. **Modify server.js** (add at the end)
   ```javascript
   // For Vercel serverless
   export default app;
   ```

3. **Deploy**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add RECAPTCHA_SECRET_KEY
   vercel env add ALLOWED_ORIGINS
   ```

5. **Redeploy**
   ```bash
   vercel --prod
   ```

---

## 5. Cyclic

### Why Cyclic?
- Truly unlimited free tier
- AWS infrastructure
- Very simple deployment

### Step-by-Step

1. **Push to GitHub**

2. **Go to Cyclic**
   - Visit [cyclic.sh](https://cyclic.sh)
   - Sign in with GitHub

3. **Link Repository**
   - Click "Link Your Own"
   - Select your repository
   - Click "Connect"

4. **Configure**
   - Cyclic auto-detects settings
   - Go to "Variables" tab
   - Add your environment variables

5. **Deploy**
   - Automatic deployment
   - URL: `https://recaptcha-api.cyclic.app`

---

## Testing Your Deployed API

### Using cURL
```bash
# Health check
curl https://your-api-url.com/health

# Test verification (with dummy token)
curl -X POST https://your-api-url.com/api/verify-recaptcha \
  -H "Content-Type: application/json" \
  -d '{"token":"test_token"}'
```

### Using JavaScript
```javascript
fetch('https://your-api-url.com/api/verify-recaptcha', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'your_recaptcha_token' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Recommendation

**For this reCAPTCHA API, I recommend:**

1. **Render** - Best for beginners, simple setup, always-on
2. **Railway** - If you want faster deployment and better DX
3. **Fly.io** - If you need global deployment or have multiple apps

**Avoid for this use case:**
- Vercel - 10s timeout might be too short for some reCAPTCHA verifications
- Cyclic - Cold starts on AWS Lambda can add latency

---

## Monitoring Your Deployment

All platforms provide:
- Deployment logs
- Runtime logs
- Metrics/Analytics
- Error tracking

Check the logs if verification fails!

---

## Next Steps

1. Deploy using your chosen platform
2. Update `ALLOWED_ORIGINS` with your client URL
3. Get reCAPTCHA keys from Google
4. Test with your client application
5. Monitor the logs for any issues

Need help? Check the platform-specific documentation or create an issue.

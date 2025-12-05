# Postman Testing Guide - reCAPTCHA API

Complete guide to test your reCAPTCHA verification API using Postman.

**Your API URL:** `https://recaptcha-api-9lrd.onrender.com`

---

## Quick Setup

### 1. Install Postman
- Download from: https://www.postman.com/downloads/
- Or use Postman Web: https://web.postman.com/

### 2. Create a New Collection (Optional)
- Click "Collections" → "+" → Name it "reCAPTCHA API"

---

## Test 1: Health Check Endpoint

### Request Details
```
Method: GET
URL: https://recaptcha-api-9lrd.onrender.com/health
```

### Steps in Postman

1. **Create New Request**
   - Click "New" → "HTTP Request"
   - Or press `Ctrl+N` (Windows) or `Cmd+N` (Mac)

2. **Set Request Type**
   - Select `GET` from dropdown

3. **Enter URL**
   ```
   https://recaptcha-api-9lrd.onrender.com/health
   ```

4. **Send Request**
   - Click "Send" button

### Expected Response

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "status": "ok",
  "message": "reCAPTCHA Verification API is running"
}
```

**Screenshot:**
```
GET https://recaptcha-api-9lrd.onrender.com/health

Status: 200 OK
Time: ~200ms (may be slower on first request due to cold start)

Body:
{
  "status": "ok",
  "message": "reCAPTCHA Verification API is running"
}
```

---

## Test 2: Verify reCAPTCHA Token (Basic Test)

### Request Details
```
Method: POST
URL: https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha
Headers: Content-Type: application/json
Body: {"token": "test_token_here"}
```

### Steps in Postman

1. **Create New Request**
   - Click "New" → "HTTP Request"

2. **Set Request Type**
   - Select `POST` from dropdown

3. **Enter URL**
   ```
   https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha
   ```

4. **Set Headers**
   - Click "Headers" tab
   - Add:
     - Key: `Content-Type`
     - Value: `application/json`

5. **Set Request Body**
   - Click "Body" tab
   - Select "raw"
   - Select "JSON" from dropdown (right side)
   - Enter:
   ```json
   {
     "token": "test_dummy_token_12345"
   }
   ```

6. **Send Request**
   - Click "Send"

### Expected Response (With Dummy Token)

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": false,
  "score": null,
  "message": "Verification failed - score too low or invalid token"
}
```

**Note:** This will fail because we're using a dummy token. That's expected! It confirms your API is working.

---

## Test 3: With Real reCAPTCHA Token

To test with a real token, you need to get one from Google first.

### Option A: Get Token from Web Console

1. **Open Browser Console**
   - Open any webpage
   - Press `F12` or right-click → "Inspect"
   - Go to "Console" tab

2. **Load reCAPTCHA Script**
   - Paste this in console:
   ```javascript
   // Load reCAPTCHA script
   const script = document.createElement('script');
   script.src = 'https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY';
   document.head.appendChild(script);

   // Wait 2 seconds, then get token
   setTimeout(async () => {
     const token = await grecaptcha.execute('YOUR_SITE_KEY', {action: 'submit'});
     console.log('Token:', token);
   }, 2000);
   ```

3. **Replace `YOUR_SITE_KEY`** with your actual site key

4. **Copy the token** from console output

5. **Use in Postman**
   - Paste the token in request body:
   ```json
   {
     "token": "paste_real_token_here"
   }
   ```

### Option B: Use the HTML File

1. **Open `example-client.html`**
   - Update the site key and API URL
   - Open in browser
   - Open browser console (`F12`)
   - Click submit button
   - Copy the token from console logs

2. **Use in Postman** as shown above

### Expected Response (With Real Token)

**Status Code:** `200 OK`

**Response Body:**
```json
{
  "success": true,
  "score": 0.9,
  "action": "submit",
  "timestamp": "2024-12-05T10:30:00Z",
  "hostname": "localhost",
  "message": "Verification successful"
}
```

---

## Postman Collection JSON

Save this as a Postman Collection:

```json
{
  "info": {
    "name": "reCAPTCHA Verification API",
    "description": "Test collection for reCAPTCHA v3 API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "https://recaptcha-api-9lrd.onrender.com/health",
          "protocol": "https",
          "host": ["recaptcha-api-9lrd", "onrender", "com"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Verify Token (Dummy)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"token\": \"test_dummy_token_12345\"\n}"
        },
        "url": {
          "raw": "https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha",
          "protocol": "https",
          "host": ["recaptcha-api-9lrd", "onrender", "com"],
          "path": ["api", "verify-recaptcha"]
        }
      }
    },
    {
      "name": "Verify Token (Real)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"token\": \"{{recaptcha_token}}\"\n}"
        },
        "url": {
          "raw": "https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha",
          "protocol": "https",
          "host": ["recaptcha-api-9lrd", "onrender", "com"],
          "path": ["api", "verify-recaptcha"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "recaptcha_token",
      "value": "your_real_token_here",
      "type": "string"
    }
  ]
}
```

### Import Collection to Postman

1. Copy the JSON above
2. Open Postman
3. Click "Import" button (top left)
4. Select "Raw text"
5. Paste the JSON
6. Click "Import"

---

## Testing Different Scenarios

### Test 1: Missing Token

**Request Body:**
```json
{}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "reCAPTCHA token is required"
}
```

**Status Code:** `400 Bad Request`

---

### Test 2: Invalid Token Format

**Request Body:**
```json
{
  "token": ""
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "reCAPTCHA token is required"
}
```

**Status Code:** `400 Bad Request`

---

### Test 3: Expired Token

**Request Body:**
```json
{
  "token": "old_expired_token_here"
}
```

**Expected Response:**
```json
{
  "success": false,
  "score": null,
  "message": "Verification failed - score too low or invalid token"
}
```

**Status Code:** `200 OK`

---

## Using Postman Environment Variables

### Create Environment

1. **Click Environments** (left sidebar)
2. **Create New Environment** → "reCAPTCHA API Dev"
3. **Add Variables:**

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `https://recaptcha-api-9lrd.onrender.com` | `https://recaptcha-api-9lrd.onrender.com` |
| `recaptcha_token` | `your_token_here` | `your_token_here` |

4. **Save Environment**

### Use in Requests

Change your URLs to:
```
{{base_url}}/health
{{base_url}}/api/verify-recaptcha
```

Request body:
```json
{
  "token": "{{recaptcha_token}}"
}
```

---

## Postman Tests (Automated Assertions)

Add these to the "Tests" tab in Postman:

### For Health Check:

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has status field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.status).to.eql("ok");
});

pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

### For Verify Endpoint:

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

pm.test("Response has message field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('message');
});

// If using real token:
pm.test("Verification successful with good score", function () {
    var jsonData = pm.response.json();
    if (jsonData.success) {
        pm.expect(jsonData.score).to.be.above(0.5);
    }
});
```

---

## cURL Commands (Alternative to Postman)

If you prefer command line:

### Health Check:
```bash
curl https://recaptcha-api-9lrd.onrender.com/health
```

### Verify Token:
```bash
curl -X POST https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha \
  -H "Content-Type: application/json" \
  -d '{"token":"test_token_12345"}'
```

### Pretty Print Response:
```bash
curl -X POST https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha \
  -H "Content-Type: application/json" \
  -d '{"token":"test_token_12345"}' | jq
```

*(Requires `jq` to be installed)*

---

## Troubleshooting

### Issue: Request Timeout on First Call

**Reason:** Render free tier apps sleep after 15 minutes of inactivity

**Solution:** Wait 10-30 seconds for the app to wake up, then retry

**Tip:** Make a health check request first to wake up the app

---

### Issue: CORS Error in Postman

**Solution:** CORS doesn't apply to Postman! This only affects browser requests.

Postman makes direct HTTP requests, not browser requests, so CORS is not enforced.

---

### Issue: "Cannot read property 'success' of undefined"

**Reason:** Response is not JSON

**Solution:**
1. Check "Response" tab in Postman
2. Verify content type is `application/json`
3. Check if there's an error message

---

### Issue: 500 Internal Server Error

**Possible Causes:**
1. Secret key not configured in `.env`
2. Google's reCAPTCHA API is down
3. Network issue

**Solution:**
1. Check Render logs: https://dashboard.render.com
2. Verify environment variables are set correctly

---

## Response Time Expectations

| Request Type | Expected Time | Notes |
|--------------|---------------|-------|
| Health Check | 50-200ms | Fast, no external API calls |
| Verify Token (cold start) | 10-30 seconds | App waking up on Render |
| Verify Token (warm) | 500-1500ms | Includes Google API call |
| Verify Token (subsequent) | 300-800ms | Cached connections |

---

## Best Practices for Testing

1. **Always test health endpoint first** - Wakes up the app
2. **Wait for cold start** - First request may take 10-30 seconds
3. **Use environment variables** - Easier to switch between dev/prod
4. **Add tests** - Automate assertions
5. **Save requests in collection** - Reuse later
6. **Use real tokens sparingly** - They expire quickly (2 minutes)

---

## Quick Test Checklist

- [ ] Health endpoint returns 200 OK
- [ ] Verify endpoint with dummy token returns 200 with success: false
- [ ] Verify endpoint with missing token returns 400
- [ ] Verify endpoint with real token returns success: true
- [ ] Response time is acceptable
- [ ] All JSON responses are properly formatted

---

## Next Steps

1. Import the collection JSON into Postman
2. Test the health endpoint
3. Test with a dummy token
4. Get a real token and test verification
5. Add automated tests
6. Integrate with your Android app

---

**Happy Testing!** 🚀

Your API is ready at: `https://recaptcha-api-9lrd.onrender.com`

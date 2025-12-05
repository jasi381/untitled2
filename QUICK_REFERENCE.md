# Quick Reference - Android reCAPTCHA Integration

## Your Deployed API
```
URL: https://recaptcha-api-9lrd.onrender.com
Health: https://recaptcha-api-9lrd.onrender.com/health
Endpoint: https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha
```

## Required Dependencies (build.gradle)

```gradle
dependencies {
    // reCAPTCHA
    implementation 'com.google.android.gms:play-services-safetynet:18.0.1'

    // API calls
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'

    // JSON
    implementation 'com.google.code.gson:gson:2.10.1'
}
```

## AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Minimal Implementation (Kotlin)

```kotlin
// 1. Get reCAPTCHA token
SafetyNet.getClient(this).verifyWithRecaptcha("YOUR_SITE_KEY")
    .addOnSuccessListener { response ->
        val token = response.tokenResult

        // 2. Send to API
        val client = OkHttpClient()
        val json = JSONObject().put("token", token)
        val body = json.toString()
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha")
            .post(body)
            .build()

        // 3. Handle response
        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                val result = JSONObject(response.body?.string() ?: "{}")
                val success = result.getBoolean("success")
                val score = result.getDouble("score")

                runOnUiThread {
                    if (success && score >= 0.5) {
                        // Proceed with action
                        Toast.makeText(this@MainActivity,
                            "Verified! Score: ${(score * 100).toInt()}%",
                            Toast.LENGTH_LONG).show()
                    }
                }
            }

            override fun onFailure(call: Call, e: IOException) {
                // Handle error
            }
        })
    }
```

## Test API Connection

```bash
curl https://recaptcha-api-9lrd.onrender.com/health
```

Expected response:
```json
{"status":"ok","message":"reCAPTCHA Verification API is running"}
```

## Get reCAPTCHA Keys

1. Go to: https://www.google.com/recaptcha/admin
2. Register site → reCAPTCHA v3
3. Add your package name
4. Copy **Site Key** (use in Android app)
5. **Secret Key** is already configured in your API

## Response Format

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

## Score Interpretation

- **0.9 - 1.0**: Very likely human ✅
- **0.5 - 0.8**: Likely human ✅
- **0.0 - 0.4**: Likely bot ❌

## Common Issues

| Issue | Solution |
|-------|----------|
| "API key not valid" | Add package name to reCAPTCHA console |
| Network timeout | Check internet, API may be sleeping (free tier) |
| Play Services error | Update Google Play Services |
| Token verification failed | Use site key (not secret key) |

## Files Created

- `ANDROID_GUIDE.md` - Complete integration guide
- `server.js` - API server code
- `README.md` - API documentation
- `DEPLOYMENT.md` - Hosting guide
- `example-client.html` - Web client example

## Next Steps

1. ✅ Replace `YOUR_SITE_KEY` with your actual site key
2. ✅ Copy code from `ANDROID_GUIDE.md`
3. ✅ Test with real device
4. ✅ Monitor Render logs if needed

## Support Links

- API Dashboard: https://dashboard.render.com
- reCAPTCHA Console: https://www.google.com/recaptcha/admin
- Full Android Guide: See `ANDROID_GUIDE.md`

# Android Integration Guide - reCAPTCHA v3 Verification

Complete guide to integrate Google reCAPTCHA v3 with your Android app using the deployed API.

**Your API URL:** `https://recaptcha-api-9lrd.onrender.com`

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setup Dependencies](#setup-dependencies)
3. [Get reCAPTCHA Site Key](#get-recaptcha-site-key)
4. [Implementation](#implementation)
5. [Complete Examples](#complete-examples)
6. [Testing](#testing)
7. [Best Practices](#best-practices)

---

## Prerequisites

- Android Studio installed
- Minimum SDK: 21 (Android 5.0)
- Google Play Services available on device
- Internet permission in AndroidManifest.xml

---

## Setup Dependencies

### 1. Add to `build.gradle` (Project level)

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

### 2. Add to `build.gradle` (App level)

```gradle
dependencies {
    // Google Play Services SafetyNet (for reCAPTCHA)
    implementation 'com.google.android.gms:play-services-safetynet:18.0.1'

    // For API calls
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'

    // JSON parsing
    implementation 'com.google.code.gson:gson:2.10.1'

    // Coroutines (optional, for better async handling)
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

### 3. Add Internet Permission to `AndroidManifest.xml`

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.yourpackage.name">

    <!-- Required for API calls -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        ...>
        ...
    </application>
</manifest>
```

---

## Get reCAPTCHA Site Key

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Register a new site or use existing one
3. Select **reCAPTCHA v3**
4. Add your package name (e.g., `com.yourapp.package`)
5. Copy the **Site Key** (not the secret key!)

---

## Implementation

### Method 1: Using SafetyNet API (Recommended)

#### Step 1: Create RecaptchaHelper Class (Kotlin)

```kotlin
package com.yourpackage.utils

import android.app.Activity
import android.util.Log
import com.google.android.gms.safetynet.SafetyNet
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class RecaptchaHelper(private val activity: Activity) {

    companion object {
        private const val TAG = "RecaptchaHelper"
        private const val SITE_KEY = "YOUR_RECAPTCHA_SITE_KEY" // Replace with your site key
        private const val API_URL = "https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha"
    }

    interface RecaptchaCallback {
        fun onSuccess(score: Double, message: String)
        fun onFailure(error: String)
    }

    fun verify(callback: RecaptchaCallback) {
        // Step 1: Get reCAPTCHA token from Google
        SafetyNet.getClient(activity).verifyWithRecaptcha(SITE_KEY)
            .addOnSuccessListener { response ->
                val token = response.tokenResult
                if (token.isNotEmpty()) {
                    Log.d(TAG, "reCAPTCHA token obtained: ${token.take(20)}...")
                    // Step 2: Verify token with your API
                    verifyTokenWithAPI(token, callback)
                } else {
                    callback.onFailure("Failed to get reCAPTCHA token")
                }
            }
            .addOnFailureListener { e ->
                Log.e(TAG, "reCAPTCHA error: ${e.message}")
                callback.onFailure("reCAPTCHA verification failed: ${e.message}")
            }
    }

    private fun verifyTokenWithAPI(token: String, callback: RecaptchaCallback) {
        val client = OkHttpClient()
        val json = JSONObject().apply {
            put("token", token)
        }

        val requestBody = json.toString()
            .toRequestBody("application/json; charset=utf-8".toMediaType())

        val request = Request.Builder()
            .url(API_URL)
            .post(requestBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                activity.runOnUiThread {
                    callback.onFailure("Network error: ${e.message}")
                }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (!response.isSuccessful) {
                        activity.runOnUiThread {
                            callback.onFailure("Server error: ${response.code}")
                        }
                        return
                    }

                    val responseBody = response.body?.string()
                    val jsonResponse = JSONObject(responseBody ?: "{}")

                    val success = jsonResponse.optBoolean("success", false)
                    val score = jsonResponse.optDouble("score", 0.0)
                    val message = jsonResponse.optString("message", "Unknown")

                    activity.runOnUiThread {
                        if (success) {
                            callback.onSuccess(score, message)
                        } else {
                            callback.onFailure("Verification failed: $message (Score: $score)")
                        }
                    }
                }
            }
        })
    }
}
```

#### Step 2: Use in Your Activity (Kotlin)

```kotlin
package com.yourpackage

import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var recaptchaHelper: RecaptchaHelper
    private lateinit var submitButton: Button
    private lateinit var resultText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        submitButton = findViewById(R.id.submitButton)
        resultText = findViewById(R.id.resultText)

        recaptchaHelper = RecaptchaHelper(this)

        submitButton.setOnClickListener {
            verifyAndSubmit()
        }
    }

    private fun verifyAndSubmit() {
        // Disable button during verification
        submitButton.isEnabled = false
        submitButton.text = "Verifying..."
        resultText.text = "Verifying with reCAPTCHA..."

        recaptchaHelper.verify(object : RecaptchaHelper.RecaptchaCallback {
            override fun onSuccess(score: Double, message: String) {
                // Verification successful
                resultText.text = """
                    ✅ Verification Successful!
                    Score: ${(score * 100).toInt()}%
                    Message: $message
                """.trimIndent()

                Toast.makeText(
                    this@MainActivity,
                    "Verified! Score: ${(score * 100).toInt()}%",
                    Toast.LENGTH_LONG
                ).show()

                // TODO: Proceed with your form submission or action
                submitFormToServer()

                // Re-enable button
                submitButton.isEnabled = true
                submitButton.text = "Submit"
            }

            override fun onFailure(error: String) {
                // Verification failed
                resultText.text = "❌ $error"

                Toast.makeText(
                    this@MainActivity,
                    "Verification failed: $error",
                    Toast.LENGTH_LONG
                ).show()

                // Re-enable button
                submitButton.isEnabled = true
                submitButton.text = "Submit"
            }
        })
    }

    private fun submitFormToServer() {
        // Your form submission logic here
        Toast.makeText(this, "Form submitted successfully!", Toast.LENGTH_SHORT).show()
    }
}
```

#### Step 3: Layout XML (`activity_main.xml`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="16dp"
    android:gravity="center">

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="reCAPTCHA v3 Demo"
        android:textSize="24sp"
        android:textStyle="bold"
        android:layout_marginBottom="32dp"/>

    <EditText
        android:id="@+id/nameInput"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Enter your name"
        android:layout_marginBottom="16dp"/>

    <EditText
        android:id="@+id/emailInput"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="Enter your email"
        android:inputType="textEmailAddress"
        android:layout_marginBottom="24dp"/>

    <Button
        android:id="@+id/submitButton"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Submit"
        android:textSize="16sp"
        android:layout_marginBottom="24dp"/>

    <TextView
        android:id="@+id/resultText"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Click submit to verify"
        android:textAlignment="center"
        android:padding="16dp"
        android:background="#f0f0f0"
        android:textSize="14sp"/>

</LinearLayout>
```

---

### Method 2: Java Implementation

#### RecaptchaHelper.java

```java
package com.yourpackage.utils;

import android.app.Activity;
import android.util.Log;

import com.google.android.gms.safetynet.SafetyNet;

import org.json.JSONObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class RecaptchaHelper {

    private static final String TAG = "RecaptchaHelper";
    private static final String SITE_KEY = "YOUR_RECAPTCHA_SITE_KEY"; // Replace
    private static final String API_URL = "https://recaptcha-api-9lrd.onrender.com/api/verify-recaptcha";

    private Activity activity;

    public interface RecaptchaCallback {
        void onSuccess(double score, String message);
        void onFailure(String error);
    }

    public RecaptchaHelper(Activity activity) {
        this.activity = activity;
    }

    public void verify(RecaptchaCallback callback) {
        SafetyNet.getClient(activity).verifyWithRecaptcha(SITE_KEY)
                .addOnSuccessListener(response -> {
                    String token = response.getTokenResult();
                    if (token != null && !token.isEmpty()) {
                        Log.d(TAG, "Token obtained");
                        verifyTokenWithAPI(token, callback);
                    } else {
                        callback.onFailure("Failed to get reCAPTCHA token");
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "reCAPTCHA error: " + e.getMessage());
                    callback.onFailure("reCAPTCHA verification failed: " + e.getMessage());
                });
    }

    private void verifyTokenWithAPI(String token, RecaptchaCallback callback) {
        OkHttpClient client = new OkHttpClient();

        try {
            JSONObject json = new JSONObject();
            json.put("token", token);

            MediaType JSON = MediaType.get("application/json; charset=utf-8");
            RequestBody requestBody = RequestBody.create(json.toString(), JSON);

            Request request = new Request.Builder()
                    .url(API_URL)
                    .post(requestBody)
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    activity.runOnUiThread(() ->
                            callback.onFailure("Network error: " + e.getMessage())
                    );
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (!response.isSuccessful()) {
                        activity.runOnUiThread(() ->
                                callback.onFailure("Server error: " + response.code())
                        );
                        return;
                    }

                    String responseBody = response.body().string();
                    try {
                        JSONObject jsonResponse = new JSONObject(responseBody);
                        boolean success = jsonResponse.optBoolean("success", false);
                        double score = jsonResponse.optDouble("score", 0.0);
                        String message = jsonResponse.optString("message", "Unknown");

                        activity.runOnUiThread(() -> {
                            if (success) {
                                callback.onSuccess(score, message);
                            } else {
                                callback.onFailure("Verification failed: " + message);
                            }
                        });
                    } catch (Exception e) {
                        activity.runOnUiThread(() ->
                                callback.onFailure("Parse error: " + e.getMessage())
                        );
                    }
                }
            });
        } catch (Exception e) {
            callback.onFailure("Error: " + e.getMessage());
        }
    }
}
```

#### MainActivity.java

```java
package com.yourpackage;

import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.yourpackage.utils.RecaptchaHelper;

public class MainActivity extends AppCompatActivity {

    private RecaptchaHelper recaptchaHelper;
    private Button submitButton;
    private TextView resultText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        submitButton = findViewById(R.id.submitButton);
        resultText = findViewById(R.id.resultText);

        recaptchaHelper = new RecaptchaHelper(this);

        submitButton.setOnClickListener(v -> verifyAndSubmit());
    }

    private void verifyAndSubmit() {
        submitButton.setEnabled(false);
        submitButton.setText("Verifying...");
        resultText.setText("Verifying with reCAPTCHA...");

        recaptchaHelper.verify(new RecaptchaHelper.RecaptchaCallback() {
            @Override
            public void onSuccess(double score, String message) {
                String result = String.format(
                    "✅ Verification Successful!\nScore: %d%%\nMessage: %s",
                    (int)(score * 100),
                    message
                );
                resultText.setText(result);

                Toast.makeText(
                    MainActivity.this,
                    "Verified! Score: " + (int)(score * 100) + "%",
                    Toast.LENGTH_LONG
                ).show();

                // Proceed with form submission
                submitFormToServer();

                submitButton.setEnabled(true);
                submitButton.setText("Submit");
            }

            @Override
            public void onFailure(String error) {
                resultText.setText("❌ " + error);

                Toast.makeText(
                    MainActivity.this,
                    "Verification failed: " + error,
                    Toast.LENGTH_LONG
                ).show();

                submitButton.setEnabled(true);
                submitButton.setText("Submit");
            }
        });
    }

    private void submitFormToServer() {
        Toast.makeText(this, "Form submitted successfully!", Toast.LENGTH_SHORT).show();
    }
}
```

---

## Method 3: Using Retrofit (Optional)

If you prefer Retrofit for API calls:

### Add Retrofit Dependencies

```gradle
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
```

### Create API Interface

```kotlin
interface RecaptchaAPI {
    @POST("/api/verify-recaptcha")
    suspend fun verifyToken(@Body request: TokenRequest): VerifyResponse
}

data class TokenRequest(val token: String)

data class VerifyResponse(
    val success: Boolean,
    val score: Double?,
    val message: String?,
    val action: String?,
    val timestamp: String?,
    val hostname: String?
)
```

### Create Retrofit Instance

```kotlin
object RetrofitClient {
    private const val BASE_URL = "https://recaptcha-api-9lrd.onrender.com/"

    val instance: RecaptchaAPI by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(RecaptchaAPI::class.java)
    }
}
```

### Use with Coroutines

```kotlin
lifecycleScope.launch {
    try {
        val response = RetrofitClient.instance.verifyToken(TokenRequest(token))
        if (response.success) {
            // Success
            Toast.makeText(this@MainActivity, "Score: ${response.score}", Toast.LENGTH_LONG).show()
        }
    } catch (e: Exception) {
        // Error
        Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_LONG).show()
    }
}
```

---

## Testing

### 1. Test API Connection First

```kotlin
// Test health endpoint
fun testAPI() {
    val client = OkHttpClient()
    val request = Request.Builder()
        .url("https://recaptcha-api-9lrd.onrender.com/health")
        .build()

    client.newCall(request).enqueue(object : Callback {
        override fun onResponse(call: Call, response: Response) {
            Log.d("API", "Response: ${response.body?.string()}")
        }
        override fun onFailure(call: Call, e: IOException) {
            Log.e("API", "Error: ${e.message}")
        }
    })
}
```

### 2. Test with Dummy Token

```kotlin
// This will fail but confirms API communication works
val dummyToken = "test_token_12345"
verifyTokenWithAPI(dummyToken, callback)
```

### 3. Test on Real Device

- reCAPTCHA works better on real devices
- Emulators may have issues with Google Play Services
- Ensure Google Play Services is up to date

### 4. Check Logs

```bash
# Filter for reCAPTCHA logs
adb logcat | grep -i recaptcha
```

---

## Best Practices

### 1. Security

```kotlin
// Store API URL in BuildConfig
android {
    buildTypes {
        release {
            buildConfigField("String", "API_URL", "\"https://recaptcha-api-9lrd.onrender.com\"")
        }
        debug {
            buildConfigField("String", "API_URL", "\"http://10.0.2.2:3000\"")
        }
    }
}

// Use in code
private const val API_URL = BuildConfig.API_URL
```

### 2. Error Handling

```kotlin
fun verify(callback: RecaptchaCallback, maxRetries: Int = 2) {
    var attempts = 0

    fun attemptVerify() {
        SafetyNet.getClient(activity).verifyWithRecaptcha(SITE_KEY)
            .addOnSuccessListener { /* ... */ }
            .addOnFailureListener { e ->
                if (attempts < maxRetries) {
                    attempts++
                    Log.d(TAG, "Retry attempt $attempts")
                    attemptVerify()
                } else {
                    callback.onFailure("Failed after $maxRetries attempts: ${e.message}")
                }
            }
    }

    attemptVerify()
}
```

### 3. Network Check

```kotlin
fun isNetworkAvailable(): Boolean {
    val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    val network = cm.activeNetwork ?: return false
    val capabilities = cm.getNetworkCapabilities(network) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
}

// Before verification
if (!isNetworkAvailable()) {
    callback.onFailure("No internet connection")
    return
}
```

### 4. ProGuard Rules (if using)

```proguard
# OkHttp
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }

# Gson
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }

# SafetyNet
-keep class com.google.android.gms.safetynet.** { *; }
```

---

## Troubleshooting

### Issue: "API key not valid"
**Solution:** Ensure you added your Android package name in reCAPTCHA console

### Issue: "Network timeout"
**Solution:**
- Check internet connection
- Verify API URL is correct
- Check if Render app is sleeping (free tier spins down after inactivity)

### Issue: "Token verification failed"
**Solution:**
- Ensure you're using the correct site key (not secret key)
- Check that site key matches the one in reCAPTCHA console

### Issue: "Play Services not available"
**Solution:**
- Update Google Play Services on device
- Test on real device instead of emulator

---

## Configuration Checklist

- [ ] Added Google Play Services dependency
- [ ] Added OkHttp dependency
- [ ] Added Internet permission in AndroidManifest.xml
- [ ] Replaced `YOUR_RECAPTCHA_SITE_KEY` with actual site key
- [ ] API URL is set to `https://recaptcha-api-9lrd.onrender.com`
- [ ] Tested on real device
- [ ] Handled success/failure callbacks
- [ ] Added error handling and retries

---

## Complete Flow Diagram

```
1. User taps Submit button
         ↓
2. App requests token from Google SafetyNet
         ↓
3. Google returns reCAPTCHA token
         ↓
4. App sends token to YOUR API (Render)
         ↓
5. YOUR API verifies token with Google
         ↓
6. YOUR API returns success/score to app
         ↓
7. App proceeds with form submission (if score > 0.5)
```

---

## Support

If you encounter issues:
1. Check Render logs: https://dashboard.render.com
2. Test API health: https://recaptcha-api-9lrd.onrender.com/health
3. Verify Android logs: `adb logcat`

---

**Your API is ready at:** `https://recaptcha-api-9lrd.onrender.com` 🚀

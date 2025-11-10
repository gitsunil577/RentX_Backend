# 🔄 Frontend Token Update Guide

## ⚠️ CRITICAL: Token Update After Owner Registration

### The Problem
When a user registers as an owner, the backend:
1. Updates database: `typeOfCustomer: "Buyer"` → `"Owner"`
2. Generates **NEW JWT tokens** with updated role
3. Returns new tokens in the response

**The frontend MUST update its stored tokens immediately!**

---

## 🛠️ Required Frontend Changes

### File to Update: `RegisterOwner.jsx`

#### Current Code (Likely):
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await axios.post(
      `${BASE}/owner/register-owner`,
      { storeName, gstNumber, address },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSuccessMessage("Owner registered successfully! Redirecting...");

    setTimeout(() => {
      navigate("/vehicle/register");
    }, 1500);

  } catch (err) {
    setError(err.response?.data?.message || "Failed to register");
  }
};
```

#### Updated Code (Required):
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccessMessage("");

  try {
    const response = await axios.post(
      `${BASE}/owner/register-owner`,
      { storeName, gstNumber, address },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✅ Owner registration response:", response.data);

    // ⚠️ CRITICAL: Update tokens immediately!
    const { accessToken, refreshToken } = response.data.data;

    if (accessToken && refreshToken) {
      // Update localStorage with NEW tokens
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      console.log("✅ Tokens updated in localStorage");
      console.log("⚠️ Role changed to Owner - can no longer book vehicles");

      setSuccessMessage(
        "Owner registered successfully! Your role has been updated. " +
        "You can now list vehicles but can no longer book them."
      );
    } else {
      console.warn("⚠️ No new tokens in response - may need to logout/login");
      setSuccessMessage(
        "Owner registered! Please log out and log in again to refresh your session."
      );
    }

    // Navigate to vehicle registration after short delay
    setTimeout(() => {
      navigate("/vehicle/register");
    }, 2000);

  } catch (err) {
    console.error("❌ Owner registration failed:", err);

    const errorMsg = err.response?.data?.message;

    if (errorMsg && errorMsg.includes("Owner already Exists")) {
      // Already an owner, just navigate
      navigate("/vehicle/register");
    } else {
      setError(errorMsg || "Failed to register as owner. Please try again.");
    }
  }
};
```

---

## 📝 Complete Updated Component

```javascript
// src/components/RegisterOwner.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaStore, FaFileInvoice, FaMapMarkerAlt, FaUserTie } from "react-icons/fa";

export default function RegisterOwner() {
  const [storeName, setStoreName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("accessToken");
  const BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!storeName || !gstNumber || !address) {
      setError("All fields are required");
      return;
    }

    try {
      const payload = { storeName, gstNumber, address };
      const response = await axios.post(
        `${BASE}/owner/register-owner`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Owner registration successful:", response.data);

      // ⚠️ CRITICAL: Update tokens with NEW ones from response
      const newAccessToken = response.data.data?.accessToken;
      const newRefreshToken = response.data.data?.refreshToken;

      if (newAccessToken && newRefreshToken) {
        // Update localStorage
        localStorage.setItem("accessToken", newAccessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        console.log("✅ Authentication tokens updated successfully");
        console.log("🎉 You are now an Owner!");
        console.log("✅ You can now: List vehicles, manage bookings");
        console.log("❌ You can no longer: Book vehicles");

        setSuccessMessage(
          "🎉 Owner registered successfully! " +
          "Your session has been updated. You can now list vehicles immediately. " +
          "Note: You can no longer book vehicles as an owner."
        );
      } else {
        // Fallback if tokens not in response
        console.warn("⚠️ Tokens not found in response");
        setSuccessMessage(
          "Owner registered successfully! " +
          "Please log out and log in again to refresh your permissions."
        );
      }

      // Navigate after delay
      setTimeout(() => {
        navigate("/vehicle/register");
      }, 2500);

    } catch (err) {
      console.error("❌ Owner registration error:", err);

      const errorMsg = err.response?.data?.message;

      // Handle "already exists" case
      if (errorMsg?.includes("Owner already Exists") ||
          errorMsg?.includes("already exists")) {
        console.log("ℹ️ Owner profile already exists, redirecting...");
        navigate("/vehicle/register");
      } else {
        setError(errorMsg || "Failed to register as owner. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 py-16 px-4">
      {/* ... rest of JSX ... */}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields */}

        <button type="submit" className="...">
          Register as Owner
        </button>
      </form>

      {/* Display messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded p-4 mt-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-500/10 border border-green-500 rounded p-4 mt-4">
          <p className="text-green-300">{successMessage}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testing the Frontend Update

### Before Token Update:
```javascript
// Old token still has: typeOfCustomer: "Buyer"
// Result: Can still book vehicles (BUG!)
```

### After Token Update:
```javascript
// New token has: typeOfCustomer: "Owner"
// Result: Cannot book vehicles (CORRECT!)
```

### Verification Steps:

**1. Check localStorage after owner registration:**
```javascript
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));
```

**2. Decode the JWT token** (use jwt.io):
```json
{
  "_id": "...",
  "email": "...",
  "username": "...",
  // This should now show Owner, not Buyer:
  "typeOfCustomer": "Owner"  ← Should be updated!
}
```

**3. Verify with API call:**
```javascript
const checkUser = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await axios.get(`${BASE}/user/current-user`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Current user:', response.data.data);
  // Should show: typeOfCustomer: "Owner", isOwner: true
};
```

---

## 🎯 Key Points

### ✅ DO:
1. **Extract new tokens from response**
   ```javascript
   const { accessToken, refreshToken } = response.data.data;
   ```

2. **Update localStorage immediately**
   ```javascript
   localStorage.setItem("accessToken", accessToken);
   localStorage.setItem("refreshToken", refreshToken);
   ```

3. **Show clear success message**
   ```javascript
   "You are now an Owner. You can list vehicles but cannot book them."
   ```

4. **Log for debugging**
   ```javascript
   console.log("✅ Tokens updated:", { accessToken, refreshToken });
   ```

### ❌ DON'T:
1. **Don't keep using old token**
   ```javascript
   // BAD: Still using old token from initial login
   const token = localStorage.getItem("accessToken"); // OLD!
   ```

2. **Don't skip token update**
   ```javascript
   // BAD: Not updating localStorage
   // Result: Still using Buyer token, can still book!
   ```

3. **Don't navigate immediately**
   ```javascript
   // BAD: Navigate before tokens update
   navigate("/vehicle/register"); // Too fast!

   // GOOD: Wait for update
   localStorage.setItem("accessToken", newToken);
   setTimeout(() => navigate("/vehicle/register"), 1000);
   ```

---

## 🔄 Alternative: Force Re-login

If token update is problematic, force logout/login:

```javascript
const handleSubmit = async (e) => {
  try {
    await axios.post(`${BASE}/owner/register-owner`, ...);

    // Clear tokens
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // Show message and redirect to login
    alert("Owner registered! Please log in again to continue.");
    navigate("/login");

  } catch (err) {
    // Handle error
  }
};
```

---

## 🚨 Common Issues

### Issue 1: "Owner can still book vehicles"
**Cause:** Frontend using old token
**Fix:** Update localStorage with new tokens from response

### Issue 2: "Tokens undefined in response"
**Cause:** Backend not returning tokens
**Fix:** Backend already fixed - check response structure

### Issue 3: "Role not updated after owner registration"
**Cause:** Frontend cached old user data
**Fix:** Force refetch user data after token update

---

## 📊 Response Structure

When you call `/owner/register-owner`, you'll receive:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Owner registered successfully! Your role has been updated immediately...",
  "data": {
    "owner": {
      "_id": "...",
      "storeName": "...",
      "gstNumber": "...",
      "address": "..."
    },
    "user": {
      "_id": "...",
      "username": "...",
      "email": "...",
      "typeOfCustomer": "Owner",  ← Updated!
      "ownerID": "...",           ← Added!
      "isOwner": true,
      "isBuyer": false
    },
    "accessToken": "eyJhbGc...",  ← NEW TOKEN - UPDATE THIS!
    "refreshToken": "eyJhbGc...", ← NEW TOKEN - UPDATE THIS!
    "message": "IMPORTANT: Your session has been automatically updated..."
  }
}
```

Extract and save:
```javascript
const { accessToken, refreshToken } = response.data.data;
localStorage.setItem("accessToken", accessToken);
localStorage.setItem("refreshToken", refreshToken);
```

---

## ✅ Success Indicators

After implementing, you should see:

**Console Logs:**
```
✅ Owner registration successful
✅ Authentication tokens updated successfully
🎉 You are now an Owner!
✅ You can now: List vehicles, manage bookings
❌ You can no longer: Book vehicles
```

**API Behavior:**
- ✅ GET /user/current-user → typeOfCustomer: "Owner"
- ✅ POST /vehicle/register-vehicle → Success (200)
- ❌ POST /booking/create-booking → Forbidden (403)

**User Experience:**
- User registers as owner
- Sees success message with role change info
- Can immediately list vehicles
- Cannot book vehicles anymore
- No need to logout/login manually

---

**Last Updated:** January 2025
**Status:** ✅ Backend Ready - Frontend Update Required

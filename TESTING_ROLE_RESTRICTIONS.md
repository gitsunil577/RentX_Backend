# 🧪 Testing Role Restrictions - E-Rental System

## ⚠️ CRITICAL FIXES IMPLEMENTED

### Problem Fixed:
- ❌ **OLD**: After registering as owner, old JWT token still said "Buyer", allowing booking
- ❌ **OLD**: Buyers could potentially list vehicles due to token caching
- ✅ **NEW**: Immediate token regeneration after owner registration
- ✅ **NEW**: Always fetch fresh user data from database on every request

---

## 🔧 What Was Fixed

### 1. **Automatic Token Regeneration**
When you register as owner, the backend now:
1. Updates database: `typeOfCustomer: "Owner"`
2. **Generates NEW JWT tokens** with updated data
3. Returns new tokens in response
4. Sets new cookies automatically

**Result:** You can list vehicles IMMEDIATELY after registration!

### 2. **Fresh Database Lookup**
Every request now:
1. Verifies JWT token
2. **Fetches fresh user data from database**
3. Uses database data (not cached token data) for role checks

**Result:** Role changes take effect IMMEDIATELY on next request!

---

## 🧪 Test Suite

### Test 1: Buyer Cannot List Vehicles ❌

#### Step 1.1: Register as Buyer
```http
POST /api/v1/user/register
Content-Type: application/json

{
  "fullname": "John Customer",
  "username": "johncustomer",
  "email": "john@customer.com",
  "password": "password123",
  "typeOfCustomer": "Buyer"
}

✅ Expected: Success, user created as Buyer
```

#### Step 1.2: Login as Buyer
```http
POST /api/v1/user/login
Content-Type: application/json

{
  "identifier": "johncustomer",
  "password": "password123"
}

✅ Expected: Login successful, tokens received
```

#### Step 1.3: Verify Role
```http
GET /api/v1/user/current-user
Authorization: Bearer <access_token>

✅ Expected Response:
{
  "typeOfCustomer": "Buyer",
  "isOwner": false,
  "isBuyer": true,
  "hasOwnerProfile": false
}
```

#### Step 1.4: Try to List Vehicle (SHOULD FAIL)
```http
POST /api/v1/vehicle/register-vehicle
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

FormData:
- name: "Test Vehicle"
- description: "Test"
- price: 100
- stock: 5
- category: "Cars"
- image: [file]

❌ Expected Response (403 Forbidden):
{
  "statusCode": 403,
  "success": false,
  "message": "Access Denied: Only owners can list vehicles for rent. You are registered as a Buyer. Customers can only book vehicles, not list them. To list vehicles, you must register as an owner."
}

✅ Console Logs:
🔑 JWT Verified - User: { typeOfCustomer: 'Buyer', ... }
🔒 isOwner middleware check: { typeOfCustomer: 'Buyer' }
❌ Access denied: User is not an Owner, type: Buyer
🚗 Vehicle Registration Attempt: { typeOfCustomer: 'Buyer' }
❌ Vehicle registration denied: User is not an Owner
```

#### Step 1.5: Try to View Owner Vehicles (SHOULD FAIL)
```http
GET /api/v1/vehicle/owner-vehicles
Authorization: Bearer <access_token>

❌ Expected Response (403 Forbidden):
{
  "statusCode": 403,
  "message": "Access denied. Only owners can perform this action. You are registered as: Buyer"
}
```

#### Step 1.6: Verify Buyer CAN Book (SHOULD SUCCEED)
```http
POST /api/v1/booking/create-booking
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "vehicleId": "<some_vehicle_id>",
  "startDate": "2025-01-20",
  "endDate": "2025-01-25",
  "pickupLocation": "Airport",
  "returnLocation": "Hotel"
}

✅ Expected: Success, booking created
```

---

### Test 2: Owner Cannot Book Vehicles ❌

#### Step 2.1: Register as Owner Type
```http
POST /api/v1/user/register
Content-Type: application/json

{
  "fullname": "Jane Owner",
  "username": "janeowner",
  "email": "jane@owner.com",
  "password": "password123",
  "typeOfCustomer": "Owner"
}

✅ Expected: Success, user created as Owner
```

#### Step 2.2: Login as Owner
```http
POST /api/v1/user/login
Content-Type: application/json

{
  "identifier": "janeowner",
  "password": "password123"
}

✅ Expected: Login successful
```

#### Step 2.3: Complete Owner Registration
```http
POST /api/v1/owner/register-owner
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "storeName": "Jane's Vehicle Rental",
  "gstNumber": "22AAAAA0000A1Z5",
  "address": "123 Main St"
}

✅ Expected Response:
{
  "statusCode": 200,
  "message": "Owner registered successfully! Your role has been updated immediately. New authentication tokens have been issued.",
  "data": {
    "owner": { ... },
    "user": {
      "typeOfCustomer": "Owner",
      "ownerID": "..."
    },
    "accessToken": "NEW_TOKEN_HERE",
    "refreshToken": "NEW_REFRESH_TOKEN_HERE",
    "message": "IMPORTANT: Your session has been automatically updated. You are now an Owner and can list vehicles immediately. You can no longer book vehicles."
  }
}

⚠️ IMPORTANT: Frontend should update localStorage with new tokens!

✅ Console Logs:
🏪 Owner Registration Attempt: { currentType: 'Owner' }
✅ Owner registered successfully: { newType: 'Owner', ownerID: '...' }
🔄 Generating new tokens with Owner role...
✅ New tokens generated and set in cookies
```

#### Step 2.4: Verify Role (USE NEW TOKEN)
```http
GET /api/v1/user/current-user
Authorization: Bearer <NEW_access_token>

✅ Expected Response:
{
  "typeOfCustomer": "Owner",
  "isOwner": true,
  "isBuyer": false,
  "hasOwnerProfile": true,
  "ownerID": "..."
}

✅ Console Logs:
🔑 JWT Verified - User: { typeOfCustomer: 'Owner', ownerID: 'exists' }
```

#### Step 2.5: Verify Owner CAN List Vehicle (SHOULD SUCCEED)
```http
POST /api/v1/vehicle/register-vehicle
Authorization: Bearer <NEW_access_token>
Content-Type: multipart/form-data

FormData:
- name: "Tesla Model 3"
- description: "Electric sedan"
- price: 100
- stock: 5
- category: "Cars"
- image: [file]

✅ Expected: Success, vehicle listed

✅ Console Logs:
🔑 JWT Verified - User: { typeOfCustomer: 'Owner', ownerID: 'exists' }
🔒 isOwner middleware check: { typeOfCustomer: 'Owner', ownerID: '...' }
✅ isOwner check passed
🚗 Vehicle Registration Attempt: { typeOfCustomer: 'Owner', hasOwnerID: true }
✅ Vehicle registration authorized: User is verified Owner
```

#### Step 2.6: Try to Book Vehicle (SHOULD FAIL)
```http
POST /api/v1/booking/create-booking
Authorization: Bearer <NEW_access_token>
Content-Type: application/json

{
  "vehicleId": "<some_vehicle_id>",
  "startDate": "2025-01-20",
  "endDate": "2025-01-25",
  "pickupLocation": "Airport",
  "returnLocation": "Hotel"
}

❌ Expected Response (403 Forbidden):
{
  "statusCode": 403,
  "message": "Access denied. Only buyers/customers can perform this action. You are registered as: Owner"
}

✅ Console Logs:
🔑 JWT Verified - User: { typeOfCustomer: 'Owner' }
🔒 isBuyer middleware check: { typeOfCustomer: 'Owner' }
❌ Access denied: User is not a Buyer, type: Owner
```

#### Step 2.7: Try to View User Bookings (SHOULD FAIL)
```http
GET /api/v1/booking/user-bookings
Authorization: Bearer <NEW_access_token>

❌ Expected Response (403 Forbidden):
{
  "statusCode": 403,
  "message": "Only customers can view their bookings. Owners should use owner-bookings endpoint."
}
```

---

### Test 3: Buyer Upgrades to Owner (New Feature)

#### Step 3.1: Start as Buyer
```http
# Register and login as Buyer (typeOfCustomer: "Buyer")
# Already have a Buyer account and token
```

#### Step 3.2: Verify Can Book
```http
POST /api/v1/booking/create-booking
Authorization: Bearer <buyer_token>

✅ Expected: Success
```

#### Step 3.3: Try to List Vehicle (SHOULD FAIL)
```http
POST /api/v1/vehicle/register-vehicle
Authorization: Bearer <buyer_token>

❌ Expected: 403 Forbidden
```

#### Step 3.4: Upgrade to Owner
```http
POST /api/v1/owner/register-owner
Authorization: Bearer <buyer_token>
Content-Type: application/json

{
  "storeName": "My Vehicle Shop",
  "gstNumber": "22AAAAA0000A1Z5",
  "address": "456 Street"
}

✅ Expected Response:
{
  "statusCode": 200,
  "message": "Owner registered successfully! Your role has been updated immediately...",
  "data": {
    "accessToken": "NEW_TOKEN",
    "refreshToken": "NEW_REFRESH_TOKEN",
    "user": {
      "typeOfCustomer": "Owner"  // ← Changed from Buyer to Owner!
    }
  }
}

✅ Console Logs:
🏪 Owner Registration Attempt: { currentType: 'Buyer' }
⚠️ User is Buyer, upgrading to Owner...
✅ Owner registered successfully: { newType: 'Owner' }
🔄 Generating new tokens with Owner role...
✅ New tokens generated
```

#### Step 3.5: Use NEW Token - Try to Book (SHOULD FAIL NOW)
```http
POST /api/v1/booking/create-booking
Authorization: Bearer <NEW_token_from_step_3.4>

❌ Expected Response (403 Forbidden):
{
  "statusCode": 403,
  "message": "Access denied. Only buyers/customers can perform this action. You are registered as: Owner"
}

✅ Console Logs:
🔑 JWT Verified - User: { typeOfCustomer: 'Owner' }  ← Fresh from database!
🔒 isBuyer middleware check: { typeOfCustomer: 'Owner' }
❌ Access denied: User is not a Buyer, type: Owner
```

#### Step 3.6: Use NEW Token - Try to List Vehicle (SHOULD SUCCEED NOW)
```http
POST /api/v1/vehicle/register-vehicle
Authorization: Bearer <NEW_token_from_step_3.4>

✅ Expected: Success! Vehicle listed

✅ Console Logs:
🔑 JWT Verified - User: { typeOfCustomer: 'Owner' }
🔒 isOwner middleware check: { typeOfCustomer: 'Owner' }
✅ isOwner check passed
```

---

## 🔍 Debugging Guide

### Issue: "I'm an owner but can still book vehicles"

**Diagnosis:**
1. Check which token you're using
2. Verify token contains updated role

**Solution:**
```bash
# Step 1: Check current user with your token
GET /api/v1/user/current-user

# Look for:
{
  "typeOfCustomer": "Owner"  ← Should be "Owner"
  "ownerID": "..."           ← Should exist
}

# Step 2: If still says "Buyer", you're using old token!
# Use the NEW tokens returned from /owner/register-owner response

# Step 3: Update localStorage/cookies with new tokens
localStorage.setItem('accessToken', newAccessToken);
localStorage.setItem('refreshToken', newRefreshToken);

# Step 4: Try booking again - should fail with 403
```

**Console Logs to Look For:**
```bash
# When trying to book as owner:
🔑 JWT Verified - User: { typeOfCustomer: 'Owner' }  ← Good!
🔒 isBuyer middleware check: { typeOfCustomer: 'Owner' }
❌ Access denied: User is not a Buyer, type: Owner  ← Blocked correctly!
```

---

### Issue: "I'm a buyer but can list vehicles"

**Diagnosis:**
Check console logs when attempting to list

**Solution:**
```bash
# Should see these logs:
🔑 JWT Verified - User: { typeOfCustomer: 'Buyer' }
🔒 isOwner middleware check: { typeOfCustomer: 'Buyer' }
❌ Access denied: User is not an Owner, type: Buyer
🚗 Vehicle Registration Attempt: { typeOfCustomer: 'Buyer' }
❌ Vehicle registration denied: User is not an Owner

# If you DON'T see these logs, middleware isn't running!
# Check routes have isOwner middleware
```

---

## ✅ Success Criteria

### For Buyers:
- ✅ Can register as "Buyer"
- ✅ Can login
- ✅ Can view vehicles (public)
- ✅ Can book vehicles
- ✅ Can view their bookings
- ❌ CANNOT list vehicles (403 error)
- ❌ CANNOT view owner-vehicles (403 error)
- ❌ CANNOT delete vehicles (403 error)

### For Owners:
- ✅ Can register as "Owner"
- ✅ Can complete owner profile
- ✅ **Receive NEW tokens automatically**
- ✅ Can list vehicles IMMEDIATELY
- ✅ Can view owner-vehicles
- ✅ Can delete their vehicles
- ✅ Can view bookings for their vehicles
- ❌ CANNOT book any vehicles (403 error)
- ❌ CANNOT view user-bookings (403 error)

### After Owner Registration:
- ✅ NEW tokens returned in response
- ✅ Cookies automatically updated
- ✅ Next request uses fresh database data
- ✅ Role restrictions active IMMEDIATELY
- ✅ No manual logout/login required

---

## 🎯 Quick Test Commands

### Test Buyer Restrictions:
```bash
# 1. Login as buyer
# 2. Try this (should fail):
curl -X POST http://localhost:8000/api/v1/vehicle/register-vehicle \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN" \
  -F "name=Test" -F "price=100" -F "stock=5" -F "category=Cars"

# Expected: 403 Forbidden
```

### Test Owner Restrictions:
```bash
# 1. Register as owner (get NEW tokens from response)
# 2. Try this with NEW token (should fail):
curl -X POST http://localhost:8000/api/v1/booking/create-booking \
  -H "Authorization: Bearer YOUR_NEW_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"xxx","startDate":"2025-01-20","endDate":"2025-01-25","pickupLocation":"A","returnLocation":"B"}'

# Expected: 403 Forbidden
```

---

## 📋 Console Log Checklist

When everything works correctly, you should see:

**For Buyer Trying to List Vehicle:**
```
🔑 JWT Verified - User: { typeOfCustomer: 'Buyer' }
🔒 isOwner middleware check: { typeOfCustomer: 'Buyer' }
❌ Access denied: User is not an Owner
```

**For Owner Trying to Book:**
```
🔑 JWT Verified - User: { typeOfCustomer: 'Owner' }
🔒 isBuyer middleware check: { typeOfCustomer: 'Owner' }
❌ Access denied: User is not a Buyer
```

**After Owner Registration:**
```
🏪 Owner Registration Attempt
✅ Owner registered successfully: { newType: 'Owner' }
🔄 Generating new tokens with Owner role...
✅ New tokens generated and set in cookies
```

---

## 🚀 Final Checklist

Before considering the feature complete:

- [ ] Buyer cannot list vehicles (get 403)
- [ ] Buyer cannot view owner-vehicles (get 403)
- [ ] Buyer CAN book vehicles (get 200)
- [ ] Owner cannot book vehicles (get 403)
- [ ] Owner cannot view user-bookings (get 403)
- [ ] Owner CAN list vehicles (get 200)
- [ ] Owner registration returns NEW tokens
- [ ] Frontend updates tokens after owner registration
- [ ] Console logs show correct role checks
- [ ] Database shows correct typeOfCustomer

---

**Last Updated:** January 2025
**Critical Fix:** Automatic token regeneration implemented ✅

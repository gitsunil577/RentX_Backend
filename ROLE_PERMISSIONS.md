# 🔒 Role-Based Permissions - E-Rental System

## 📋 Overview

The E-Rental system has **TWO distinct user roles** with completely separate capabilities:

1. **👥 Buyers/Customers** - Can ONLY book vehicles
2. **🏪 Owners** - Can ONLY list vehicles and manage bookings

---

## 🚫 CRITICAL RULE: Buyers CANNOT List Vehicles

### ❌ What Buyers CANNOT Do:
- ❌ List/Register vehicles
- ❌ View owner vehicles
- ❌ Update vehicles
- ❌ Delete vehicles
- ❌ View vehicle bookings (owner perspective)
- ❌ Update booking status

### ✅ What Buyers CAN Do:
- ✅ Browse all available vehicles (public)
- ✅ Search vehicles by category (public)
- ✅ View vehicle details (public)
- ✅ **Book available vehicles**
- ✅ View their own bookings
- ✅ Cancel their own bookings

---

## 🏪 CRITICAL RULE: Owners CANNOT Book Vehicles

### ❌ What Owners CANNOT Do:
- ❌ Book any vehicles (including their own)
- ❌ View buyer bookings endpoint
- ❌ Access buyer-only features

### ✅ What Owners CAN Do:
- ✅ Browse all available vehicles (public)
- ✅ **List/Register vehicles for rent**
- ✅ View all their listed vehicles
- ✅ Update their vehicles
- ✅ Delete their vehicles
- ✅ View all bookings for their vehicles
- ✅ Update booking status (Confirm, Complete, etc.)

---

## 🛡️ Protection Layers

### Layer 1: Route Middleware
```javascript
// Owner-only routes
router.post("/register-vehicle", verifyJWT, isOwner, registerVehicle);
router.get("/owner-vehicles", verifyJWT, isOwner, getOwnerVehicles);
router.put("/update-vehicle/:id", verifyJWT, isOwner, updateVehicle);
router.delete("/delete-vehicle/:id", verifyJWT, isOwner, deleteVehicle);

// Buyer-only routes
router.post("/create-booking", verifyJWT, isBuyer, createBooking);
router.get("/user-bookings", verifyJWT, isBuyer, getUserBookings);
```

### Layer 2: Middleware Validation
```javascript
// isOwner middleware
if (user.typeOfCustomer !== 'Owner') {
  throw ApiError(403, "Only owners can perform this action");
}

// isBuyer middleware
if (user.typeOfCustomer !== 'Buyer') {
  throw ApiError(403, "Only buyers/customers can perform this action");
}
```

### Layer 3: Controller Validation
```javascript
// In registerVehicle controller
if (userDetails.typeOfCustomer !== "Owner") {
  throw ApiError(403, "Only owners can list vehicles. Customers cannot list vehicles.");
}

// In createBooking controller
if (user.typeOfCustomer === "Owner") {
  throw ApiError(403, "Owners cannot book vehicles. Only customers can book vehicles.");
}
```

---

## 🧪 Testing Customer Restrictions

### Test 1: Customer Attempts to List Vehicle

**Request:**
```http
POST /api/v1/vehicle/register-vehicle
Authorization: Bearer <buyer_token>
Content-Type: multipart/form-data

Body:
- name: "Test Vehicle"
- price: 100
- stock: 5
- category: "Cars"
- image: [file]
```

**Expected Response:**
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Access Denied: Only owners can list vehicles for rent. You are registered as a Buyer. Customers can only book vehicles, not list them. To list vehicles, you must register as an owner."
}
```

**Console Output:**
```bash
🚗 Vehicle Registration Attempt: { userId, typeOfCustomer: 'Buyer', ... }
❌ Vehicle registration denied: User is not an Owner
🔒 isOwner middleware check: { typeOfCustomer: 'Buyer' }
❌ Access denied: User is not an Owner, type: Buyer
```

---

### Test 2: Customer Attempts to View Owner Vehicles

**Request:**
```http
GET /api/v1/vehicle/owner-vehicles
Authorization: Bearer <buyer_token>
```

**Expected Response:**
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Access denied. Only owners can perform this action. You are registered as: Buyer"
}
```

---

### Test 3: Customer Attempts to Delete Vehicle

**Request:**
```http
DELETE /api/v1/vehicle/delete-vehicle/507f1f77bcf86cd799439011
Authorization: Bearer <buyer_token>
```

**Expected Response:**
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Access denied. Only owners can perform this action. You are registered as: Buyer"
}
```

---

## 🧪 Testing Owner Restrictions

### Test 1: Owner Attempts to Book Vehicle

**Request:**
```http
POST /api/v1/booking/create-booking
Authorization: Bearer <owner_token>

Body:
{
  "vehicleId": "507f1f77bcf86cd799439011",
  "startDate": "2025-01-15",
  "endDate": "2025-01-20",
  "pickupLocation": "Airport",
  "returnLocation": "Hotel"
}
```

**Expected Response:**
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Owners cannot book vehicles. Only customers can book vehicles."
}
```

**Console Output:**
```bash
🔒 isBuyer middleware check: { typeOfCustomer: 'Owner' }
❌ Access denied: User is not a Buyer, type: Owner
```

---

### Test 2: Owner Attempts to View Buyer Bookings

**Request:**
```http
GET /api/v1/booking/user-bookings
Authorization: Bearer <owner_token>
```

**Expected Response:**
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Access denied. Only buyers/customers can perform this action. You are registered as: Owner"
}
```

---

## 📊 Complete Permission Matrix

| Action | Endpoint | Buyer | Owner | Public |
|--------|----------|-------|-------|--------|
| **Vehicle Viewing** |
| Browse all vehicles | GET /vehicle/all-vehicles | ✅ | ✅ | ✅ |
| Search vehicles | POST /vehicle/vehicle-details | ✅ | ✅ | ✅ |
| View vehicle details | GET /vehicle/vehicleByID/:id | ✅ | ✅ | ✅ |
| **Vehicle Management** |
| List/Register vehicle | POST /vehicle/register-vehicle | ❌ | ✅ | ❌ |
| View my vehicles | GET /vehicle/owner-vehicles | ❌ | ✅ | ❌ |
| Update vehicle | PUT /vehicle/update-vehicle/:id | ❌ | ✅ | ❌ |
| Delete vehicle | DELETE /vehicle/delete-vehicle/:id | ❌ | ✅ | ❌ |
| **Booking Operations** |
| Create booking | POST /booking/create-booking | ✅ | ❌ | ❌ |
| View my bookings | GET /booking/user-bookings | ✅ | ❌ | ❌ |
| Cancel my booking | PUT /booking/cancel-booking/:id | ✅ | ✅* | ❌ |
| View vehicle bookings | GET /booking/owner-bookings | ❌ | ✅ | ❌ |
| Update booking status | PUT /booking/update-status/:id | ❌ | ✅ | ❌ |
| **Account Management** |
| Register as owner | POST /owner/register-owner | ✅** | ✅ | ❌ |
| View owner details | GET /owner/owner-details | ❌ | ✅ | ❌ |

\* Owners can only cancel bookings for their own vehicles
\** Buyers can upgrade to Owner (if no active bookings)

---

## 🔐 Error Messages

### For Customers Trying to List Vehicles:
```
❌ Access Denied: Only owners can list vehicles for rent.
   You are registered as a Buyer. Customers can only book vehicles,
   not list them. To list vehicles, you must register as an owner.
```

### For Owners Trying to Book Vehicles:
```
❌ Owners cannot book vehicles. Only customers can book vehicles.
```

---

## 💡 User Journey Examples

### Customer Journey:
1. ✅ Sign up as "Buyer"
2. ✅ Browse available vehicles
3. ✅ Book a vehicle
4. ✅ View booking status
5. ✅ Cancel booking (if needed)
6. ❌ CANNOT list vehicles

### Owner Journey:
1. ✅ Sign up as "Owner"
2. ✅ Complete owner registration (store details)
3. ✅ List vehicles for rent
4. ✅ View bookings for their vehicles
5. ✅ Update booking status
6. ✅ Manage vehicle listings
7. ❌ CANNOT book vehicles

---

## 🎯 Key Takeaways

1. **Clear Separation**: Customers and Owners operate in completely separate domains
2. **No Crossover**: Each role has exclusive capabilities
3. **Multi-Layer Protection**: Route → Middleware → Controller validation
4. **Clear Error Messages**: Users know exactly why access was denied
5. **Audit Trail**: All actions logged in console for debugging

---

## 🚨 Common Issues & Solutions

### Issue: "I'm an owner but can't list vehicles"
**Solution:**
1. Check you completed owner registration
2. Log out and log in again
3. Verify `typeOfCustomer === "Owner"` in `/user/current-user`

### Issue: "I'm a customer but can't book"
**Solution:**
1. Verify you're registered as "Buyer"
2. Check `/user/current-user` response
3. Ensure you're not trying to book your own vehicles (if you're also an owner)

---

**Last Updated:** January 2025
**System Version:** E-Rental v1.0

# Postman API Documentation

Complete documentation for Event Management API Postman Collection.

---

## 📋 Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `BASE_URL` | `http://localhost:8000` | Backend API base URL |
| `access_token` | *(auto-filled)* | JWT token from login |
| `reset_token` | *(auto-filled)* | Password reset token |
| `event_id` | `1` | Event ID for testing |
| `transaction_id` | `1` | Transaction ID for testing |
| `organizer_id` | `1` | Organizer ID for testing |
| `review_id` | `1` | Review ID for testing |
| `voucher_id` | `1` | Voucher ID for testing |

---

## 📁 AUTHENTICATION

### 1. POST Register (New User)

**Authorization:** None (Public)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "Dimas",
  "lastName": "Putra",
  "email": "dimas@example.com",
  "password": "password123",
  "referralCode": ""
}
```

**Script:** None

**Description:** Register new user without referral code.

---

### 2. POST Register (With Referral)

**Authorization:** None (Public)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "New",
  "lastName": "User",
  "email": "newuser@example.com",
  "password": "password123",
  "referralCode": "DIMAS123456"
}
```

**Script:** None

**Description:** Register with referral code. New user gets 1 coupon, referrer gets 10,000 points.

---

### 3. POST Login

**Authorization:** None (Public)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "dimasaptr@gmail.com",
  "password": "password123"
}
```

**Script (Test):**
```javascript
// Extract access_token from response and save to environment variable
var jsonData = pm.response.json();
if (jsonData.success && jsonData.data && jsonData.data.token) {
    pm.environment.set("access_token", jsonData.data.token);
    console.log("Access token saved to environment variable: access_token");
    console.log("Token: " + jsonData.data.token);
} else if (jsonData.token) {
    pm.environment.set("access_token", jsonData.token);
    console.log("Access token saved to environment variable: access_token");
    console.log("Token: " + jsonData.token);
} else {
    console.log("No token found in response. Response structure:");
    console.log(JSON.stringify(jsonData));
}
```

**Description:** Login to get JWT access token. Token is automatically saved to environment variable `access_token`.

---

### 4. POST Validate Referral Code

**Authorization:** None (Public)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "code": "DAC3192D"
}
```

**Script:** None

**Description:** Validate if referral code exists. Returns referrer info if valid.

---

### 5. POST Forgot Password

**Authorization:** None (Public)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "dimasaptr@gmail.com"
}
```

**Script (Test):**
```javascript
// Extract resetToken from response and save to environment variable
var jsonData = pm.response.json();
if (jsonData.success && jsonData.data && jsonData.data.resetToken) {
    pm.environment.set("reset_token", jsonData.data.resetToken);
    console.log("Reset token saved to environment variable: reset_token");
    console.log("Token: " + jsonData.data.resetToken);
} else {
    console.log("No resetToken found in response");
}
```

**Description:** Request password reset token. Token is automatically saved to environment variable `reset_token`.

---

### 6. POST Reset Password

**Authorization:** None (Public)

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "token": "{{reset_token}}",
  "newPassword": "newpassword123"
}
```

**Script:** None

**Description:** Reset password using token from forgot-password endpoint. Token is automatically taken from environment variable `reset_token`.

---

### 7. GET My Profile

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get current user profile (requires authentication).

---

### 8. POST Upgrade to Organizer

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:** None

**Script:** None

**Description:** Upgrade user role from CUSTOMER to ORGANIZER.

---

### 9. GET Role Info

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get current user role information.

---

## 📁 PROFILE

### 1. GET My Profile

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get current user profile details.

---

### 2. PUT Update Profile

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "phone": "081234567890",
  "birthDate": "1995-01-01",
  "gender": "MALE"
}
```

**Script:** None

**Description:** Update user profile information.

---

### 3. PUT Change Password

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Script:** None

**Description:** Change user password (requires current password).

---

## 📁 ORGANIZER DASHBOARD

### 1. GET Dashboard

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get organizer dashboard statistics (total events, revenue, etc).

---

### 2. GET My Events

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get all events created by current organizer.

---

### 3. POST Create Event

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Workshop Tech 2024",
  "description": "Belajar teknologi terbaru",
  "location": "Jakarta Convention Center",
  "category": "TECHNOLOGY",
  "price": 50000,
  "totalSeats": 100,
  "startDate": "2024-12-25T09:00:00Z",
  "endDate": "2024-12-25T17:00:00Z",
  "registrationDeadline": "2024-12-20T23:59:59Z",
  "imageUrl": "https://res.cloudinary.com/deic5yjpr/image/upload/event.jpg"
}
```

**Script:** None

**Description:** Create new event. Requires ORGANIZER role.

---

### 4. PUT Update Event

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Updated Event Title",
  "description": "Updated description",
  "location": "New Location",
  "category": "BUSINESS",
  "price": 75000,
  "totalSeats": 150,
  "startDate": "2024-12-26T09:00:00Z",
  "endDate": "2024-12-26T17:00:00Z",
  "registrationDeadline": "2024-12-21T23:59:59Z",
  "imageUrl": "https://res.cloudinary.com/deic5yjpr/image/upload/updated.jpg"
}
```

**Script:** None

**Description:** Update existing event. Only organizer who created the event can update.

---

### 5. DELETE Delete Event

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Delete an event. Only organizer who created the event can delete.

---

### 6. GET Event Vouchers

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get all vouchers for a specific event.

---

### 7. POST Create Voucher

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "code": "DISCOUNT20",
  "discount": 20,
  "quota": 50,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Script:** None

**Description:** Create new voucher for event. Discount in percentage (1-100).

---

### 8. PUT Update Voucher

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "code": "UPDATED20",
  "discount": 25,
  "quota": 75,
  "expiresAt": "2025-01-31T23:59:59Z"
}
```

**Script:** None

**Description:** Update existing voucher.

---

### 9. DELETE Delete Voucher

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Delete a voucher.

---

### 10. GET Event Attendees

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get list of attendees for a specific event (organizer only).

---

## 📁 EVENTS (Public & Protected)

### 1. GET All Events

**Authorization:** None (Public)

**Headers:** None

**Body:** None

**Script:** None

**Description:** Get all published events. Supports query params: `search`, `category`, `location`.

---

### 2. GET Event Details

**Authorization:** None (Public)

**Headers:** None

**Body:** None

**Script:** None

**Description:** Get detailed information about a specific event.

---

### 3. PUT Publish/Unpublish Event

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "isPublished": true
}
```

**Script:** None

**Description:** Publish or unpublish an event (organizer only).

---

## 📁 TRANSACTIONS

### 1. POST Create Transaction (Checkout)

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "eventId": 1,
  "ticketCount": 2,
  "pointsToUse": 10000,
  "voucherCode": "DISCOUNT20"
}
```

**Script:** None

**Description:** Create transaction for purchasing event tickets. Can use points and vouchers.

---

### 2. GET My Transactions

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get all transactions for current user.

---

### 3. GET Transaction Details

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get detailed information about a specific transaction.

---

### 4. PUT Upload Payment Proof

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "paymentProofUrl": "https://res.cloudinary.com/deic5yjpr/image/upload/payment.jpg"
}
```

**Script:** None

**Description:** Upload payment proof image URL. Changes status to WAITING_CONFIRMATION.

---

### 5. PUT Cancel Transaction

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Cancel a transaction (before payment confirmation). Seats and points are refunded.

---

## 📁 REVIEWS

### 1. POST Create Review

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "rating": 5,
  "comment": "Great event! Highly recommended."
}
```

**Script:** None

**Description:** Create review for a transaction. Only one review per transaction allowed.

---

### 2. GET My Reviews

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get all reviews written by current user.

---

### 3. GET Event Reviews

**Authorization:** None (Public)

**Headers:** None

**Body:** None

**Script:** None

**Description:** Get all reviews for a specific event.

---

### 4. PUT Update Review

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

**Body:**
```json
{
  "rating": 4,
  "comment": "Updated review comment."
}
```

**Script:** None

**Description:** Update existing review. Only review author can update.

---

### 5. DELETE Delete Review

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Delete a review. Only review author can delete.

---

## 📁 PUBLIC

### 1. GET Categories

**Authorization:** None (Public)

**Headers:** None

**Body:** None

**Script:** None

**Description:** Get all available event categories.

---

### 2. GET Organizer Profile

**Authorization:** None (Public)

**Headers:** None

**Body:** None

**Script:** None

**Description:** Get public organizer profile with aggregated ratings and stats.

---

## 📁 ORGANIZER (Protected)

### 1. GET Organizer Transactions

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Get all transactions for organizer's events.

---

### 2. PUT Confirm Transaction

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Confirm transaction payment. Changes status to DONE. Only organizer can confirm.

---

### 3. PUT Reject Transaction

**Authorization:** Bearer {{access_token}}

**Headers:**
```
Authorization: Bearer {{access_token}}
```

**Body:** None

**Script:** None

**Description:** Reject transaction payment. Seats and points are refunded.

---

---

## 🔧 Auto-Fill Tokens

### Access Token (access_token)
- **Source:** POST Login response
- **Auto-save:** Yes (via test script in POST Login)
- **Used in:** All protected endpoints (Authorization: Bearer {{access_token}})

### Reset Token (reset_token)
- **Source:** POST Forgot Password response
- **Auto-save:** Yes (via test script in POST Forgot Password)
- **Used in:** POST Reset Password

---

## 📝 Usage Flow

1. **Re-import Collection** to Postman
2. **Select Environment** "Event Management API - Local Environment"
3. **Run POST Login** → access_token auto-saved
4. **Run any protected endpoint** → Authorization header auto-filled with token
5. **For password reset:** Run POST Forgot Password → reset_token auto-saved → Run POST Reset Password

---

## ⚠️ Important Notes

- All protected endpoints require valid JWT token in Authorization header
- Tokens are automatically saved to environment variables by test scripts
- Environment must be selected for variables to work
- Access tokens expire after a certain time (check JWT_SECRET configuration)
- Reset tokens are single-use and expire after 1 hour

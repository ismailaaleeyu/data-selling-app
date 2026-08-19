# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### 1. Authentication

#### Register User
**POST** `/auth/register`

Request:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully"
}
```

#### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "wallet_balance": 5000
  }
}
```

#### Get Profile
**GET** `/auth/profile` (Protected)

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "wallet_balance": 5000,
    "created_at": "2026-08-12T10:00:00Z"
  }
}
```

---

### 2. Wallet Management

#### Get Balance
**GET** `/wallet/balance` (Protected)

Response:
```json
{
  "success": true,
  "balance": 5000
}
```

#### Fund Wallet
**POST** `/wallet/fund` (Protected)

Request:
```json
{
  "amount": 1000
}
```

Response:
```json
{
  "success": true,
  "message": "Wallet funded successfully"
}
```

#### Get Transactions
**GET** `/wallet/transactions` (Protected)

Response:
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "user_id": 1,
      "amount": 500,
      "type": "debit",
      "description": "Airtime: 500N to 08012345678",
      "status": "completed",
      "reference": "AIR-1691823600000",
      "created_at": "2026-08-12T10:30:00Z"
    }
  ]
}
```

---

### 3. Airtime

#### Get Providers
**GET** `/airtime/providers`

Response:
```json
{
  "success": true,
  "providers": ["MTN", "Airtel", "Glo"]
}
```

#### Get Plans
**GET** `/airtime/plans?provider=MTN`

Response:
```json
{
  "success": true,
  "plans": [
    {
      "id": 1,
      "provider": "MTN",
      "amount": 100,
      "description": "MTN 100 Naira",
      "active": true
    },
    {
      "id": 2,
      "provider": "MTN",
      "amount": 200,
      "description": "MTN 200 Naira",
      "active": true
    }
  ]
}
```

#### Buy Airtime
**POST** `/airtime/buy` (Protected)

Request:
```json
{
  "phone_number": "08012345678",
  "plan_id": 1
}
```

Response:
```json
{
  "success": true,
  "message": "Airtime purchased successfully",
  "reference": "AIR-1691823600000",
  "amount": 100
}
```

---

### 4. Data Plans

#### Get Providers
**GET** `/data/providers`

Response:
```json
{
  "success": true,
  "providers": ["MTN", "Airtel", "Glo"]
}
```

#### Get Plans
**GET** `/data/plans?provider=MTN`

Response:
```json
{
  "success": true,
  "plans": [
    {
      "id": 1,
      "provider": "MTN",
      "name": "MTN 100MB",
      "data_size": "100MB",
      "validity_days": 1,
      "price": 100,
      "active": true
    },
    {
      "id": 2,
      "provider": "MTN",
      "name": "MTN 1GB",
      "data_size": "1GB",
      "validity_days": 7,
      "price": 500,
      "active": true
    }
  ]
}
```

#### Buy Data
**POST** `/data/buy` (Protected)

Request:
```json
{
  "phone_number": "08012345678",
  "plan_id": 1
}
```

Response:
```json
{
  "success": true,
  "message": "Data purchased successfully",
  "reference": "DATA-1691823600000",
  "plan": "MTN 1GB",
  "amount": 500
}
```

---

### 5. Utility Bills

#### Get Utility Types
**GET** `/utility/types`

Response:
```json
{
  "success": true,
  "types": [
    {
      "id": 1,
      "name": "Electricity",
      "description": "Electric bill payment",
      "active": true
    },
    {
      "id": 2,
      "name": "Water",
      "description": "Water bill payment",
      "active": true
    },
    {
      "id": 3,
      "name": "Internet",
      "description": "Internet/Broadband bill payment",
      "active": true
    },
    {
      "id": 4,
      "name": "Gas",
      "description": "Gas bill payment",
      "active": true
    }
  ]
}
```

#### Pay Utility Bill
**POST** `/utility/pay` (Protected)

Request:
```json
{
  "utility_type_id": 1,
  "utility_account_number": "1234567890",
  "amount": 5000
}
```

Response:
```json
{
  "success": true,
  "message": "Bill paid successfully",
  "reference": "UTIL-1691823600000",
  "utility": "Electricity",
  "amount": 5000
}
```

#### Get Bill History
**GET** `/utility/history` (Protected)

Response:
```json
{
  "success": true,
  "bills": [
    {
      "id": 1,
      "user_id": 1,
      "utility_type_id": 1,
      "utility_account_number": "1234567890",
      "amount": 5000,
      "status": "completed",
      "reference": "UTIL-1691823600000",
      "utility_name": "Electricity",
      "created_at": "2026-08-12T10:30:00Z"
    }
  ]
}
```

---

## Error Responses

### Common Error Codes

**400 - Bad Request**
```json
{
  "success": false,
  "message": "Invalid input provided"
}
```

**401 - Unauthorized**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. This should be added in production.

## Authentication Flow

1. User registers with email, phone, name, password
2. User logs in with email and password
3. Server returns JWT token
4. Client stores token in localStorage
5. Client includes token in Authorization header for protected requests
6. Server validates token on each protected request

## Security Notes

- Passwords are hashed with bcryptjs (10 salt rounds)
- JWT tokens expire after 7 days
- All database queries use parameterized statements
- CORS is enabled for localhost (configure for production)
- Input validation on all endpoints

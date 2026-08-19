# DataHub App - User Flow Guide

## Application Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DATAHUB APPLICATION                      │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
            ┌──────▼──────┐  ┌─────▼──────┐
            │  Not Logged │  │   Logged   │
            │    In       │  │    In      │
            └──────┬──────┘  └─────┬──────┘
                   │               │
         ┌─────────┼─────────┐     │
         │         │         │     │
    ┌────▼──┐ ┌───▼──┐  ┌──▼────┐│
    │Register│ │Login │  │Home   ││
    └────┬──┘ └───┬──┘  └──┬────┘│
         │        │        │      │
         └────┬───┴────┬───┘      │
              │        │          │
         ┌────▼──┬─────▼──┐       │
         │ Auth  │ Verify │       │
         │ User  │ Token  │       │
         └────┬──┴─────┬──┘       │
              │        │          │
              └────┬───┘          │
                   │              │
              ┌────▼──────────────▼──┐
              │   View Dashboard      │
              │  - Balance Display    │
              │  - Service Options    │
              └────┬─────────┬────┬───┘
                   │         │    │
         ┌─────────┘         │    └──────────┐
         │                   │               │
    ┌────▼──────┐   ┌────────▼────┐   ┌─────▼─────┐
    │ Airtime   │   │ Data Plans  │   │ Utilities │
    └────┬──────┘   └────────┬────┘   └─────┬─────┘
         │                   │               │
    ┌────▼──────────┐   ┌────▼──────────┐   │
    │Select Provider│   │Select Provider│   │
    │  - MTN        │   │  - MTN        │   │
    │  - Airtel     │   │  - Airtel     │   │
    │  - Glo        │   │  - Glo        │   │
    └────┬──────────┘   └────┬──────────┘   │
         │                   │               │
    ┌────▼──────────┐   ┌────▼──────────┐   │
    │View Plans     │   │View Plans     │   │
    │ - 100N - ₦100 │   │ - 100MB - ₦100│   │
    │ - 200N - ₦200 │   │ - 1GB - ₦500  │   │
    └────┬──────────┘   │ - 5GB - ₦2000 │   │
         │               └────┬──────────┘   │
    ┌────▼──────────┐        │               │
    │Enter Phone    │   ┌────▼──────────┐   │
    │Select Plan    │   │Enter Phone    │   │
    │Review Amount  │   │Select Plan    │   │
    └────┬──────────┘   └────┬──────────┘   │
         │                   │               │
         │               ┌───▼────────────┐  │
         │               │Select Utility  │  │
         │               │ - Electricity  │  │
         │               │ - Water        │  │
         │               │ - Internet     │  │
         │               │ - Gas          │  │
         │               └───┬────────────┘  │
         │                   │               │
         │               ┌───▼────────────┐  │
         │               │Enter Account   │  │
         │               │Enter Amount    │  │
         │               └───┬────────────┘  │
         │                   │               │
         └───────────┬───────┴───────┬───────┘
                     │               │
              ┌──────▼────────────────▼──┐
              │ Check Wallet Balance     │
              └──────┬──────────┬─────────┘
                     │          │
            ┌────────▼┐  ┌──────▼──────┐
            │Sufficient│  │Insufficient│
            └────┬────┘  └──────┬──────┘
                 │              │
              ┌──▼───────┐   ┌──▼────────────┐
              │ Debit    │   │ Show Error    │
              │Wallet    │   │Offer Fund     │
              │Process   │   │Wallet Option  │
              │Purchase  │   └───────────────┘
              └──┬───────┘
                 │
              ┌──▼──────────────┐
              │Create Record    │
              │Log Transaction  │
              │Generate Ref No  │
              └──┬──────────────┘
                 │
              ┌──▼──────────────┐
              │Show Success     │
              │Display Reference│
              │Update Balance   │
              └──┬──────────────┘
                 │
              ┌──▼──────────────┐
              │Option to View   │
              │- Transaction    │
              │- History        │
              │- New Purchase   │
              └──────────────────┘
```

## Transaction Flow

```
USER ACTION (e.g., Buy Airtime)
        │
        ▼
FRONTEND VALIDATION
  - Phone number check
  - Plan selection
        │
        ▼
API REQUEST (POST /api/airtime/buy)
  - Includes JWT token
  - Includes phone & plan_id
        │
        ▼
BACKEND AUTHENTICATION
  - Verify JWT token
  - Extract user ID
        │
        ▼
BUSINESS LOGIC
  ├─ Fetch plan details
  ├─ Check wallet balance
  └─ Validate plan exists
        │
        ▼
DATABASE TRANSACTION
  ├─ Debit wallet
  ├─ Insert airtime transaction
  ├─ Insert wallet transaction
  └─ Commit/Rollback
        │
        ▼
RESPONSE
  ├─ Success: Transaction ref
  └─ Error: Error message
        │
        ▼
FRONTEND UPDATE
  ├─ Update balance
  ├─ Show success message
  └─ Clear form
```

## Data Flow

```
Frontend (Browser)           Backend (Node.js)         Database (MySQL)
    │                            │                           │
    ├─ Register User ──────────┐ │                           │
    │                          │ ├─ Validate Input           │
    │                          │ ├─ Hash Password            │
    │                          ├─ INSERT User ──────────────┤
    │                          │ ├─ RETURN Success           │
    │◀─────────────────────────┤ │                           │
    │                          │ │                           │
    ├─ Login ──────────────────┐ │                           │
    │                          │ ├─ SELECT User              │
    │                          │◀┤ RETURN User Data          │
    │                          │ ├─ Compare Password         │
    │                          │ ├─ Generate JWT             │
    │◀─────────────────────────┤ │                           │
    │                          │ │                           │
    ├─ Buy Airtime ────────────┐ │                           │
    │  (+ JWT Token)           │ ├─ Verify Token             │
    │                          │ ├─ SELECT Plan ────────────┤
    │                          │◀┤ RETURN Plan               │
    │                          │ ├─ SELECT Balance           │
    │                          │◀┤ RETURN Balance            │
    │                          │ ├─ BEGIN Transaction        │
    │                          │ ├─ UPDATE Balance           │
    │                          ├─ INSERT Transaction ───────┤
    │                          │ ├─ INSERT Log               │
    │                          │ ├─ COMMIT                   │
    │◀─────────────────────────┤ │                           │
    │                          │ │                           │
    ├─ Get History ────────────┐ │                           │
    │  (+ JWT Token)           │ ├─ Verify Token             │
    │                          │ ├─ SELECT Transactions      │
    │                          │◀┤ RETURN Results            │
    │◀─────────────────────────┤ │                           │
    │                          │ │                           │
```

## User States

```
┌─────────────────────────────────┐
│     USER AUTHENTICATION STATE   │
└─────────────────────────────────┘

NOT AUTHENTICATED
├─ Page shown: Home (Public)
├─ Buttons visible:
│  ├─ Register
│  └─ Login
├─ Services: Cannot access
└─ Wallet: Cannot view

AUTHENTICATED
├─ Page shown: Full App
├─ Buttons visible:
│  ├─ User Email
│  └─ Logout
├─ Services: Full access
│  ├─ Airtime
│  ├─ Data
│  └─ Utilities
├─ Wallet: Can view balance
├─ Actions available:
│  ├─ Fund wallet
│  ├─ Buy services
│  └─ View history
└─ Token stored: localStorage
```

## Service Selection Flow

```
                    START
                     │
                     ▼
            Click "Services"
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼──┐   ┌───▼──┐   ┌───▼───┐
    │Airtime│   │Data  │   │Utility│
    └────┬──┘   └───┬──┘   └───┬───┘
         │          │          │
    ┌────▼─────┐   │       ┌───▼────────┐
    │Load       │   │       │Load Utility│
    │Providers  │   │       │Types       │
    └────┬─────┘   │       └───┬────────┘
         │          │          │
    ┌────▼────────┐ │       ┌──▼──────────┐
    │Show Provider│ │       │Show Types   │
    │Dropdown     │ │       │Dropdown     │
    └────┬────────┘ │       └──┬──────────┘
         │          │          │
    ┌────▼────────┐ │       ┌──▼──────────┐
    │User Selects │ │       │User Enters: │
    │Provider     │ │       │ - Account # │
    └────┬────────┘ │       │ - Amount    │
         │          │       └──┬──────────┘
    ┌────▼────────┐ │       ┌──▼──────────┐
    │Load Plans   │ │       │Click "Pay"  │
    │from DB      │ │       └──┬──────────┘
    └────┬────────┘ │          │
         │          │   ┌──────▼──────┐
    ┌────▼────────┐ │   │Process      │
    │Show Plan    │ │   │Payment      │
    │Options      │ │   └─────┬───────┘
    └────┬────────┘ │         │
         │          │    ┌────▼────┐
    ┌────▼────────┐ │    │Success/  │
    │User enters: │ │    │Error     │
    │ - Phone #   │ │    └─────┬────┘
    │ - Selects   │ │          │
    │   Plan      │ │     ┌────▼─────┐
    └────┬────────┘ │     │Update UI  │
         │          │     └──────┬────┘
    ┌────▼────────┐ │           │
    │Click "Buy"  │ │           │
    └────┬────────┘ │      Back to Home
         │          │           │
    ┌────▼────────┐ │      ┌────▼────┐
    │Process      │ │      │View New  │
    │Purchase     │ │      │Balance   │
    └────┬────────┘ │      └──────────┘
         │          │
    ┌────▼────────┐ │
    │Success/     │ │
    │Error        │ │
    └────┬────────┘ │
         │          │
    ┌────▴─────────┐ │
    │Update UI     │ │
    └──────────────┘ │
         │           │
         └───────────┴──────┘
              │
           ┌──▼──┐
           │Done │
           └─────┘
```

## Components Architecture

```
┌────────────────────────────────────────┐
│          INDEX.HTML                    │
│  (Single HTML file with all pages)     │
└────────────────────────────────────────┘
         │
         ├─ <header>
         │  └─ Navigation + Auth UI
         │
         ├─ <main>
         │  ├─ Page: Home
         │  ├─ Page: Services
         │  │   ├─ Airtime Section
         │  │   ├─ Data Section
         │  │   └─ Utility Section
         │  └─ Page: History
         │
         ├─ <modals>
         │  ├─ Login Modal
         │  ├─ Register Modal
         │  └─ Fund Wallet Modal
         │
         └─ <footer>

┌────────────────────────────────────────┐
│          JS/APP.JS                     │
│  (Vanilla JavaScript logic)            │
└────────────────────────────────────────┘
         │
         ├─ Auth Functions
         │  ├─ register()
         │  ├─ login()
         │  └─ logout()
         │
         ├─ Wallet Functions
         │  ├─ fundWallet()
         │  └─ updateWalletBalance()
         │
         ├─ Airtime Functions
         │  ├─ loadAirtimeProviders()
         │  ├─ loadAirtimePlans()
         │  └─ buyAirtime()
         │
         ├─ Data Functions
         │  ├─ loadDataProviders()
         │  ├─ loadDataPlans()
         │  └─ buyData()
         │
         ├─ Utility Functions
         │  ├─ loadUtilityTypes()
         │  └─ payUtilityBill()
         │
         ├─ UI Functions
         │  ├─ showPage()
         │  ├─ showModal()
         │  └─ showMessage()
         │
         └─ API Helper
            └─ fetch() calls

┌────────────────────────────────────────┐
│          SERVER.JS                     │
│  (Express application)                 │
└────────────────────────────────────────┘
         │
         ├─ Middleware
         │  ├─ helmet()
         │  ├─ cors()
         │  ├─ json()
         │  └─ static()
         │
         ├─ Routes
         │  ├─ /api/auth/*
         │  ├─ /api/wallet/*
         │  ├─ /api/airtime/*
         │  ├─ /api/data/*
         │  └─ /api/utility/*
         │
         └─ Error Handler

┌────────────────────────────────────────┐
│      BACKEND CONTROLLERS               │
│  (Business logic for each service)     │
└────────────────────────────────────────┘
         │
         ├─ authController
         │  ├─ register()
         │  ├─ login()
         │  └─ getProfile()
         │
         ├─ walletController
         │  ├─ getBalance()
         │  ├─ fundWallet()
         │  └─ getTransactions()
         │
         ├─ airtimeController
         │  ├─ getProviders()
         │  ├─ getPlans()
         │  └─ buyAirtime()
         │
         ├─ dataController
         │  ├─ getProviders()
         │  ├─ getPlans()
         │  └─ buyData()
         │
         └─ utilityController
            ├─ getUtilityTypes()
            ├─ payBill()
            └─ getBillHistory()

┌────────────────────────────────────────┐
│        DATABASE SCHEMA                 │
│  (MySQL tables and relationships)      │
└────────────────────────────────────────┘
         │
         ├─ users
         ├─ wallet_transactions
         ├─ airtime_plans
         ├─ airtime_transactions
         ├─ data_plans
         ├─ data_transactions
         ├─ utility_types
         └─ utility_bills
```

## Error Handling Flow

```
USER ACTION
    │
    ▼
FRONTEND VALIDATION
    │
    ├─ ✓ Valid ──────┐
    │                │
    └─ ✗ Invalid     ├─► Show Error Message
                     │   (red/error class)
API REQUEST          │
    │◀───────────────┘
    ▼
BACKEND AUTHENTICATION
    │
    ├─ ✓ Valid Token ─┐
    │                 │
    └─ ✗ Invalid      ├─► Return 401/403
                      │   Show Auth Error
BUSINESS LOGIC        │
    │◀────────────────┘
    ▼
VALIDATION
    │
    ├─ ✓ Valid Input ──┐
    │                  │
    └─ ✗ Invalid       ├─► Return 400
                       │   Show Input Error
DATABASE OPERATION    │
    │◀─────────────────┘
    ▼
TRANSACTION
    │
    ├─ ✓ Success ──────┐
    │                  │
    └─ ✗ Failure       ├─► ROLLBACK
                       │   Return 500
RESPONSE              │
    │◀─────────────────┘
    ▼
FRONTEND UPDATE
    │
    ├─ Success ──► Update UI + Success Message
    │              Update Balance
    │              Clear Form
    │
    └─ Error ────► Show Error Message
                   Suggest Action
                   (Fund wallet, etc.)
```

This comprehensive flow guide helps understand how DataHub works from user interaction to database!

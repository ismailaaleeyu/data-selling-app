# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js v14+ installed
- MySQL Server running
- Git (optional)

### Step 1: Install Dependencies
```bash
cd /workspaces/data-selling-app
npm install
```

### Step 2: Set Up Database
```bash
# Open MySQL
mysql -u root -p

# Paste the contents of backend/config/database.sql
# Or run:
mysql -u root -p < backend/config/database.sql
```

### Step 3: Configure Environment
```bash
cp .env.example .env

# Edit .env with your MySQL credentials
# Update DB_PASSWORD with your MySQL password
```

### Step 4: Start Server
```bash
npm run dev
```

### Step 5: Open Browser
Navigate to: `http://localhost:3000`

---

## Usage

### Register
1. Click "Register" button
2. Fill in name, email, phone, and password
3. Click "Register"

### Login
1. Click "Login" button
2. Enter email and password
3. Click "Login"

### Fund Wallet
1. Click "Fund Wallet" button
2. Enter amount
3. Click "Proceed to Payment" (in production, this would redirect to payment gateway)

### Buy Airtime
1. Go to Services → Airtime
2. Select provider (MTN, Airtel, Glo)
3. Enter phone number
4. Select plan and amount
5. Confirm purchase

### Buy Data
1. Go to Services → Data Plans
2. Select provider
3. Enter phone number
4. Select data plan
5. Confirm purchase

### Pay Bills
1. Go to Services → Utility Bills
2. Select utility type
3. Enter account number and amount
4. Confirm payment

### Check History
1. Click "History" in navigation
2. View all transactions

---

## Sample Test Data

The database comes pre-populated with:

**Airtime Plans:**
- MTN: 100N, 200N
- Airtel: 100N, 200N
- Glo: 100N, 200N

**Data Plans:**
- MTN: 100MB (1 day), 1GB (7 days), 5GB (30 days)
- Airtel: 100MB (1 day), 1GB (7 days)
- Glo: 1GB (7 days), 5GB (30 days)

**Utility Types:**
- Electricity
- Water
- Internet
- Gas

---

## Default Credentials

No default user is created. You must register one first.

---

## Stopping the Server

Press `Ctrl + C` in the terminal to stop the server.

---

## Troubleshooting

### "Cannot find module 'express'"
```bash
npm install
```

### "connect ECONNREFUSED"
- Ensure MySQL is running
- Check DB credentials in .env

### "Port 3000 already in use"
- Change PORT in .env
- Or kill process: `lsof -i :3000` then `kill -9 <PID>`

### "No transactions" error
- Ensure wallet is funded before purchasing

---

## Next Steps

1. **Customize**: Edit colors, branding in index.html
2. **Add Payment Gateway**: Integrate Stripe or PayStack
3. **Deploy**: Deploy to Heroku, AWS, or your preferred platform
4. **Scale**: Add more providers, services, and features

---

## Support

- Check [README.md](./README.md) for full documentation
- Check [API_DOCS.md](./API_DOCS.md) for API reference
- Open an issue on GitHub for bugs

Happy selling! 🚀

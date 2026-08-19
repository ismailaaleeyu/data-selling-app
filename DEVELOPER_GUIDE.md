# Developer Guide

## Code Structure

### Controllers
Located in `backend/controllers/`, each controller handles business logic for a specific domain:

```javascript
// Example: authController.js
class AuthController {
  static async register(req, res) {
    // Extract data
    const { name, email, phone, password } = req.body;
    
    // Validate
    // Execute business logic
    // Return response
  }
}

module.exports = AuthController;
```

### Routes
Located in `backend/routes/`, routes map HTTP requests to controller methods:

```javascript
// Example: authRoutes.js
const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', authMiddleware, AuthController.getProfile);

module.exports = router;
```

### Middleware
Located in `backend/middleware/`, middleware functions process requests before reaching controllers:

```javascript
// Example: auth.js
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};
```

---

## Frontend Architecture

### App State
Global state in `js/app.js`:

```javascript
let currentUser = null;
let token = localStorage.getItem('token');
```

### Page Management
Single page app with page switching:

```javascript
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => 
    page.classList.remove('active')
  );
  document.getElementById(pageId).classList.add('active');
}
```

### API Calls
All API calls use fetch with error handling:

```javascript
async function login() {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    // Handle response
  } catch (error) {
    showMessage(elementId, 'Network error', 'error');
  }
}
```

---

## Adding New Features

### Example: Add SMS Notifications

#### 1. Install Dependencies
```bash
npm install twilio
```

#### 2. Update .env
```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### 3. Create SMS Service
```javascript
// backend/services/smsService.js
const twilio = require('twilio');

class SMSService {
  static async sendSMS(phoneNumber, message) {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    return await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
  }
}

module.exports = SMSService;
```

#### 4. Use in Controller
```javascript
// In airtimeController.js
const SMSService = require('../services/smsService');

await SMSService.sendSMS(phone_number, 
  `Your airtime purchase of ₦${plan.amount} was successful. Ref: ${reference}`
);
```

---

## Adding Payment Gateway

### Example: Stripe Integration

#### 1. Install Stripe
```bash
npm install stripe
```

#### 2. Create Payment Service
```javascript
// backend/services/paymentService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  static async createPaymentIntent(amount, description) {
    return await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'ngn',
      description
    });
  }
  
  static async confirmPayment(paymentIntentId) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }
}

module.exports = PaymentService;
```

#### 3. Create Payment Route
```javascript
// backend/routes/paymentRoutes.js
const PaymentService = require('../services/paymentService');

router.post('/create-intent', authMiddleware, async (req, res) => {
  const { amount, description } = req.body;
  
  try {
    const paymentIntent = await PaymentService.createPaymentIntent(
      amount, 
      description
    );
    
    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
```

---

## Database Migrations

### Adding a New Table

1. Create SQL file:
```sql
-- migrations/001_add_referrals_table.sql
ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;

CREATE TABLE IF NOT EXISTS referrals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  referrer_id INT NOT NULL,
  referred_id INT NOT NULL,
  bonus_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referred_id) REFERENCES users(id)
);
```

2. Apply migration:
```bash
mysql -u root -p data_selling_app < migrations/001_add_referrals_table.sql
```

---

## Testing API Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "08012345678",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get Balance (with token)
curl -X GET http://localhost:3000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Create collection: "DataHub API"
2. Add requests for each endpoint
3. Set Authorization header in each protected request
4. Save and reuse

---

## Debugging

### Enable Debug Logs
```javascript
// In server.js
process.env.DEBUG = 'app:*';
```

### Database Query Logging
```javascript
// In database.js
const pool = mysql.createPool({
  // ... other config
  debug: ['ComQueryPacket', 'RowDataPacket']
});
```

### Frontend Console
```javascript
// In js/app.js
window.DEBUG = true;

// Then use:
if (window.DEBUG) console.log('Debug message');
```

---

## Performance Optimization

### 1. Database Indexing
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_phone ON users(phone);
CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
```

### 2. Caching
```javascript
// Add Redis caching
const redis = require('redis');
const client = redis.createClient();

// Cache provider list
router.get('/providers', async (req, res) => {
  const cached = await client.get('airtime:providers');
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch from DB
  const [providers] = await pool.query(...);
  await client.setEx('airtime:providers', 3600, JSON.stringify(providers));
  
  res.json({ success: true, providers });
});
```

### 3. API Response Compression
```javascript
const compression = require('compression');
app.use(compression());
```

---

## Deployment

### Environment Setup for Production

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=strong-password
DB_NAME=data_selling_app
JWT_SECRET=very-long-random-secret-key
STRIPE_SECRET_KEY=sk_live_...
```

### Heroku Deployment

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add MySQL
heroku addons:create cleardb:ignite

# Set environment variables
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main
```

---

## Best Practices

1. **Always validate input** on both frontend and backend
2. **Use transactions** for multi-step operations (wallet debit + transaction log)
3. **Handle errors gracefully** with meaningful messages
4. **Log important events** for debugging and audit
5. **Keep controllers thin** - business logic in services
6. **Use environment variables** for all secrets
7. **Test thoroughly** before deployment
8. **Document API changes** in API_DOCS.md
9. **Follow REST conventions** for API endpoints
10. **Use proper HTTP status codes** (200, 400, 401, 404, 500)

---

## Common Issues & Solutions

### Issue: Database connection pooling exhausted
```javascript
// Solution: Increase pool limit
const pool = mysql.createPool({
  connectionLimit: 20  // Increase from 10
});
```

### Issue: Slow queries
```javascript
// Solution: Add indexes
CREATE INDEX idx_name ON table(column);

// Monitor query time
console.time('query');
// ... query code ...
console.timeEnd('query');
```

### Issue: CORS errors
```javascript
// Solution: Configure CORS properly
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

---

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT Explanation](https://jwt.io/introduction)
- [REST API Best Practices](https://restfulapi.net/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

Happy coding! 🚀

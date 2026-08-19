# DataHub - Airtime, Data & Utility Bill Selling App

A modern, full-stack web application for buying airtime, mobile data bundles, and paying utility bills. Built with Node.js, Express, MySQL, and Vanilla JavaScript.

## Features

✅ **User Authentication**
- Secure registration and login with JWT
- Password hashing with bcryptjs
- Token-based authorization

✅ **Wallet Management**
- Fund wallet for purchases
- Real-time balance display
- Transaction history tracking

✅ **Airtime Top-Up**
- Support for multiple providers (MTN, Airtel, Glo)
- Multiple denomination options
- Instant purchase confirmation

✅ **Mobile Data Plans**
- Various data bundle sizes (100MB - 5GB)
- Different validity periods
- Competitive pricing

✅ **Utility Bill Payments**
- Electricity, Water, Internet, Gas
- Account number tracking
- Payment confirmation and history

✅ **Security**
- HTTPS support
- CORS protection
- Helmet.js for security headers
- Input validation
- Secure database transactions

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **API Requests**: Axios
- **Security**: Helmet.js, CORS
- **Validation**: express-validator

## Project Structure

```
data-selling-app/
├── index.html                 # Frontend entry point
├── js/
│   └── app.js                 # Frontend logic
├── backend/
│   ├── config/
│   │   ├── database.js        # Database connection
│   │   └── database.sql       # Database schema
│   ├── controllers/           # API business logic
│   │   ├── authController.js
│   │   ├── walletController.js
│   │   ├── airtimeController.js
│   │   ├── dataController.js
│   │   └── utilityController.js
│   ├── routes/                # API endpoints
│   │   ├── authRoutes.js
│   │   ├── walletRoutes.js
│   │   ├── airtimeRoutes.js
│   │   ├── dataRoutes.js
│   │   └── utilityRoutes.js
│   ├── middleware/            # Custom middleware
│   │   └── auth.js            # JWT verification
│   ├── services/              # External services (placeholder)
│   │   ├── dataService.js
│   │   └── walletService.js
├── server.js                  # Express server entry
├── package.json               # Dependencies
└── .env.example               # Environment variables template
```

## Prerequisites

- Node.js (v14+)
- MySQL Server (v5.7+)
- npm or yarn

## Installation

### 1. Clone the Repository

```bash
cd /workspaces/data-selling-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Database

```bash
# Open MySQL CLI
mysql -u root -p

# Run the schema
source backend/config/database.sql
```

### 4. Configure Environment Variables

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your configuration
```

**.env Configuration:**
```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=data_selling_app
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=your_stripe_key
```

### 5. Start the Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The app will be running at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)

### Wallet
- `GET /api/wallet/balance` - Get wallet balance (requires auth)
- `POST /api/wallet/fund` - Fund wallet (requires auth)
- `GET /api/wallet/transactions` - Get transaction history (requires auth)

### Airtime
- `GET /api/airtime/providers` - Get available providers
- `GET /api/airtime/plans` - Get airtime plans
- `POST /api/airtime/buy` - Purchase airtime (requires auth)

### Data
- `GET /api/data/providers` - Get available providers
- `GET /api/data/plans` - Get data plans
- `POST /api/data/buy` - Purchase data (requires auth)

### Utility Bills
- `GET /api/utility/types` - Get utility types
- `POST /api/utility/pay` - Pay utility bill (requires auth)
- `GET /api/utility/history` - Get bill payment history (requires auth)

## API Request Examples

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Buy Airtime
```bash
curl -X POST http://localhost:3000/api/airtime/buy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone_number": "08012345678",
    "plan_id": 1
  }'
```

## Features in Detail

### 1. User Authentication
- Secure password hashing using bcryptjs
- JWT token generation for stateless authentication
- Protected routes with middleware verification
- Session persistence with localStorage

### 2. Wallet System
- Fund wallet with flexible amounts
- Real-time balance tracking
- Transaction logging for audit trail
- Support for credits and debits

### 3. Service Offerings
- **Airtime**: 100N, 200N denominations for MTN, Airtel, Glo
- **Data**: 100MB to 5GB bundles with various validity periods
- **Utilities**: Support for electricity, water, internet, gas

### 4. Database Design
- Normalized schema with proper relationships
- Transaction support for atomic operations
- Audit timestamps on all records
- Indexed fields for optimal query performance

## Security Measures

1. **Password Security**: Bcryptjs with salt rounds
2. **Token Security**: JWT with expiration
3. **Database Security**: Parameterized queries (mysql2)
4. **API Security**: CORS, Helmet.js headers
5. **Input Validation**: express-validator
6. **Error Handling**: Proper error responses

## Future Enhancements

- [ ] Payment gateway integration (Stripe, PayStack)
- [ ] SMS notifications for transactions
- [ ] Email receipts
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] Mobile app (React Native)
- [ ] Rate limiting
- [ ] 2FA authentication
- [ ] Referral program
- [ ] Bulk purchase discounts

## Testing

### Manual Testing Steps

1. **Register User**
   - Navigate to app
   - Click "Register"
   - Fill in details and submit

2. **Fund Wallet**
   - Login with credentials
   - Click "Fund Wallet"
   - Enter amount and confirm

3. **Purchase Airtime**
   - Go to Services
   - Select Airtime
   - Choose provider and plan
   - Enter phone number
   - Confirm purchase

4. **Check History**
   - Click History tab
   - View all transactions

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: Ensure MySQL is running and credentials in `.env` are correct

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Change PORT in `.env` or kill process using port 3000

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Ensure backend is running on correct port and CORS is properly configured

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see LICENSE file for details

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: support@datahub.com
- Documentation: [Full API Docs](./API_DOCS.md)

## Version History

### v1.0.0 (Current)
- Initial release
- User authentication
- Wallet management
- Airtime, Data, and Utility services
- Transaction history

## Roadmap

**Q3 2026**
- Payment gateway integration
- Email/SMS notifications
- Admin panel

**Q4 2026**
- Mobile app launch
- Advanced analytics
- Referral system

---

**Made with ❤️ by DataHub Team**

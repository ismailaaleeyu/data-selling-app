#!/bin/bash

# DataHub App - Quick Reference Commands
# Copy and paste these commands for common tasks

echo "==========================================
DataHub App - Quick Reference
==========================================="

# Setup Commands
echo "
SETUP:
npm install                              # Install dependencies
cp .env.example .env                     # Create .env file
mysql -u root -p < backend/config/database.sql  # Setup database
"

# Running the App
echo "
RUNNING:
npm run dev                              # Development mode with auto-reload
npm start                                # Production mode
PORT=5000 npm run dev                    # Run on different port
"

# Database Commands
echo "
DATABASE:
mysql -u root -p data_selling_app        # Connect to database
SHOW TABLES;                             # List all tables
DESC users;                              # View table structure
"

# Testing API
echo "
API TESTING (cURL):
# Register
curl -X POST http://localhost:3000/api/auth/register \\
  -H 'Content-Type: application/json' \\
  -d '{\"name\":\"Test\",\"email\":\"test@example.com\",\"phone\":\"08012345678\",\"password\":\"pass\"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{\"email\":\"test@example.com\",\"password\":\"pass\"}'

# Get Balance
curl -X GET http://localhost:3000/api/wallet/balance \\
  -H 'Authorization: Bearer YOUR_TOKEN'
"

# Common Issues
echo "
TROUBLESHOOTING:
# Port already in use
lsof -i :3000
kill -9 <PID>

# MySQL not running
sudo systemctl start mysql    # Linux
brew services start mysql     # MacOS
net start MySQL80             # Windows

# Clear node_modules
rm -rf node_modules
npm install

# View logs
tail -f ~/.npm-debug.log
"

# File Locations
echo "
KEY FILES:
Frontend:         index.html
Frontend Logic:   js/app.js
Server:           server.js
Auth:             backend/middleware/auth.js
Controllers:      backend/controllers/*.js
Routes:           backend/routes/*.js
Database:         backend/config/database.js
"

# Documentation
echo "
DOCUMENTATION:
README.md              - Full project overview
QUICKSTART.md          - 5-minute setup guide
API_DOCS.md            - Complete API reference
DEVELOPER_GUIDE.md     - Development examples
PROJECT_SUMMARY.md     - What was built
"

# Development Tips
echo "
DEVELOPMENT TIPS:
1. Always create .env before running
2. Ensure MySQL is running before starting server
3. Use Postman/cURL to test API endpoints
4. Check browser console for frontend errors
5. Check server logs for backend errors
6. Test both frontend and API thoroughly
"

echo "
==========================================="

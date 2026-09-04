const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// ======================================================
// INITIALIZE APP
// ======================================================

const app = express();

// ======================================================
// SECURITY / MIDDLEWARE
// ======================================================

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: ["'self'"],

        scriptSrcAttr: [
          "'self'",
          "'unsafe-inline'"
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https:"
        ],

        imgSrc: [
          "'self'",
          "data:"
        ],

        fontSrc: [
          "'self'",
          "https:",
          "data:"
        ],

        connectSrc: [
          "'self'",
          "http://localhost:*"
        ],

        formAction: ["'self'"],

        frameAncestors: ["'self'"],

        baseUri: ["'self'"],

        objectSrc: ["'none'"]
      }
    }
  })
);
// Preserve the raw Paystack payload for signature verification.
app.use('/api/payment/webhook', express.raw({
  type: 'application/json',
  verify: (req, res, buffer) => {
    req.rawBody = buffer;
  }
}));

// CORS
app.use(cors());

// ======================================================
// CUSTOM JSON BODY PARSER
// ======================================================
//
// This parser handles:
// 1. Normal JSON
// 2. PowerShell curl.exe escaped JSON
//
// Example normal:
// {"email":"test@example.com","password":"123"}
//
// Example escaped:
// {\"email\":\"test@example.com\",\"password\":\"123\"}
//
// ======================================================
app.use((req, res, next) => {

  // Only process JSON requests
  const contentType =
    req.headers['content-type'] || '';

  if (
    !contentType.includes('application/json')
  ) {
    return next();
  }

  let rawData = '';

  req.setEncoding('utf8');

  req.on('data', chunk => {
    rawData += chunk;
  });

  req.on('end', () => {

    if (!rawData) {
      req.body = {};
      return next();
    }

    try {

      // First attempt: normal JSON
      req.body = JSON.parse(rawData);

      return next();

    } catch (firstError) {

      console.warn(
        'Normal JSON parsing failed. Attempting escaped JSON parsing...'
      );

      try {

        // Remove PowerShell-style escaped quotes
        const cleanedData =
          rawData
            .replace(/\\"/g, '"')
            .replace(/^'|'$/g, '');

        req.body =
          JSON.parse(cleanedData);

        return next();

      } catch (secondError) {

        console.error(
          'JSON parsing failed:',
          secondError.message
        );

        console.error(
          'Received body:',
          rawData
        );

        return res.status(400).json({
          success: false,
          message: 'Invalid JSON request body',
          error:
            process.env.NODE_ENV === 'development'
              ? secondError.message
              : undefined
        });
      }
    }
  });
});

// ======================================================
// URL ENCODED DATA
// ======================================================

app.use(
  express.urlencoded({
    extended: true
  })
);

// ======================================================
// STATIC FILES
// ======================================================

app.use(
  express.static('.')
);

// ======================================================
// IMPORT ROUTES
// ======================================================

const authRoutes =
  require('./backend/routes/authRoutes');

const airtimeRoutes =
  require('./backend/routes/airtimeRoutes');

const dataRoutes =
  require('./backend/routes/dataRoutes');

const utilityRoutes =
  require('./backend/routes/utilityRoutes');

const walletRoutes =
  require('./backend/routes/walletRoutes');

const paymentRoutes =
  require('./backend/routes/paymentRoutes');

// ADMIN ROUTES
const adminRoutes =
  require('./backend/routes/adminRoutes');

// ======================================================
// API ROUTES
// ======================================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/airtime',
  airtimeRoutes
);

app.use(
  '/api/data',
  dataRoutes
);

app.use(
  '/api/utility',
  utilityRoutes
);

app.use(
  '/api/wallet',
  walletRoutes
);

app.use(
  '/api/payment',
  paymentRoutes
);

// ADMIN API
app.use(
  '/api/admin',
  adminRoutes
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      success: true,
      status: 'Server is running',
      timestamp: new Date()
    });

  }
);

// ======================================================
// ADMIN ROUTE TEST
// ======================================================
//
// This allows us to confirm that the admin router
// itself is connected before testing login.
//

app.get(
  '/api/admin/test',
  (req, res) => {

    res.json({
      success: true,
      message: 'Admin API is working'
    });

  }
);

// ======================================================
// 404 HANDLER
// ======================================================

app.use(
  (req, res) => {

    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.originalUrl
    });

  }
);

// ======================================================
// ERROR HANDLING
// ======================================================

app.use(
  (err, req, res, next) => {

    console.error(
      '\n========== SERVER ERROR =========='
    );

    console.error(
      err.stack || err.message || err
    );

    console.error(
      '=================================\n'
    );

    res.status(500).json({
      success: false,
      message: 'Server error',

      error:
        process.env.NODE_ENV === 'development'
          ? err.message
          : undefined
    });

  }
);

// ======================================================
// START SERVER
// ======================================================

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  () => {

    console.log('');
    console.log(
      '=========================================='
    );

    console.log(
      '       DATAHUB SERVER STARTED'
    );

    console.log(
      '=========================================='
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      `Health: http://localhost:${PORT}/api/health`
    );

    console.log(
      `Admin:  http://localhost:${PORT}/api/admin`
    );

    console.log(
      '=========================================='
    );

    console.log(
      '✓ Authentication routes loaded'
    );

    console.log(
      '✓ Airtime routes loaded'
    );

    console.log(
      '✓ Data routes loaded'
    );

    console.log(
      '✓ Utility routes loaded'
    );

    console.log(
      '✓ Wallet routes loaded'
    );

    console.log(
      '✓ Payment routes loaded'
    );

    console.log(
      '✓ Admin routes loaded'
    );

    console.log(
      '=========================================='
    );

  }
);

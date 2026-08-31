const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {

  const authHeader =
    req.headers.authorization;

  const token =
    authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }

  try {

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    if (
      decoded.role !== 'admin' ||
      !decoded.adminId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Admin access denied'
      });
    }

    req.adminId =
      decoded.adminId;

    req.adminEmail =
      decoded.email;

    req.adminRole =
      decoded.role;

    next();

  } catch (error) {

    console.error(
      'Admin authentication error:',
      error.message
    );

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin token'
    });
  }
};

module.exports = adminAuth;

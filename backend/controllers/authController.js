const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

class AuthController {
  static async register(req, res) {
    const { name, email, phone, password } = req.body;

    try {
      // Check if user already exists
      const [existingUser] = await pool.query(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [email, phone]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      await pool.query(
        'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
        [name, email, phone, hashedPassword]
      );

      res.status(201).json({ 
        success: true, 
        message: 'User registered successfully' 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    try {
      // Find user
      const [users] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const user = users[0];

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({ 
        success: true, 
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          wallet_balance: user.wallet_balance
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  }

  static async getProfile(req, res) {
    try {
      const [users] = await pool.query(
        'SELECT id, name, email, phone, wallet_balance, created_at FROM users WHERE id = ?',
        [req.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, user: users[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
  }
}

module.exports = AuthController;

const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AdminController {

  // ==========================================
  // ADMIN LOGIN
  // ==========================================
  static async login(req, res) {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    try {

      const [admins] = await pool.execute(
        `SELECT id, name, email, phone, password_hash
         FROM admins
         WHERE email = ?`,
        [email]
      );

      if (admins.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const admin = admins[0];

      const passwordMatch =
        await bcrypt.compare(
          password,
          admin.password_hash
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = jwt.sign(
        {
          adminId: admin.id,
          email: admin.email,
          role: 'admin'
        },
        process.env.JWT_SECRET,
        {
          expiresIn: '7d'
        }
      );

      res.json({
        success: true,
        message: 'Admin login successful',
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: 'admin'
        }
      });

    } catch (error) {

      console.error(
        'Admin login error:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'Admin login failed'
      });
    }
  }
}

module.exports = AdminController;

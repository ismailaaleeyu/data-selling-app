const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const AdminController = {

    async login(req, res) {

        try {

            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }

            const [admins] = await db.query(
                'SELECT * FROM admins WHERE email = ? LIMIT 1',
                [email]
            );

            if (admins.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid admin credentials'
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
                    message: 'Invalid admin credentials'
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
                    expiresIn: '24h'
                }
            );

            res.json({
                success: true,
                message: 'Admin login successful',
                token,
                admin: {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email
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
};

module.exports = AdminController;

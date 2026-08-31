const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const AdminController = {

    // ==================================================
    // ADMIN LOGIN
    // ==================================================

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
    },


    // ==================================================
    // DASHBOARD STATISTICS
    // ==================================================

    async dashboard(req, res) {

        try {

            // Total users
            const [userCount] = await db.query(
                'SELECT COUNT(*) AS total FROM users'
            );

            // Total wallet balance
            const [walletBalance] = await db.query(
                'SELECT COALESCE(SUM(wallet_balance), 0) AS total FROM users'
            );

            // Total wallet transactions
            const [transactionCount] = await db.query(
                'SELECT COUNT(*) AS total FROM wallet_transactions'
            );

            // Total data transactions
            const [dataCount] = await db.query(
                'SELECT COUNT(*) AS total FROM data_transactions'
            );

            // Total airtime transactions
            const [airtimeCount] = await db.query(
                'SELECT COUNT(*) AS total FROM airtime_transactions'
            );

            // Total utility transactions
            const [utilityCount] = await db.query(
                'SELECT COUNT(*) AS total FROM utility_bills'
            );

            // Completed data sales
            const [dataSales] = await db.query(
                `SELECT COALESCE(SUM(amount), 0) AS total
                 FROM data_transactions
                 WHERE status = 'completed'`
            );

            // Completed airtime sales
            const [airtimeSales] = await db.query(
                `SELECT COALESCE(SUM(amount), 0) AS total
                 FROM airtime_transactions
                 WHERE status = 'completed'`
            );

            // Completed utility payments
            const [utilitySales] = await db.query(
                `SELECT COALESCE(SUM(amount), 0) AS total
                 FROM utility_bills
                 WHERE status = 'completed'`
            );

            res.json({
                success: true,

                statistics: {
                    total_users:
                        Number(userCount[0].total),

                    total_wallet_balance:
                        Number(walletBalance[0].total),

                    total_wallet_transactions:
                        Number(transactionCount[0].total),

                    total_data_transactions:
                        Number(dataCount[0].total),

                    total_airtime_transactions:
                        Number(airtimeCount[0].total),

                    total_utility_transactions:
                        Number(utilityCount[0].total),

                    total_data_sales:
                        Number(dataSales[0].total),

                    total_airtime_sales:
                        Number(airtimeSales[0].total),

                    total_utility_sales:
                        Number(utilitySales[0].total)
                }
            });

        } catch (error) {

            console.error(
                'Admin dashboard error:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Failed to load dashboard statistics',
                error:
                    process.env.NODE_ENV === 'development'
                        ? error.message
                        : undefined
            });
        }
    },


    // ==================================================
    // GET ALL USERS
    // ==================================================

    async getUsers(req, res) {

        try {

            const [users] = await db.query(
                `SELECT
                    id,
                    name,
                    email,
                    phone,
                    wallet_balance,
                    created_at,
                    updated_at
                 FROM users
                 ORDER BY created_at DESC`
            );

            res.json({
                success: true,
                users
            });

        } catch (error) {

            console.error(
                'Admin get users error:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Failed to load users'
            });
        }
    },


    // ==================================================
    // GET WALLET TRANSACTIONS
    // ==================================================

    async getWalletTransactions(req, res) {

        try {

            const [transactions] = await db.query(
                `SELECT
                    wt.*,
                    u.name AS user_name,
                    u.email AS user_email
                 FROM wallet_transactions wt
                 LEFT JOIN users u
                    ON wt.user_id = u.id
                 ORDER BY wt.created_at DESC
                 LIMIT 500`
            );

            res.json({
                success: true,
                transactions
            });

        } catch (error) {

            console.error(
                'Admin wallet transactions error:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Failed to load wallet transactions'
            });
        }
    },


    // ==================================================
    // GET DATA TRANSACTIONS
    // ==================================================

    async getDataTransactions(req, res) {

        try {

            const [transactions] = await db.query(
                `SELECT
                    dt.*,
                    u.name AS user_name,
                    u.email AS user_email
                 FROM data_transactions dt
                 LEFT JOIN users u
                    ON dt.user_id = u.id
                 ORDER BY dt.created_at DESC
                 LIMIT 500`
            );

            res.json({
                success: true,
                transactions
            });

        } catch (error) {

            console.error(
                'Admin data transactions error:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Failed to load data transactions'
            });
        }
    },


    // ==================================================
    // GET AIRTIME TRANSACTIONS
    // ==================================================

    async getAirtimeTransactions(req, res) {

        try {

            const [transactions] = await db.query(
                `SELECT
                    at.*,
                    u.name AS user_name,
                    u.email AS user_email
                 FROM airtime_transactions at
                 LEFT JOIN users u
                    ON at.user_id = u.id
                 ORDER BY at.created_at DESC
                 LIMIT 500`
            );

            res.json({
                success: true,
                transactions
            });

        } catch (error) {

            console.error(
                'Admin airtime transactions error:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Failed to load airtime transactions'
            });
        }
    },


    // ==================================================
    // GET UTILITY TRANSACTIONS
    // ==================================================

    async getUtilityTransactions(req, res) {

        try {

            const [transactions] = await db.query(
                `SELECT
                    ub.*,
                    u.name AS user_name,
                    u.email AS user_email
                 FROM utility_bills ub
                 LEFT JOIN users u
                    ON ub.user_id = u.id
                 ORDER BY ub.created_at DESC
                 LIMIT 500`
            );

            res.json({
                success: true,
                transactions
            });

        } catch (error) {

            console.error(
                'Admin utility transactions error:',
                error
            );

            res.status(500).json({
                success: false,
                message: 'Failed to load utility transactions'
            });
        }
    }

};

module.exports = AdminController;

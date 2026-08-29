require('dotenv').config();

const pool = require('./backend/config/database');

async function migrate() {
  try {
    console.log('Connecting to database...');

    await pool.query(`
      ALTER TABLE data_transactions
      ADD COLUMN vtpass_request_id VARCHAR(100) NULL,
      ADD COLUMN vtpass_transaction_id VARCHAR(100) NULL
    `);

    console.log('✓ VTpass columns added successfully.');

    const [columns] = await pool.query(`
      DESCRIBE data_transactions
    `);

    console.table(columns);

  } catch (error) {
    console.error('✗ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

migrate();
require('dotenv').config();

const pool = require('./backend/config/database');

async function main() {
  try {
    console.log('Checking airtime_transactions reference index...');

    const [indexes] = await pool.query(
      `SHOW INDEX FROM airtime_transactions WHERE Column_name = 'reference'`
    );

    if (indexes.length === 0) {
      await pool.query(
        `ALTER TABLE airtime_transactions
         ADD UNIQUE KEY unique_airtime_reference (reference)`
      );

      console.log('✓ Unique airtime reference index created');
    } else {
      console.log('✓ Airtime reference index already exists');
    }

    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

main();
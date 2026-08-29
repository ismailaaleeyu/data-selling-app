require('dotenv').config();

const pool = require('./backend/config/database');

async function columnExists(columnName) {
  const [rows] = await pool.query(
    `SHOW COLUMNS FROM airtime_transactions LIKE ?`,
    [columnName]
  );

  return rows.length > 0;
}

async function main() {
  try {
    console.log('Updating airtime_transactions table...');

    // Add VTpass request ID
    if (!(await columnExists('vtpass_request_id'))) {
      await pool.query(
        `ALTER TABLE airtime_transactions
         ADD COLUMN vtpass_request_id VARCHAR(100) NULL AFTER reference`
      );

      console.log('✓ Added vtpass_request_id');
    } else {
      console.log('✓ vtpass_request_id already exists');
    }

    // Add VTpass transaction ID
    if (!(await columnExists('vtpass_transaction_id'))) {
      await pool.query(
        `ALTER TABLE airtime_transactions
         ADD COLUMN vtpass_transaction_id VARCHAR(100) NULL AFTER vtpass_request_id`
      );

      console.log('✓ Added vtpass_transaction_id');
    } else {
      console.log('✓ vtpass_transaction_id already exists');
    }

    console.log('\n✓ Airtime table update complete');

  } catch (error) {
    console.error('\n✗ Migration failed:');
    console.error(error.message);
    process.exitCode = 1;

  } finally {
    await pool.end();
  }
}

main();
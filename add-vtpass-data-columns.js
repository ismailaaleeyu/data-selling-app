const pool = require('./backend/config/database');

async function addVTPassColumns() {
  let connection;

  try {
    connection = await pool.getConnection();

    console.log('✓ Database connected successfully');

    // Check and add variation_code
    try {
      await connection.execute(`
        ALTER TABLE data_plans
        ADD COLUMN variation_code VARCHAR(100) NULL AFTER provider
      `);

      console.log('✓ variation_code added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ variation_code already exists');
      } else {
        throw error;
      }
    }

    // Check and add service_id
    try {
      await connection.execute(`
        ALTER TABLE data_plans
        ADD COLUMN service_id VARCHAR(100) NULL AFTER variation_code
      `);

      console.log('✓ service_id added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ service_id already exists');
      } else {
        throw error;
      }
    }

    console.log('\n========== UPDATED DATA PLANS TABLE ==========\n');

    const [columns] = await connection.execute(
      'DESCRIBE data_plans'
    );

    console.table(columns);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (connection) {
      connection.release();
    }

    await pool.end();
  }
}

addVTPassColumns();
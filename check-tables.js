const pool = require('./backend/config/database');

async function checkTables() {
  try {
    console.log('\n========== DATA PLANS ==========');
    const [dataPlans] = await pool.query('DESCRIBE data_plans');
    console.table(dataPlans);

    console.log('\n========== DATA TRANSACTIONS ==========');
    const [dataTransactions] = await pool.query('DESCRIBE data_transactions');
    console.table(dataTransactions);

    console.log('\n========== WALLET TRANSACTIONS ==========');
    const [walletTransactions] = await pool.query('DESCRIBE wallet_transactions');
    console.table(walletTransactions);

    console.log('\n========== SAMPLE DATA PLANS ==========');
    const [plans] = await pool.query('SELECT * FROM data_plans LIMIT 10');
    console.table(plans);

  } catch (error) {
    console.error('\nDatabase inspection failed:');
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkTables();
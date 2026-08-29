const pool = require('./backend/config/database');

const mtnPlans = [
  {
    variation_code: 'mtn-10mb-100',
    name: 'N100 100MB - 24 hrs',
    data_size: '100MB',
    validity_days: 1,
    price: 100
  },
  {
    variation_code: 'mtn-50mb-200',
    name: 'N200 200MB - 2 days',
    data_size: '200MB',
    validity_days: 2,
    price: 200
  },
  {
    variation_code: 'mtn-100mb-1000',
    name: 'N1000 1.5GB - 30 days',
    data_size: '1.5GB',
    validity_days: 30,
    price: 1000
  },
  {
    variation_code: 'mtn-500mb-2000',
    name: 'N2000 4.5GB - 30 days',
    data_size: '4.5GB',
    validity_days: 30,
    price: 2000
  },
  {
    variation_code: 'mtn-20hrs-1500',
    name: 'N1500 6GB - 7 days',
    data_size: '6GB',
    validity_days: 7,
    price: 1500
  },
  {
    variation_code: 'mtn-3gb-2500',
    name: 'N2500 6GB - 30 days',
    data_size: '6GB',
    validity_days: 30,
    price: 2500
  },
  {
    variation_code: 'mtn-data-3000',
    name: 'N3000 8GB - 30 days',
    data_size: '8GB',
    validity_days: 30,
    price: 3000
  },
  {
    variation_code: 'mtn-1gb-3500',
    name: 'N3500 10GB - 30 days',
    data_size: '10GB',
    validity_days: 30,
    price: 3500
  },
  {
    variation_code: 'mtn-100hr-5000',
    name: 'N5000 15GB - 30 days',
    data_size: '15GB',
    validity_days: 30,
    price: 5000
  },
  {
    variation_code: 'mtn-3gb-6000',
    name: 'N6000 20GB - 30 days',
    data_size: '20GB',
    validity_days: 30,
    price: 6000
  },
  {
    variation_code: 'mtn-40gb-10000',
    name: 'N10000 40GB - 30 days',
    data_size: '40GB',
    validity_days: 30,
    price: 10000
  },
  {
    variation_code: 'mtn-75gb-15000',
    name: 'N15000 75GB - 30 days',
    data_size: '75GB',
    validity_days: 30,
    price: 15000
  },
  {
    variation_code: 'mtn-110gb-20000',
    name: 'N20000 110GB - 30 days',
    data_size: '110GB',
    validity_days: 30,
    price: 20000
  },
  {
    variation_code: 'mtn-3gb-1500',
    name: 'N1500 3GB - 30 days',
    data_size: '3GB',
    validity_days: 30,
    price: 1500
  },
  {
    variation_code: 'mtn-25gb-sme-10000',
    name: 'MTN N10,000 25GB SME Mobile Data (1 Month)',
    data_size: '25GB',
    validity_days: 30,
    price: 10000
  },
  {
    variation_code: 'mtn-165gb-sme-50000',
    name: 'MTN N50,000 165GB SME Mobile Data (2 Months)',
    data_size: '165GB',
    validity_days: 60,
    price: 50000
  },
  {
    variation_code: 'mtn-360gb-sme-100000',
    name: 'MTN N100,000 360GB SME Mobile Data (3 Months)',
    data_size: '360GB',
    validity_days: 90,
    price: 100000
  },
  {
    variation_code: 'mtn-4-5tb-450000',
    name: 'MTN N450,000 4.5TB Mobile Data (1 Year)',
    data_size: '4.5TB',
    validity_days: 365,
    price: 450000
  },
  {
    variation_code: 'mtn-1tb-110000',
    name: 'MTN N100,000 1TB Mobile Data (1 Year)',
    data_size: '1TB',
    validity_days: 365,
    price: 100000
  },
  {
    variation_code: 'mtn-2-5gb-600',
    name: 'MTN N600 2.5GB - 2 days',
    data_size: '2.5GB',
    validity_days: 2,
    price: 600
  },
  {
    variation_code: 'mtn-120gb-22000',
    name: 'MTN N22000 120GB Monthly Plan + 80mins',
    data_size: '120GB + 80mins',
    validity_days: 30,
    price: 22000
  },
  {
    variation_code: 'mtn-100gb-20000',
    name: 'MTN 100GB 2-Month Plan',
    data_size: '100GB',
    validity_days: 60,
    price: 20000
  },
  {
    variation_code: 'mtn-160gb-30000',
    name: 'MTN N30,000 160GB 2-Month Plan',
    data_size: '160GB',
    validity_days: 60,
    price: 30000
  },
  {
    variation_code: 'mtn-400gb-50000',
    name: 'MTN N50,000 400GB 3-Month Plan',
    data_size: '400GB',
    validity_days: 90,
    price: 50000
  },
  {
    variation_code: 'mtn-600gb-75000',
    name: 'MTN N75,000 600GB 3-Months Plan',
    data_size: '600GB',
    validity_days: 90,
    price: 75000
  },
  {
    variation_code: 'mtn-xtratalk-300',
    name: 'MTN N300 Xtratalk Weekly Bundle',
    data_size: 'Xtratalk',
    validity_days: 7,
    price: 300
  },
  {
    variation_code: 'mtn-xtratalk-500',
    name: 'MTN N500 Xtratalk Weekly Bundle',
    data_size: 'Xtratalk',
    validity_days: 7,
    price: 500
  },
  {
    variation_code: 'mtn-xtratalk-1000',
    name: 'MTN N1000 Xtratalk Monthly Bundle',
    data_size: 'Xtratalk',
    validity_days: 30,
    price: 1000
  },
  {
    variation_code: 'mtn-xtratalk-2000',
    name: 'MTN N2000 Xtratalk Monthly Bundle',
    data_size: 'Xtratalk',
    validity_days: 30,
    price: 2000
  },
  {
    variation_code: 'mtn-xtratalk-5000',
    name: 'MTN N5000 Xtratalk Monthly Bundle',
    data_size: 'Xtratalk',
    validity_days: 30,
    price: 5000
  },
  {
    variation_code: 'mtn-xtratalk-10000',
    name: 'MTN N10000 Xtratalk Monthly Bundle',
    data_size: 'Xtratalk',
    validity_days: 30,
    price: 10000
  },
  {
    variation_code: 'mtn-xtratalk-15000',
    name: 'MTN N15000 Xtratalk Monthly Bundle',
    data_size: 'Xtratalk',
    validity_days: 30,
    price: 15000
  },
  {
    variation_code: 'mtn-xtratalk-20000',
    name: 'MTN N20000 Xtratalk Monthly Bundle',
    data_size: 'Xtratalk',
    validity_days: 30,
    price: 20000
  },
  {
    variation_code: 'mtn-3gb-800',
    name: 'MTN N800 3GB - 2 days',
    data_size: '3GB',
    validity_days: 2,
    price: 800
  },
  {
    variation_code: 'mtn-7gb-2000',
    name: 'MTN N2000 7GB - 7 days',
    data_size: '7GB',
    validity_days: 7,
    price: 2000
  },
  {
    variation_code: 'mtn-xtradata-200',
    name: 'MTN N200 Xtradata',
    data_size: 'Xtradata',
    validity_days: null,
    price: 200
  }

  // NOTE:
  // VTPass provided another "mtn-xtratalk-300" at N200.
  // It has the same variation_code as the N300 plan.
  // We intentionally DO NOT insert the duplicate variation_code.
];

async function importPlans() {
  let connection;

  try {
    connection = await pool.getConnection();

    console.log('✓ Database connected successfully');
    console.log(`\nImporting ${mtnPlans.length} MTN VTPass plans...\n`);

    let inserted = 0;
    let updated = 0;

    for (const plan of mtnPlans) {
      const [existing] = await connection.execute(
        `SELECT id FROM data_plans
         WHERE provider = 'MTN'
         AND variation_code = ?`,
        [plan.variation_code]
      );

      if (existing.length > 0) {
        await connection.execute(
          `UPDATE data_plans
           SET name = ?,
               data_size = ?,
               validity_days = ?,
               price = ?,
               service_id = 'mtn-data',
               active = TRUE
           WHERE id = ?`,
          [
            plan.name,
            plan.data_size,
            plan.validity_days,
            plan.price,
            existing[0].id
          ]
        );

        updated++;
        console.log(`↻ Updated: ${plan.name}`);
      } else {
        await connection.execute(
          `INSERT INTO data_plans
           (provider, variation_code, service_id, name, data_size,
            validity_days, price, active)
           VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            'MTN',
            plan.variation_code,
            'mtn-data',
            plan.name,
            plan.data_size,
            plan.validity_days,
            plan.price
          ]
        );

        inserted++;
        console.log(`✓ Added: ${plan.name}`);
      }
    }

    console.log('\n================================');
    console.log('IMPORT COMPLETED');
    console.log('================================');
    console.log(`✓ Inserted: ${inserted}`);
    console.log(`↻ Updated: ${updated}`);

    const [rows] = await connection.execute(
      `SELECT id, provider, variation_code, service_id,
              name, data_size, validity_days, price, active
       FROM data_plans
       WHERE provider = 'MTN'
       ORDER BY price ASC`
    );

    console.log('\n========== MTN DATA PLANS ==========\n');
    console.table(rows);

  } catch (error) {
    console.error('\n❌ Import failed:');
    console.error(error);
  } finally {
    if (connection) {
      connection.release();
    }

    await pool.end();
  }
}

importPlans();
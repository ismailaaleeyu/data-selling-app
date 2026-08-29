require('dotenv').config();

const vtpassService = require('./backend/services/vtpassService');

(async () => {
  try {
    console.log('Testing VTpass MTN Data Sandbox...');
    console.log('Base URL:', process.env.VTPASS_BASE_URL);

    const result = await vtpassService.buyData({
      serviceID: 'mtn-data',
      phone: '08011111111',
      variation_code: 'mtn-10mb-100',
      amount: 100
    });

    console.log('\nVTpass Data Response:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\nVTpass DATA TEST FAILED:');
    console.error(error.message);
  }
})();
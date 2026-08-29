require('dotenv').config();

const vtpassService = require('./backend/services/vtpassService');

(async () => {
  try {
    console.log('Testing VTpass Sandbox...');
    console.log('Base URL:', process.env.VTPASS_BASE_URL);

    const result = await vtpassService.buyAirtime({
      serviceID: 'mtn',
      phone: '08011111111',
      amount: 100
    });

    console.log('\nVTpass Response:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('\nVTpass TEST FAILED:');
    console.error(error.message);
  }
})();
require('dotenv').config();

const vtpassService = require('./backend/services/vtpassService');

async function test() {
  try {
    console.log('Testing VTpass Data Catalogue...');
    console.log(
      'Base URL:',
      process.env.VTPASS_BASE_URL
    );

    const providers = [
      'mtn-data',
      'airtel-data',
      'glo-data',
      'etisalat-data'
    ];

    for (const serviceID of providers) {

      console.log('\n====================================');
      console.log(`SERVICE: ${serviceID}`);
      console.log('====================================');

      try {
        const result =
          await vtpassService.getDataVariations(
            serviceID
          );

        console.log(
          JSON.stringify(result, null, 2)
        );

      } catch (error) {
        console.error(
          `Failed for ${serviceID}:`,
          error.message
        );
      }
    }

  } catch (error) {
    console.error(
      'Test failed:',
      error.message
    );
  }
}

test();
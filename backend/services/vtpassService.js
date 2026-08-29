const axios = require('axios');

class VTpassService {
  constructor() {
    this.baseURL =
      process.env.VTPASS_BASE_URL || 'https://sandbox.vtpass.com/api';
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'api-key': process.env.VTPASS_API_KEY,
      'secret-key': process.env.VTPASS_SECRET_KEY
    };
  }

  generateRequestId() {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const values = {};

    for (const part of parts) {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    }

    const timestamp =
      `${values.year}` +
      `${values.month}` +
      `${values.day}` +
      `${values.hour}` +
      `${values.minute}`;

    return `${timestamp}${Date.now().toString().slice(-8)}`;
  }

  // ==========================================
  // BUY AIRTIME
  // ==========================================
  async buyAirtime({ serviceID, phone, amount }) {
    const requestId = this.generateRequestId();

    try {
      const response = await axios.post(
        `${this.baseURL}/pay`,
        {
          request_id: requestId,
          serviceID,
          amount: Number(amount),
          phone
        },
        {
          headers: this.getHeaders(),
          timeout: 30000
        }
      );

      return {
        ...response.data,
        request_id: requestId
      };

    } catch (error) {
      console.error(
        'VTpass airtime error:',
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.response_description ||
        error.response?.data?.message ||
        'VTpass airtime request failed'
      );
    }
  }

  // ==========================================
  // BUY DATA
  // ==========================================
  async buyData({
    serviceID,
    phone,
    variation_code,
    amount
  }) {
    const requestId = this.generateRequestId();

    try {
      const payload = {
        request_id: requestId,
        serviceID,
        billersCode: phone,
        variation_code,
        amount: Number(amount),
        phone
      };

      console.log('\n========== VTPASS DATA REQUEST ==========');
      console.log({
        ...payload,
        // Don't expose sensitive API credentials
      });

      const response = await axios.post(
        `${this.baseURL}/pay`,
        payload,
        {
          headers: this.getHeaders(),
          timeout: 30000
        }
      );

      console.log('\n========== VTPASS DATA RESPONSE ==========');
      console.log(JSON.stringify(response.data, null, 2));

      return {
        ...response.data,
        request_id: requestId
      };

    } catch (error) {
      console.error(
        '\nVTpass data error:',
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.response_description ||
        error.response?.data?.message ||
        'VTpass data purchase failed'
      );
    }
  }

  // ==========================================
  // REQUERY TRANSACTION
  // ==========================================
  async requery(requestId) {
    try {
      const response = await axios.post(
        `${this.baseURL}/requery`,
        {
          request_id: requestId
        },
        {
          headers: this.getHeaders(),
          timeout: 30000
        }
      );

      return response.data;

    } catch (error) {
      console.error(
        'VTpass requery error:',
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.response_description ||
        error.response?.data?.message ||
        'VTpass transaction status check failed'
      );
    }
  }

  // ==========================================
  // GET DATA VARIATIONS
  // ==========================================
  async getDataVariations(serviceID) {
    try {
      const response = await axios.get(
        `${this.baseURL}/service-variations`,
        {
          params: {
            serviceID
          },
          headers: this.getHeaders(),
          timeout: 30000
        }
      );

      return response.data;

    } catch (error) {
      console.error(
        'VTpass data variations error:',
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.response_description ||
        error.response?.data?.message ||
        'Failed to retrieve data variations'
      );
    }
  }
}

module.exports = new VTpassService();
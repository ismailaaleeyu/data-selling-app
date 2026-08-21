// API Base URL
const API_BASE = '/api';

// Global state
let currentUser = null;
let token = localStorage.getItem('token');

if (token) {
  currentUser = JSON.parse(localStorage.getItem('user'));
  updateAuthUI();
  loadUserData();
}

// ==================== UI Functions ====================

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  
  if (pageId === 'history' && currentUser) {
    loadTransactionHistory();
  }
}

function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function selectService(service) {
  document.getElementById('airtimeSection').style.display = 'none';
  document.getElementById('dataSection').style.display = 'none';
  document.getElementById('utilitySection').style.display = 'none';
  
  if (service === 'airtime') {
    document.getElementById('airtimeSection').style.display = 'block';
    loadAirtimeProviders();
  } else if (service === 'data') {
    document.getElementById('dataSection').style.display = 'block';
    loadDataProviders();
  } else if (service === 'utility') {
    document.getElementById('utilitySection').style.display = 'block';
    loadUtilityTypes();
  }
}

function updateAuthUI() {
  if (currentUser) {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('userSection').style.display = 'flex';
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('balanceSection').style.display = 'block';
    updateWalletBalance();
  } else {
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('userSection').style.display = 'none';
    document.getElementById('balanceSection').style.display = 'none';
  }
}

function showMessage(elementId, message, type = 'info') {
  const messageDiv = document.getElementById(elementId);
  messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
  setTimeout(() => {
    messageDiv.innerHTML = '';
  }, 5000);
}

// ==================== Authentication ====================

async function register() {
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const phone = document.getElementById('registerPhone').value;
  const password = document.getElementById('registerPassword').value;
  
  if (!name || !email || !phone || !password) {
    showMessage('registerMessage', 'Please fill all fields', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('registerMessage', 'Registration successful! Please login', 'success');
      setTimeout(() => {
        closeModal('registerModal');
        showModal('loginModal');
      }, 2000);
    } else {
      showMessage('registerMessage', data.message || 'Registration failed', 'error');
    }
  } catch (error) {
    showMessage('registerMessage', 'Network error', 'error');
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!email || !password) {
    showMessage('loginMessage', 'Please fill all fields', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(currentUser));
      updateAuthUI();
      showMessage('loginMessage', 'Login successful!', 'success');
      setTimeout(() => {
        closeModal('loginModal');
        showPage('home');
      }, 1500);
    } else {
      showMessage('loginMessage', data.message || 'Login failed', 'error');
    }
  } catch (error) {
    showMessage('loginMessage', 'Network error', 'error');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  token = null;
  updateAuthUI();
  showPage('home');
}

function loadUserData() {
  updateWalletBalance();
}

// ==================== Wallet Functions ====================

async function updateWalletBalance() {
  if (!token) return;
  
  try {
    const response = await fetch(`${API_BASE}/wallet/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const balance = parseFloat(data.balance).toFixed(2);
      document.getElementById('walletBalance').textContent = `₦${balance.toLocaleString()}`;
      currentUser.wallet_balance = data.balance;
    }
  } catch (error) {
    console.error('Failed to fetch balance:', error);
  }
}

async function fundWallet() {
  if (!token) {
    showMessage('fundMessage', 'Please login first', 'error');
    return;
  }

  const amount = parseFloat(
    document.getElementById('fundAmount').value
  );

  if (!Number.isFinite(amount) || amount < 100) {
    showMessage(
      'fundMessage',
      'Minimum funding amount is ₦100',
      'error'
    );
    return;
  }

  try {
    showMessage(
      'fundMessage',
      'Initializing payment...',
      'info'
    );

    const response = await fetch(
      `${API_BASE}/payment/initialize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      showMessage(
        'fundMessage',
        data.message || 'Unable to initialize payment',
        'error'
      );
      return;
    }

    // Save reference in case we need it later
    localStorage.setItem(
      'pendingPaymentReference',
      data.reference
    );

    // Redirect customer to Paystack Checkout
    window.location.href = data.authorization_url;

  } catch (error) {
    console.error('Payment initialization error:', error);

    showMessage(
      'fundMessage',
      'Unable to connect to payment service',
      'error'
    );
  }
}
async function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get('payment');

  if (paymentStatus !== 'success') {
    return;
  }

  const reference = localStorage.getItem(
    'pendingPaymentReference'
  );

  if (!reference || !token) {
    return;
  }

  try {
    showMessage(
      'fundMessage',
      'Verifying your payment...',
      'info'
    );

    const response = await fetch(
      `${API_BASE}/payment/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (data.success) {
      await updateWalletBalance();

      showMessage(
        'fundMessage',
        `✓ Payment successful! ₦${Number(data.amount || 0).toLocaleString()} has been added to your wallet.`,
        'success'
      );

      localStorage.removeItem(
        'pendingPaymentReference'
      );
    } else {
      showMessage(
        'fundMessage',
        data.message || 'Payment verification failed',
        'error'
      );
    }

  } catch (error) {
    console.error(
      'Payment verification error:',
      error
    );

    showMessage(
      'fundMessage',
      'Unable to verify payment. Please check your transaction history.',
      'error'
    );
  }

  // Remove ?payment=success from the browser URL
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
}
// ==================== Airtime Functions ====================

async function loadAirtimeProviders() {
  try {
    const response = await fetch(`${API_BASE}/airtime/providers`);
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('airtimeProvider');
      select.innerHTML = '<option value="">-- Select Provider --</option>';
      data.providers.forEach(provider => {
        select.innerHTML += `<option value="${provider}">${provider}</option>`;
      });
    }
  } catch (error) {
    console.error('Failed to load providers:', error);
  }
}

async function loadAirtimePlans() {
  const provider = document.getElementById('airtimeProvider').value;
  
  if (!provider) {
    document.getElementById('airtimePlansList').innerHTML = '';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/airtime/plans?provider=${provider}`);
    const data = await response.json();
    
    if (data.success) {
      let html = '';
      data.plans.forEach(plan => {
        html += `
          <div class="plan-item">
            <div class="plan-info">
              <h4>${plan.provider}</h4>
              <p>${plan.description}</p>
            </div>
            <button class="btn btn-primary" onclick="buyAirtime(${plan.id}, ${plan.amount})">
              ₦${plan.amount}
            </button>
          </div>
        `;
      });
      document.getElementById('airtimePlansList').innerHTML = html;
    }
  } catch (error) {
    showMessage('airtimeMessage', 'Failed to load plans', 'error');
  }
}

async function buyAirtime(planId, amount) {
  if (!token) {
    showMessage('airtimeMessage', 'Please login first', 'error');
    return;
  }
  
  const phone = document.getElementById('airtimePhone').value;
  
  if (!phone) {
    showMessage('airtimeMessage', 'Please enter phone number', 'error');
    return;
  }
  
  if (currentUser.wallet_balance < amount) {
    showMessage('airtimeMessage', 'Insufficient wallet balance. Please fund your wallet', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/airtime/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ phone_number: phone, plan_id: planId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('airtimeMessage', `✓ Airtime purchase successful! Ref: ${data.reference}`, 'success');
      updateWalletBalance();
      document.getElementById('airtimePhone').value = '';
    } else {
      showMessage('airtimeMessage', data.message || 'Purchase failed', 'error');
    }
  } catch (error) {
    showMessage('airtimeMessage', 'Network error', 'error');
  }
}

// ==================== Data Functions ====================

async function loadDataProviders() {
  try {
    const response = await fetch(`${API_BASE}/data/providers`);
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('dataProvider');
      select.innerHTML = '<option value="">-- Select Provider --</option>';
      data.providers.forEach(provider => {
        select.innerHTML += `<option value="${provider}">${provider}</option>`;
      });
    }
  } catch (error) {
    console.error('Failed to load providers:', error);
  }
}

async function loadDataPlans() {
  const provider = document.getElementById('dataProvider').value;
  
  if (!provider) {
    document.getElementById('dataPlansList').innerHTML = '';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/data/plans?provider=${provider}`);
    const data = await response.json();
    
    if (data.success) {
      let html = '';
      data.plans.forEach(plan => {
        html += `
          <div class="plan-item">
            <div class="plan-info">
              <h4>${plan.name}</h4>
              <p>Validity: ${plan.validity_days} days</p>
            </div>
            <button class="btn btn-primary" onclick="buyData(${plan.id}, ${plan.price})">
              ₦${plan.price}
            </button>
          </div>
        `;
      });
      document.getElementById('dataPlansList').innerHTML = html;
    }
  } catch (error) {
    showMessage('dataMessage', 'Failed to load plans', 'error');
  }
}

async function buyData(planId, amount) {
  if (!token) {
    showMessage('dataMessage', 'Please login first', 'error');
    return;
  }
  
  const phone = document.getElementById('dataPhone').value;
  
  if (!phone) {
    showMessage('dataMessage', 'Please enter phone number', 'error');
    return;
  }
  
  if (currentUser.wallet_balance < amount) {
    showMessage('dataMessage', 'Insufficient wallet balance. Please fund your wallet', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/data/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ phone_number: phone, plan_id: planId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('dataMessage', `✓ Data purchase successful! Ref: ${data.reference}`, 'success');
      updateWalletBalance();
      document.getElementById('dataPhone').value = '';
    } else {
      showMessage('dataMessage', data.message || 'Purchase failed', 'error');
    }
  } catch (error) {
    showMessage('dataMessage', 'Network error', 'error');
  }
}

// ==================== Utility Functions ====================

async function loadUtilityTypes() {
  try {
    const response = await fetch(`${API_BASE}/utility/types`);
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('utilityType');
      select.innerHTML = '<option value="">-- Select Utility --</option>';
      data.types.forEach(type => {
        select.innerHTML += `<option value="${type.id}">${type.name}</option>`;
      });
    }
  } catch (error) {
    console.error('Failed to load utility types:', error);
  }
}

async function payUtilityBill() {
  if (!token) {
    showMessage('utilityMessage', 'Please login first', 'error');
    return;
  }
  
  const utilityTypeId = document.getElementById('utilityType').value;
  const account = document.getElementById('utilityAccount').value;
  const amount = parseFloat(document.getElementById('utilityAmount').value);
  
  if (!utilityTypeId || !account || !amount) {
    showMessage('utilityMessage', 'Please fill all fields', 'error');
    return;
  }
  
  if (currentUser.wallet_balance < amount) {
    showMessage('utilityMessage', 'Insufficient wallet balance. Please fund your wallet', 'error');
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/utility/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        utility_type_id: utilityTypeId,
        utility_account_number: account,
        amount
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('utilityMessage', `✓ Bill paid successfully! Ref: ${data.reference}`, 'success');
      updateWalletBalance();
      document.getElementById('utilityAccount').value = '';
      document.getElementById('utilityAmount').value = '';
    } else {
      showMessage('utilityMessage', data.message || 'Payment failed', 'error');
    }
  } catch (error) {
    showMessage('utilityMessage', 'Network error', 'error');
  }
}

// ==================== History Functions ====================

async function loadTransactionHistory() {
  if (!token) return;
  
  try {
    const response = await fetch(`${API_BASE}/wallet/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success && data.transactions.length > 0) {
      let html = '<table style="width: 100%; border-collapse: collapse;">';
      html += '<tr style="background: #f0f0f0;"><th style="padding: 10px; text-align: left;">Date</th><th style="padding: 10px; text-align: left;">Description</th><th style="padding: 10px; text-align: left;">Type</th><th style="padding: 10px; text-align: right;">Amount</th></tr>';
      
      data.transactions.forEach(transaction => {
        const date = new Date(transaction.created_at).toLocaleDateString();
        const type = transaction.type === 'credit' ? '✓ Credit' : '✗ Debit';
        const amount = parseFloat(transaction.amount).toFixed(2);
        html += `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px;">${date}</td>
            <td style="padding: 10px;">${transaction.description}</td>
            <td style="padding: 10px;">${type}</td>
            <td style="padding: 10px; text-align: right;">₦${amount}</td>
          </tr>
        `;
      });
      
      html += '</table>';
      document.getElementById('historyContent').innerHTML = html;
    } else {
      document.getElementById('historyContent').innerHTML = '<p>No transactions yet</p>';
    }
  } catch (error) {
    document.getElementById('historyContent').innerHTML = '<p>Failed to load history</p>';
  }
}

// Modal close on background click
window.addEventListener('click', (event) => {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
});

async function handlePaymentCallback() {
  const params = new URLSearchParams(window.location.search);

  // Extract reference from Paystack's URL params OR fallback to localStorage
  const reference =
    params.get('reference') ||
    params.get('trxref') ||
    localStorage.getItem('pendingPaymentReference');

  if (!reference) return;

  if (!token) {
    if (typeof showPage === 'function') showPage('home');
    alert('Payment returned. Please log in to finish updating your wallet balance.');
    return;
  }

  try {
    if (typeof showPage === 'function') showPage('home');
    if (typeof showMessage === 'function' && document.getElementById('fundMessage')) {
      showMessage('fundMessage', 'Verifying your payment...', 'info');
    }

    const response = await fetch(`${API_BASE}/payment/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      if (typeof updateWalletBalance === 'function') {
        await updateWalletBalance();
      }

      const successMsg = `Payment successful!\n\n₦${Number(data.amount || 0).toLocaleString()} has been added to your wallet.`;

      if (typeof showMessage === 'function' && document.getElementById('fundMessage')) {
        showMessage('fundMessage', `✓ ${successMsg}`, 'success');
      } else {
        alert(successMsg);
      }

      localStorage.removeItem('pendingPaymentReference');
    } else {
      const errorMsg = data.message || 'Payment verification failed.';
      if (typeof showMessage === 'function' && document.getElementById('fundMessage')) {
        showMessage('fundMessage', errorMsg, 'error');
      } else {
        alert(errorMsg);
      }
    }
  } catch (error) {
    console.error('Payment verification error:', error);
  } finally {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
// Initial setup
updateAuthUI();
handlePaymentCallback();

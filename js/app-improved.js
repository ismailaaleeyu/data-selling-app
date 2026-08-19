// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Global state
let currentUser = null;
let token = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('✓ DOM Loaded - Initializing app...');
  
  // Get token from localStorage
  token = localStorage.getItem('token');
  
  // If user is logged in, restore session
  if (token) {
    try {
      const userJSON = localStorage.getItem('user');
      if (userJSON) {
        currentUser = JSON.parse(userJSON);
        console.log('✓ User restored from localStorage:', currentUser.email);
        updateAuthUI();
        loadUserData();
      }
    } catch (error) {
      console.error('Error restoring user session:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  
  // Ensure auth UI is updated
  updateAuthUI();
  
  console.log('✓ App initialized successfully');
});

// Close modals when clicking outside
document.addEventListener('click', function(event) {
  if (event.target.classList && event.target.classList.contains('modal')) {
    event.target.classList.remove('active');
  }
});

// ==================== UI Functions ====================

function showPage(pageId) {
  try {
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.add('active');
      
      if (pageId === 'history' && currentUser) {
        loadTransactionHistory();
      }
    }
  } catch (error) {
    console.error('Error showing page:', error);
  }
}

function showModal(modalId) {
  try {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      // Clear form when opening modal
      if (modalId === 'loginModal') {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
      } else if (modalId === 'registerModal') {
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPhone').value = '';
        document.getElementById('registerPassword').value = '';
      }
    }
  } catch (error) {
    console.error('Error showing modal:', error);
  }
}

function closeModal(modalId) {
  try {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  } catch (error) {
    console.error('Error closing modal:', error);
  }
}

function selectService(service) {
  try {
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
  } catch (error) {
    console.error('Error selecting service:', error);
  }
}

function updateAuthUI() {
  try {
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    const balanceSection = document.getElementById('balanceSection');
    
    if (currentUser && token) {
      if (authSection) authSection.style.display = 'none';
      if (userSection) userSection.style.display = 'flex';
      if (balanceSection) balanceSection.style.display = 'block';
      
      const userEmailEl = document.getElementById('userEmail');
      if (userEmailEl) {
        userEmailEl.textContent = currentUser.email;
      }
      
      updateWalletBalance();
    } else {
      if (authSection) authSection.style.display = 'flex';
      if (userSection) userSection.style.display = 'none';
      if (balanceSection) balanceSection.style.display = 'none';
    }
  } catch (error) {
    console.error('Error updating auth UI:', error);
  }
}

function showMessage(elementId, message, type = 'info') {
  try {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
      messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`;
      setTimeout(() => {
        messageDiv.innerHTML = '';
      }, 5000);
    }
  } catch (error) {
    console.error('Error showing message:', error);
  }
}

// ==================== Authentication ====================

async function register() {
  try {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const phone = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (!name || !email || !phone || !password) {
      showMessage('registerMessage', 'Please fill all fields', 'error');
      return;
    }
    
    if (password.length < 6) {
      showMessage('registerMessage', 'Password must be at least 6 characters', 'error');
      return;
    }
    
    console.log('Registering user:', email);
    
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
    console.error('Registration error:', error);
    showMessage('registerMessage', 'Network error. Please try again.', 'error');
  }
}

async function login() {
  try {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
      showMessage('loginMessage', 'Please fill all fields', 'error');
      return;
    }
    
    console.log('Logging in user:', email);
    
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
      console.log('✓ Login successful for:', email);
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
    console.error('Login error:', error);
    showMessage('loginMessage', 'Network error. Please try again.', 'error');
  }
}

function logout() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    token = null;
    console.log('✓ User logged out');
    updateAuthUI();
    showPage('home');
  } catch (error) {
    console.error('Logout error:', error);
  }
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
      const walletBalanceEl = document.getElementById('walletBalance');
      if (walletBalanceEl) {
        walletBalanceEl.textContent = `₦${parseFloat(balance).toLocaleString()}`;
      }
      if (currentUser) {
        currentUser.wallet_balance = data.balance;
      }
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
  
  try {
    const amountInput = document.getElementById('fundAmount');
    if (!amountInput) {
      console.error('fundAmount input not found');
      return;
    }
    
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
      showMessage('fundMessage', 'Please enter a valid amount', 'error');
      return;
    }
    
    const response = await fetch(`${API_BASE}/wallet/fund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage('fundMessage', 'Wallet funded successfully!', 'success');
      updateWalletBalance();
      setTimeout(() => {
        closeModal('fundWalletModal');
        amountInput.value = '';
      }, 1500);
    } else {
      showMessage('fundMessage', data.message || 'Failed to fund wallet', 'error');
    }
  } catch (error) {
    console.error('Fund wallet error:', error);
    showMessage('fundMessage', 'Network error', 'error');
  }
}

// ==================== Airtime Functions ====================

async function loadAirtimeProviders() {
  try {
    const response = await fetch(`${API_BASE}/airtime/providers`);
    const data = await response.json();
    
    if (data.success) {
      const select = document.getElementById('airtimeProvider');
      if (select) {
        select.innerHTML = '<option value="">-- Select Provider --</option>';
        data.providers.forEach(provider => {
          select.innerHTML += `<option value="${provider}">${provider}</option>`;
        });
      }
    }
  } catch (error) {
    console.error('Failed to load airtime providers:', error);
  }
}

async function loadAirtimePlans() {
  try {
    const provider = document.getElementById('airtimeProvider').value;
    
    if (!provider) {
      document.getElementById('airtimePlansList').innerHTML = '';
      return;
    }
    
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
    console.error('Failed to load airtime plans:', error);
    showMessage('airtimeMessage', 'Failed to load plans', 'error');
  }
}

async function buyAirtime(planId, amount) {
  if (!token) {
    showMessage('airtimeMessage', 'Please login first', 'error');
    return;
  }
  
  try {
    const phone = document.getElementById('airtimePhone').value.trim();
    
    if (!phone) {
      showMessage('airtimeMessage', 'Please enter phone number', 'error');
      return;
    }
    
    if (currentUser && currentUser.wallet_balance < amount) {
      showMessage('airtimeMessage', 'Insufficient wallet balance. Please fund your wallet', 'error');
      return;
    }
    
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
    console.error('Airtime purchase error:', error);
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
      if (select) {
        select.innerHTML = '<option value="">-- Select Provider --</option>';
        data.providers.forEach(provider => {
          select.innerHTML += `<option value="${provider}">${provider}</option>`;
        });
      }
    }
  } catch (error) {
    console.error('Failed to load data providers:', error);
  }
}

async function loadDataPlans() {
  try {
    const provider = document.getElementById('dataProvider').value;
    
    if (!provider) {
      document.getElementById('dataPlansList').innerHTML = '';
      return;
    }
    
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
    console.error('Failed to load data plans:', error);
    showMessage('dataMessage', 'Failed to load plans', 'error');
  }
}

async function buyData(planId, amount) {
  if (!token) {
    showMessage('dataMessage', 'Please login first', 'error');
    return;
  }
  
  try {
    const phone = document.getElementById('dataPhone').value.trim();
    
    if (!phone) {
      showMessage('dataMessage', 'Please enter phone number', 'error');
      return;
    }
    
    if (currentUser && currentUser.wallet_balance < amount) {
      showMessage('dataMessage', 'Insufficient wallet balance. Please fund your wallet', 'error');
      return;
    }
    
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
    console.error('Data purchase error:', error);
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
      if (select) {
        select.innerHTML = '<option value="">-- Select Utility Type --</option>';
        data.types.forEach(type => {
          select.innerHTML += `<option value="${type.id}">${type.name}</option>`;
        });
      }
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
  
  try {
    const typeId = parseInt(document.getElementById('utilityType').value);
    const accountNumber = document.getElementById('utilityAccount').value.trim();
    const amount = parseFloat(document.getElementById('utilityAmount').value);
    
    if (!typeId || !accountNumber || !amount) {
      showMessage('utilityMessage', 'Please fill all fields', 'error');
      return;
    }
    
    if (amount <= 0) {
      showMessage('utilityMessage', 'Please enter a valid amount', 'error');
      return;
    }
    
    if (currentUser && currentUser.wallet_balance < amount) {
      showMessage('utilityMessage', 'Insufficient wallet balance. Please fund your wallet', 'error');
      return;
    }
    
    const response = await fetch(`${API_BASE}/utility/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        utility_type_id: typeId, 
        account_number: accountNumber,
        amount: amount 
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
    console.error('Utility payment error:', error);
    showMessage('utilityMessage', 'Network error', 'error');
  }
}

// ==================== Transaction History ====================

async function loadTransactionHistory() {
  if (!token) return;
  
  try {
    const response = await fetch(`${API_BASE}/wallet/transactions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    
    if (data.success && data.transactions.length > 0) {
      let html = '<table class="transactions-table"><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Type</th><th>Status</th></tr></thead><tbody>';
      
      data.transactions.forEach(txn => {
        const date = new Date(txn.created_at).toLocaleDateString();
        const amount = parseFloat(txn.amount).toFixed(2);
        const type = txn.type === 'credit' ? '+' : '-';
        
        html += `<tr>
          <td>${date}</td>
          <td>${txn.description}</td>
          <td>${type}₦${amount}</td>
          <td>${txn.type}</td>
          <td><span class="status-${txn.status}">${txn.status}</span></td>
        </tr>`;
      });
      
      html += '</tbody></table>';
      document.getElementById('historyContent').innerHTML = html;
    } else {
      document.getElementById('historyContent').innerHTML = '<p>No transactions yet</p>';
    }
  } catch (error) {
    console.error('Failed to load transaction history:', error);
    document.getElementById('historyContent').innerHTML = '<p>Failed to load history</p>';
  }
}

console.log('✓ App script loaded');

// ============================================================
// ADMIN DASHBOARD STATE & LOCAL CACHE
// ============================================================
const API_BASE = '/api/admin';

let adminToken = localStorage.getItem('adminToken');
let adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');

let rawUsers = [];
let rawWalletTransactions = [];
let rawDataTransactions = [];
let rawAirtimeTransactions = [];
let rawUtilityTransactions = [];

// ============================================================
// DYNAMIC TOAST NOTIFICATION STYLES
// ============================================================
const style = document.createElement('style');
style.innerHTML = `
    #toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .toast-message {
        min-width: 280px;
        padding: 12px 20px;
        border-radius: 6px;
        color: #fff;
        font-family: sans-serif;
        font-size: 0.875rem;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: slideIn 0.3s ease-out forwards;
    }
    .toast-success { background-color: #10b981; }
    .toast-error { background-color: #ef4444; }
    .toast-info { background-color: #3b82f6; }

    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// ============================================================
// INITIALIZATION & EVENT BINDING (CSP SAFE)
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!adminToken) {
        window.location.href = '../admin/';
        return;
    }

    displayAdminInfo();

    // Attach Sidebar Navigation Clicks
    document.querySelectorAll('.admin-nav-link').forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section');
            if (sectionId) showSection(sectionId);
        });
    });

    // Attach Logout Click
    document.getElementById('logoutBtn')?.addEventListener('click', logoutAdmin);

    // Attach Refresh Button Clicks
    document.getElementById('refreshDashboardBtn')?.addEventListener('click', loadDashboard);
    document.getElementById('refreshUsersBtn')?.addEventListener('click', loadUsers);
    document.getElementById('refreshWalletBtn')?.addEventListener('click', loadWalletTransactions);
    document.getElementById('refreshDataBtn')?.addEventListener('click', loadDataTransactions);
    document.getElementById('refreshAirtimeBtn')?.addEventListener('click', loadAirtimeTransactions);
    document.getElementById('refreshUtilityBtn')?.addEventListener('click', loadUtilityTransactions);

    // Attach Search and Filter Event Listeners
    document.getElementById('userSearch')?.addEventListener('input', filterUsers);
    
    document.getElementById('walletSearch')?.addEventListener('input', filterWalletTransactions);
    document.getElementById('walletStatusFilter')?.addEventListener('change', filterWalletTransactions);

    document.getElementById('dataSearch')?.addEventListener('input', filterDataTransactions);
    document.getElementById('dataStatusFilter')?.addEventListener('change', filterDataTransactions);

    document.getElementById('airtimeSearch')?.addEventListener('input', filterAirtimeTransactions);
    document.getElementById('airtimeStatusFilter')?.addEventListener('change', filterAirtimeTransactions);

    document.getElementById('utilitySearch')?.addEventListener('input', filterUtilityTransactions);
    document.getElementById('utilityStatusFilter')?.addEventListener('change', filterUtilityTransactions);

    // Table Delegated Click Event Handlers (for View Details and Refund buttons)
    setupTableEventDelegation();

    // Initial Data Fetch
    loadDashboard();
    loadUsers();
    loadWalletTransactions();
    loadDataTransactions();
    loadAirtimeTransactions();
    loadUtilityTransactions();
});

// ============================================================
// TABLE EVENT DELEGATION
// ============================================================
function setupTableEventDelegation() {
    // Users table actions
    document.getElementById('usersTableBody')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-user-btn');
        if (btn) {
            const userId = btn.getAttribute('data-id');
            if (userId) viewUserDetails(userId);
        }
    });

    // Delegated refund handler function
    const handleRefundClick = (e) => {
        const btn = e.target.closest('.refund-btn');
        if (btn) {
            const id = btn.getAttribute('data-id');
            const type = btn.getAttribute('data-type');
            if (id && type) refundTransaction(id, type);
        }
    };

    document.getElementById('dataTransactionsTableBody')?.addEventListener('click', handleRefundClick);
    document.getElementById('airtimeTransactionsTableBody')?.addEventListener('click', handleRefundClick);
    document.getElementById('utilityTransactionsTableBody')?.addEventListener('click', handleRefundClick);
}

// ============================================================
// API REQUEST HELPER
// ============================================================
async function adminFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
                ...(options.headers || {})
            }
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
            logoutAdmin();
            throw new Error('Admin session expired');
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (err) {
        throw err;
    }
}

// ============================================================
// DISPLAY ADMIN INFORMATION
// ============================================================
function displayAdminInfo() {
    const nameElement = document.getElementById('adminName');
    const emailElement = document.getElementById('adminEmail');

    if (adminUser) {
        if (nameElement) nameElement.textContent = adminUser.name || 'Administrator';
        if (emailElement) emailElement.textContent = adminUser.email || '';
    }
}

// ============================================================
// DASHBOARD STATS
// ============================================================
async function loadDashboard() {
    showLoading();
    try {
        const data = await adminFetch('/dashboard');
        const stats = data.statistics || {};

        updateElement('totalUsers', stats.total_users || 0);
        updateElement('totalWalletBalance', formatCurrency(stats.total_wallet_balance));
        updateElement('totalWalletTransactions', stats.total_wallet_transactions || 0);
        updateElement('totalDataTransactions', stats.total_data_transactions || 0);
        updateElement('totalAirtimeTransactions', stats.total_airtime_transactions || 0);
        updateElement('totalUtilityTransactions', stats.total_utility_transactions || 0);
        updateElement('totalDataSales', formatCurrency(stats.total_data_sales));
        updateElement('totalAirtimeSales', formatCurrency(stats.total_airtime_sales));
        updateElement('totalUtilitySales', formatCurrency(stats.total_utility_sales));

        hideLoading();
    } catch (error) {
        console.error('Dashboard error:', error);
        showToast('Failed to load dashboard statistics', 'error');
        hideLoading();
    }
}

// ============================================================
// DATA LOADERS WITH STATE CACHING
// ============================================================
async function loadUsers() {
    showLoading();
    try {
        const data = await adminFetch('/users');
        rawUsers = data.users || [];
        filterUsers();
        hideLoading();
    } catch (error) {
        console.error('Users error:', error);
        showToast('Failed to load users', 'error');
        hideLoading();
    }
}

async function loadWalletTransactions() {
    showLoading();
    try {
        const data = await adminFetch('/wallet-transactions');
        rawWalletTransactions = data.transactions || [];
        filterWalletTransactions();
        hideLoading();
    } catch (error) {
        console.error('Wallet transactions error:', error);
        showToast('Failed to load wallet transactions', 'error');
        hideLoading();
    }
}

async function loadDataTransactions() {
    showLoading();
    try {
        const data = await adminFetch('/data-transactions');
        rawDataTransactions = data.transactions || [];
        filterDataTransactions();
        hideLoading();
    } catch (error) {
        console.error('Data transactions error:', error);
        showToast('Failed to load data transactions', 'error');
        hideLoading();
    }
}

async function loadAirtimeTransactions() {
    showLoading();
    try {
        const data = await adminFetch('/airtime-transactions');
        rawAirtimeTransactions = data.transactions || [];
        filterAirtimeTransactions();
        hideLoading();
    } catch (error) {
        console.error('Airtime transactions error:', error);
        showToast('Failed to load airtime transactions', 'error');
        hideLoading();
    }
}

async function loadUtilityTransactions() {
    showLoading();
    try {
        const data = await adminFetch('/utility-transactions');
        rawUtilityTransactions = data.transactions || [];
        filterUtilityTransactions();
        hideLoading();
    } catch (error) {
        console.error('Utility transactions error:', error);
        showToast('Failed to load utility transactions', 'error');
        hideLoading();
    }
}

// ============================================================
// FILTERING FUNCTIONS
// ============================================================
function filterUsers() {
    const query = (document.getElementById('userSearch')?.value || '').toLowerCase().trim();
    const filtered = rawUsers.filter(u => 
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.phone && u.phone.includes(query))
    );
    renderUsers(filtered);
}

function filterWalletTransactions() {
    const query = (document.getElementById('walletSearch')?.value || '').toLowerCase().trim();
    const statusFilter = (document.getElementById('walletStatusFilter')?.value || '').toLowerCase().trim();

    const filtered = rawWalletTransactions.filter(t => {
        const userName = (t.user_name || t.user || '').toLowerCase();
        const userEmail = (t.user_email || t.email || '').toLowerCase();
        const reference = (t.reference || '').toLowerCase();
        const status = (t.status || '').toLowerCase().trim();

        const matchesQuery = userName.includes(query) || userEmail.includes(query) || reference.includes(query);
        const matchesStatus = !statusFilter || status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    renderWalletTransactions(filtered);
}

function filterDataTransactions() {
    const query = (document.getElementById('dataSearch')?.value || '').toLowerCase().trim();
    const statusFilter = (document.getElementById('dataStatusFilter')?.value || '').toLowerCase().trim();

    const filtered = rawDataTransactions.filter(t => {
        const userName = (t.user_name || t.user || '').toLowerCase();
        const phone = (t.phone_number || t.phone || '').toLowerCase();
        const reference = (t.reference || '').toLowerCase();
        const status = (t.status || '').toLowerCase().trim();

        const matchesQuery = userName.includes(query) || phone.includes(query) || reference.includes(query);
        const matchesStatus = !statusFilter || status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    renderDataTransactions(filtered);
}

function filterAirtimeTransactions() {
    const query = (document.getElementById('airtimeSearch')?.value || '').toLowerCase().trim();
    const statusFilter = (document.getElementById('airtimeStatusFilter')?.value || '').toLowerCase().trim();

    const filtered = rawAirtimeTransactions.filter(t => {
        const userName = (t.user_name || t.user || '').toLowerCase();
        const phone = (t.phone_number || t.phone || '').toLowerCase();
        const reference = (t.reference || '').toLowerCase();
        const status = (t.status || '').toLowerCase().trim();

        const matchesQuery = userName.includes(query) || phone.includes(query) || reference.includes(query);
        const matchesStatus = !statusFilter || status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    renderAirtimeTransactions(filtered);
}

function filterUtilityTransactions() {
    const query = (document.getElementById('utilitySearch')?.value || '').toLowerCase().trim();
    const statusFilter = (document.getElementById('utilityStatusFilter')?.value || '').toLowerCase().trim();

    const filtered = rawUtilityTransactions.filter(t => {
        const userName = (t.user_name || t.user || '').toLowerCase();
        const email = (t.user_email || t.email || '').toLowerCase();
        const reference = (t.reference || '').toLowerCase();
        const status = (t.status || '').toLowerCase().trim();

        const matchesQuery = userName.includes(query) || email.includes(query) || reference.includes(query);
        const matchesStatus = !statusFilter || status === statusFilter;

        return matchesQuery && matchesStatus;
    });

    renderUtilityTransactions(filtered);
}

// ============================================================
// TABLE RENDERERS
// ============================================================
function renderUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    if (!users || users.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7">No matching users found</td></tr>`;
        return;
    }

    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHtml(user.id)}</td>
            <td>${escapeHtml(user.name || 'N/A')}</td>
            <td>${escapeHtml(user.email || 'N/A')}</td>
            <td>${escapeHtml(user.phone || 'N/A')}</td>
            <td>${formatCurrency(user.wallet_balance || user.balance)}</td>
            <td>${formatDate(user.created_at || user.createdAt)}</td>
            <td>
                <button class="view-user-btn refresh-btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" data-id="${user.id}">View</button>
            </td>
        </tr>
    `).join('');
}

function renderWalletTransactions(transactions) {
    const tableBody = document.getElementById('walletTransactionsTableBody');
    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8">No matching wallet transactions found</td></tr>`;
        return;
    }

    tableBody.innerHTML = transactions.map(t => `
        <tr>
            <td>${escapeHtml(t.id)}</td>
            <td>${escapeHtml(t.user_name || t.user || 'Unknown')}</td>
            <td>${escapeHtml(t.user_email || t.email || '-')}</td>
            <td>${escapeHtml(t.type || 'Deposit')}</td>
            <td>${formatCurrency(t.amount)}</td>
            <td><strong style="color: ${getStatusColor(t.status)};">${escapeHtml(t.status || '-')}</strong></td>
            <td>${escapeHtml(t.reference || '-')}</td>
            <td>${formatDate(t.created_at || t.date)}</td>
        </tr>
    `).join('');
}

function renderDataTransactions(transactions) {
    const tableBody = document.getElementById('dataTransactionsTableBody');
    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9">No matching data transactions found</td></tr>`;
        return;
    }

    tableBody.innerHTML = transactions.map(t => {
        const status = String(t.status || '').toLowerCase();
        const isEligibleForRefund = status === 'failed' || status === 'pending';

        return `
        <tr>
            <td>${escapeHtml(t.id)}</td>
            <td>${escapeHtml(t.user_name || t.user || 'Unknown')}</td>
            <td>${escapeHtml(t.phone_number || t.phone || '-')}</td>
            <td>${escapeHtml(t.plan_id || t.plan || '-')}</td>
            <td>${formatCurrency(t.amount)}</td>
            <td><strong style="color: ${getStatusColor(t.status)};">${escapeHtml(t.status || '-')}</strong></td>
            <td>${escapeHtml(t.reference || '-')}</td>
            <td>${formatDate(t.created_at || t.date)}</td>
            <td>
                ${isEligibleForRefund ? `
                    <button class="refund-btn refresh-btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;" data-id="${t.id}" data-type="data">
                        Refund
                    </button>
                ` : `<span style="font-size: 0.75rem; color: #9ca3af;">${status === 'completed' || status === 'success' ? 'No Action' : 'Refunded'}</span>`}
            </td>
        </tr>
    `}).join('');
}

function renderAirtimeTransactions(transactions) {
    const tableBody = document.getElementById('airtimeTransactionsTableBody');
    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8">No matching airtime transactions found</td></tr>`;
        return;
    }

    tableBody.innerHTML = transactions.map(t => {
        const status = String(t.status || '').toLowerCase();
        const isEligibleForRefund = status === 'failed' || status === 'pending';

        return `
        <tr>
            <td>${escapeHtml(t.id)}</td>
            <td>${escapeHtml(t.user_name || t.user || 'Unknown')}</td>
            <td>${escapeHtml(t.phone_number || t.phone || '-')}</td>
            <td>${formatCurrency(t.amount)}</td>
            <td><strong style="color: ${getStatusColor(t.status)};">${escapeHtml(t.status || '-')}</strong></td>
            <td>${escapeHtml(t.reference || '-')}</td>
            <td>${formatDate(t.created_at || t.date)}</td>
            <td>
                ${isEligibleForRefund ? `
                    <button class="refund-btn refresh-btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;" data-id="${t.id}" data-type="airtime">
                        Refund
                    </button>
                ` : `<span style="font-size: 0.75rem; color: #9ca3af;">${status === 'completed' || status === 'success' ? 'No Action' : 'Refunded'}</span>`}
            </td>
        </tr>
    `}).join('');
}

function renderUtilityTransactions(transactions) {
    const tableBody = document.getElementById('utilityTransactionsTableBody');
    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9">No matching utility transactions found</td></tr>`;
        return;
    }

    tableBody.innerHTML = transactions.map(t => {
        const status = String(t.status || '').toLowerCase();
        const isEligibleForRefund = status === 'failed' || status === 'pending';

        return `
        <tr>
            <td>${escapeHtml(t.id)}</td>
            <td>${escapeHtml(t.user_name || t.user || 'Unknown')}</td>
            <td>${escapeHtml(t.user_email || t.email || '-')}</td>
            <td>${escapeHtml(t.utility_type || t.utilityType || '-')}</td>
            <td>${formatCurrency(t.amount)}</td>
            <td><strong style="color: ${getStatusColor(t.status)};">${escapeHtml(t.status || '-')}</strong></td>
            <td>${escapeHtml(t.reference || '-')}</td>
            <td>${formatDate(t.created_at || t.date)}</td>
            <td>
                ${isEligibleForRefund ? `
                    <button class="refund-btn refresh-btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;" data-id="${t.id}" data-type="utility">
                        Refund
                    </button>
                ` : `<span style="font-size: 0.75rem; color: #9ca3af;">${status === 'completed' || status === 'success' ? 'No Action' : 'Refunded'}</span>`}
            </td>
        </tr>
    `}).join('');
}

// ============================================================
// REFUND TRANSACTION ACTION HANDLER
// ============================================================
async function refundTransaction(transactionId, type) {
    if (!confirm(`Are you sure you want to refund Transaction ID #${transactionId}?`)) {
        return;
    }

    showLoading();
    try {
        const response = await adminFetch('/refund-transaction', {
            method: 'POST',
            body: JSON.stringify({ transactionId, type })
        });

        showToast(response.message || 'Transaction refunded successfully', 'success');
        
        // Refresh target table and user wallet cache
        if (type === 'data') await loadDataTransactions();
        if (type === 'airtime') await loadAirtimeTransactions();
        if (type === 'utility') await loadUtilityTransactions();
        await loadUsers();
    } catch (error) {
        console.error('Refund Error:', error);
        showToast(error.message || 'Failed to refund transaction', 'error');
    } finally {
        hideLoading();
    }
}

// ============================================================
// TOAST NOTIFICATION HANDLER
// ============================================================
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ============================================================
// PAGE NAVIGATION & SECTION SWITCHING
// ============================================================
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));

    const activeSection = document.getElementById(sectionId);
    if (activeSection) activeSection.classList.add('active');

    const activeLink = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = sectionId.replace('-', ' ').toUpperCase();

    switch (sectionId) {
        case 'dashboard': loadDashboard(); break;
        case 'users': filterUsers(); break;
        case 'wallet-transactions': filterWalletTransactions(); break;
        case 'data-transactions': filterDataTransactions(); break;
        case 'airtime-transactions': filterAirtimeTransactions(); break;
        case 'utility-transactions': filterUtilityTransactions(); break;
    }
}

// ============================================================
// USER DETAILS MODAL
// ============================================================
function viewUserDetails(userId) {
    const user = rawUsers.find(u => String(u.id) === String(userId));
    if (!user) {
        showToast('User details not found', 'error');
        return;
    }

    const userWallet = rawWalletTransactions.filter(t => String(t.user_id || t.userId) === String(userId)).length;
    const userData = rawDataTransactions.filter(t => String(t.user_id || t.userId) === String(userId)).length;
    const userAirtime = rawAirtimeTransactions.filter(t => String(t.user_id || t.userId) === String(userId)).length;

    const existingModal = document.getElementById('userModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'userModal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.6); display: flex; align-items: center;
        justify-content: center; z-index: 9999;
    `;

    modal.innerHTML = `
        <div style="background: #ffffff; width: 90%; max-width: 500px; padding: 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: sans-serif; color: #333;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 12px; margin-bottom: 16px;">
                <h3 style="margin: 0; font-size: 1.2rem; color: #1e293b;">User Profile: ID #${escapeHtml(user.id)}</h3>
                <button id="closeModalCross" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
            </div>
            
            <div style="margin-bottom: 16px; line-height: 1.8;">
                <p style="margin: 4px 0;"><strong>Full Name:</strong> ${escapeHtml(user.name || 'N/A')}</p>
                <p style="margin: 4px 0;"><strong>Email:</strong> ${escapeHtml(user.email || 'N/A')}</p>
                <p style="margin: 4px 0;"><strong>Phone:</strong> ${escapeHtml(user.phone || 'N/A')}</p>
                <p style="margin: 4px 0;"><strong>Wallet Balance:</strong> ${formatCurrency(user.wallet_balance || user.balance)}</p>
                <p style="margin: 4px 0;"><strong>Account Created:</strong> ${formatDate(user.created_at || user.createdAt)}</p>
            </div>

            <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #475569;">Activity Summary</h4>
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #334155;">
                    <span>Wallet Top-ups: <strong>${userWallet}</strong></span>
                    <span>Data Orders: <strong>${userData}</strong></span>
                    <span>Airtime Purchases: <strong>${userAirtime}</strong></span>
                </div>
            </div>

            <div style="text-align: right;">
                <button id="closeModalBtn" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeModalCross')?.addEventListener('click', closeUserModal);
    document.getElementById('closeModalBtn')?.addEventListener('click', closeUserModal);
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (modal) modal.remove();
}

function logoutAdmin() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '../admin/';
}

// ============================================================
// HELPER FUNCTIONS & FORMATTERS
// ============================================================
function getStatusColor(status) {
    const s = String(status).toLowerCase();
    if (s === 'completed' || s === 'success') return '#10b981';
    if (s === 'pending') return '#f59e0b';
    if (s === 'failed') return '#ef4444';
    if (s === 'refunded') return '#8b5cf6';
    return '#6b7280';
}

function formatCurrency(amount) {
    const number = Number(amount || 0);
    return '₦' + number.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(date) {
    if (!date) return '-';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString('en-NG', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function showLoading() {
    const loader = document.getElementById('adminLoading');
    if (loader) loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.getElementById('adminLoading');
    if (loader) loader.style.display = 'none';
}
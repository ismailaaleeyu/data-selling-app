// ============================================================
// ADMIN DASHBOARD JAVASCRIPT
// ============================================================

const API_BASE = '/api/admin';

let adminToken = localStorage.getItem('adminToken');
let adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // If there is no admin token, return to login
    if (!adminToken) {
        window.location.href = '/admin/';
        return;
    }

    // Display admin information
    displayAdminInfo();

    // Load dashboard by default
    loadDashboard();

});


// ============================================================
// API REQUEST HELPER
// ============================================================

async function adminFetch(endpoint, options = {}) {

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    // Token expired / unauthorized
    if (response.status === 401 || response.status === 403) {

        logoutAdmin();

        throw new Error('Admin session expired');

    }

    if (!response.ok || data.success === false) {

        throw new Error(
            data.message || 'Request failed'
        );

    }

    return data;
}


// ============================================================
// DISPLAY ADMIN INFORMATION
// ============================================================

function displayAdminInfo() {

    const nameElement =
        document.getElementById('adminName');

    const emailElement =
        document.getElementById('adminEmail');

    if (adminUser) {

        if (nameElement) {
            nameElement.textContent =
                adminUser.name || 'Administrator';
        }

        if (emailElement) {
            emailElement.textContent =
                adminUser.email || '';
        }

    }

}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    showLoading();

    try {

        const data =
            await adminFetch('/dashboard');

        const stats =
            data.statistics;

        updateElement(
            'totalUsers',
            stats.total_users
        );

        updateElement(
            'totalWalletBalance',
            formatCurrency(stats.total_wallet_balance)
        );

        updateElement(
            'totalWalletTransactions',
            stats.total_wallet_transactions
        );

        updateElement(
            'totalDataTransactions',
            stats.total_data_transactions
        );

        updateElement(
            'totalAirtimeTransactions',
            stats.total_airtime_transactions
        );

        updateElement(
            'totalUtilityTransactions',
            stats.total_utility_transactions
        );

        updateElement(
            'totalDataSales',
            formatCurrency(stats.total_data_sales)
        );

        updateElement(
            'totalAirtimeSales',
            formatCurrency(stats.total_airtime_sales)
        );

        updateElement(
            'totalUtilitySales',
            formatCurrency(stats.total_utility_sales)
        );

        hideLoading();

    } catch (error) {

        console.error(
            'Dashboard error:',
            error
        );

        showError(
            'Failed to load dashboard statistics'
        );

    }

}


// ============================================================
// USERS
// ============================================================

async function loadUsers() {

    showLoading();

    try {

        const data =
            await adminFetch('/users');

        renderUsers(data.users);

        hideLoading();

    } catch (error) {

        console.error(
            'Users error:',
            error
        );

        showError(
            'Failed to load users'
        );

    }

}


// ============================================================
// WALLET TRANSACTIONS
// ============================================================

async function loadWalletTransactions() {

    showLoading();

    try {

        const data =
            await adminFetch('/wallet-transactions');

        renderWalletTransactions(
            data.transactions
        );

        hideLoading();

    } catch (error) {

        console.error(
            'Wallet transactions error:',
            error
        );

        showError(
            'Failed to load wallet transactions'
        );

    }

}


// ============================================================
// DATA TRANSACTIONS
// ============================================================

async function loadDataTransactions() {

    showLoading();

    try {

        const data =
            await adminFetch('/data-transactions');

        renderDataTransactions(
            data.transactions
        );

        hideLoading();

    } catch (error) {

        console.error(
            'Data transactions error:',
            error
        );

        showError(
            'Failed to load data transactions'
        );

    }

}


// ============================================================
// AIRTIME TRANSACTIONS
// ============================================================

async function loadAirtimeTransactions() {

    showLoading();

    try {

        const data =
            await adminFetch('/airtime-transactions');

        renderAirtimeTransactions(
            data.transactions
        );

        hideLoading();

    } catch (error) {

        console.error(
            'Airtime transactions error:',
            error
        );

        showError(
            'Failed to load airtime transactions'
        );

    }

}


// ============================================================
// UTILITY TRANSACTIONS
// ============================================================

async function loadUtilityTransactions() {

    showLoading();

    try {

        const data =
            await adminFetch('/utility-transactions');

        renderUtilityTransactions(
            data.transactions
        );

        hideLoading();

    } catch (error) {

        console.error(
            'Utility transactions error:',
            error
        );

        showError(
            'Failed to load utility transactions'
        );

    }

}


// ============================================================
// RENDER USERS
// ============================================================

function renderUsers(users) {

    const tableBody =
        document.getElementById('usersTableBody');

    if (!tableBody) return;

    if (!users || users.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No users found
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        users.map(user => `

            <tr>

                <td>${escapeHtml(user.id)}</td>

                <td>${escapeHtml(user.name)}</td>

                <td>${escapeHtml(user.email)}</td>

                <td>${escapeHtml(user.phone)}</td>

                <td>
                    ${formatCurrency(user.wallet_balance)}
                </td>

                <td>
                    ${formatDate(user.created_at)}
                </td>

                <td>
                    ${formatDate(user.updated_at)}
                </td>

            </tr>

        `).join('');

}


// ============================================================
// RENDER WALLET TRANSACTIONS
// ============================================================

function renderWalletTransactions(transactions) {

    const tableBody =
        document.getElementById(
            'walletTransactionsTableBody'
        );

    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10">
                    No wallet transactions found
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        transactions.map(transaction => `

            <tr>

                <td>${escapeHtml(transaction.id)}</td>

                <td>
                    ${escapeHtml(
                        transaction.user_name || 'Unknown'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.user_email || ''
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.type || '-'
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        transaction.amount
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.status || '-'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.reference || '-'
                    )}
                </td>

                <td>
                    ${formatDate(
                        transaction.created_at
                    )}
                </td>

            </tr>

        `).join('');

}


// ============================================================
// RENDER DATA TRANSACTIONS
// ============================================================

function renderDataTransactions(transactions) {

    const tableBody =
        document.getElementById(
            'dataTransactionsTableBody'
        );

    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="15">
                    No data transactions found
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        transactions.map(transaction => `

            <tr>

                <td>${escapeHtml(transaction.id)}</td>

                <td>
                    ${escapeHtml(
                        transaction.user_name || 'Unknown'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.phone_number || '-'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.plan_id || '-'
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        transaction.amount
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.status || '-'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.reference || '-'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.vtpass_request_id || '-'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.vtpass_transaction_id || '-'
                    )}
                </td>

                <td>
                    ${formatDate(
                        transaction.created_at
                    )}
                </td>

            </tr>

        `).join('');

}


// ============================================================
// RENDER AIRTIME TRANSACTIONS
// ============================================================

function renderAirtimeTransactions(transactions) {

    const tableBody =
        document.getElementById(
            'airtimeTransactionsTableBody'
        );

    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10">
                    No airtime transactions found
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        transactions.map(transaction => `

            <tr>

                <td>${escapeHtml(transaction.id)}</td>

                <td>
                    ${escapeHtml(
                        transaction.user_name || 'Unknown'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.phone_number || '-'
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        transaction.amount
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.status || '-'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.reference || '-'
                    )}
                </td>

                <td>
                    ${formatDate(
                        transaction.created_at
                    )}
                </td>

            </tr>

        `).join('');

}


// ============================================================
// RENDER UTILITY TRANSACTIONS
// ============================================================

function renderUtilityTransactions(transactions) {

    const tableBody =
        document.getElementById(
            'utilityTransactionsTableBody'
        );

    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="12">
                    No utility transactions found
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        transactions.map(transaction => `

            <tr>

                <td>${escapeHtml(transaction.id)}</td>

                <td>
                    ${escapeHtml(
                        transaction.user_name || 'Unknown'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.user_email || ''
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.utility_type || '-'
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        transaction.amount
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.status || '-'
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        transaction.reference || '-'
                    )}
                </td>

                <td>
                    ${formatDate(
                        transaction.created_at
                    )}
                </td>

            </tr>

        `).join('');

}


// ============================================================
// PAGE NAVIGATION
// ============================================================

function showSection(sectionId) {

    document
        .querySelectorAll('.admin-section')
        .forEach(section => {

            section.classList.remove('active');

        });

    const section =
        document.getElementById(sectionId);

    if (section) {
        section.classList.add('active');
    }


    document
        .querySelectorAll('.admin-nav-link')
        .forEach(link => {

            link.classList.remove('active');

        });

    const activeLink =
        document.querySelector(
            `[data-section="${sectionId}"]`
        );

    if (activeLink) {
        activeLink.classList.add('active');
    }


    // Load appropriate data
    switch (sectionId) {

        case 'dashboard':
            loadDashboard();
            break;

        case 'users':
            loadUsers();
            break;

        case 'wallet-transactions':
            loadWalletTransactions();
            break;

        case 'data-transactions':
            loadDataTransactions();
            break;

        case 'airtime-transactions':
            loadAirtimeTransactions();
            break;

        case 'utility-transactions':
            loadUtilityTransactions();
            break;

    }

}


// ============================================================
// LOGOUT
// ============================================================

function logoutAdmin() {

    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    window.location.href = '/admin/';

}


// ============================================================
// FORMATTING
// ============================================================

function formatCurrency(amount) {

    const number =
        Number(amount || 0);

    return '₦' +
        number.toLocaleString(
            'en-NG',
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );

}


function formatDate(date) {

    if (!date) return '-';

    const parsed =
        new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return '-';
    }

    return parsed.toLocaleString(
        'en-NG',
        {
            dateStyle: 'medium',
            timeStyle: 'short'
        }
    );

}


// ============================================================
// SECURITY
// ============================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return '';
    }

    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


// ============================================================
// DOM HELPERS
// ============================================================

function updateElement(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


function showLoading() {

    const loader =
        document.getElementById('adminLoading');

    if (loader) {
        loader.style.display = 'flex';
    }

}


function hideLoading() {

    const loader =
        document.getElementById('adminLoading');

    if (loader) {
        loader.style.display = 'none';
    }

}


function showError(message) {

    hideLoading();

    console.error(message);

    const errorElement =
        document.getElementById('adminError');

    if (errorElement) {

        errorElement.textContent =
            message;

        errorElement.style.display =
            'block';

        setTimeout(() => {

            errorElement.style.display =
                'none';

        }, 5000);

    } else {

        alert(message);

    }

}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.loadDashboard =
    loadDashboard;

window.loadUsers =
    loadUsers;

window.loadWalletTransactions =
    loadWalletTransactions;

window.loadDataTransactions =
    loadDataTransactions;

window.loadAirtimeTransactions =
    loadAirtimeTransactions;

window.loadUtilityTransactions =
    loadUtilityTransactions;

window.showSection =
    showSection;

window.logoutAdmin =
    logoutAdmin;

// ======================================================
// DataHub - Complete Frontend Application
// ======================================================

// API Base URL
const API_BASE = '/api';

// ======================================================
// Global State
// ======================================================

let currentUser = null;
let token = localStorage.getItem('token');

// ======================================================
// UI FUNCTIONS
// ======================================================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add('active');
    }

    if (pageId === 'history' && currentUser) {
        loadTransactionHistory();
    }
}


function showModal(modalId) {
    console.log('Opening modal:', modalId);

    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.add('active');
    } else {
        console.error('Modal not found:', modalId);
    }
}


function closeModal(modalId) {
    console.log('Closing modal:', modalId);

    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.remove('active');
    }
}


function selectService(service) {
    const airtimeSection =
        document.getElementById('airtimeSection');

    const dataSection =
        document.getElementById('dataSection');

    const utilitySection =
        document.getElementById('utilitySection');

    if (airtimeSection) {
        airtimeSection.style.display = 'none';
    }

    if (dataSection) {
        dataSection.style.display = 'none';
    }

    if (utilitySection) {
        utilitySection.style.display = 'none';
    }

    if (service === 'airtime') {

        if (airtimeSection) {
            airtimeSection.style.display = 'block';
        }

        loadAirtimeProviders();

    } else if (service === 'data') {

        if (dataSection) {
            dataSection.style.display = 'block';
        }

        loadDataProviders();

    } else if (service === 'utility') {

        if (utilitySection) {
            utilitySection.style.display = 'block';
        }

        loadUtilityTypes();
    }
}


function updateAuthUI() {
    const authSection =
        document.getElementById('authSection');

    const userSection =
        document.getElementById('userSection');

    const balanceSection =
        document.getElementById('balanceSection');

    const userEmail =
        document.getElementById('userEmail');

    if (currentUser) {

        if (authSection) {
            authSection.style.display = 'none';
        }

        if (userSection) {
            userSection.style.display = 'flex';
        }

        if (userEmail) {
            userEmail.textContent =
                currentUser.email || '';
        }

        if (balanceSection) {
            balanceSection.style.display = 'block';
        }

        updateWalletBalance();

    } else {

        if (authSection) {
            authSection.style.display = 'flex';
        }

        if (userSection) {
            userSection.style.display = 'none';
        }

        if (balanceSection) {
            balanceSection.style.display = 'none';
        }
    }
}


function showMessage(
    elementId,
    message,
    type = 'info'
) {
    const messageDiv =
        document.getElementById(elementId);

    if (!messageDiv) {
        console.warn(
            `Message element not found: ${elementId}`
        );
        return;
    }

    messageDiv.innerHTML =
        `<div class="message ${type}">${message}</div>`;

    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}


// ======================================================
// AUTHENTICATION
// ======================================================

async function register() {

    const name =
        document.getElementById('registerName')
            ?.value.trim();

    const email =
        document.getElementById('registerEmail')
            ?.value.trim();

    const phone =
        document.getElementById('registerPhone')
            ?.value.trim();

    const password =
        document.getElementById('registerPassword')
            ?.value;

    if (!name || !email || !phone || !password) {

        showMessage(
            'registerMessage',
            'Please fill all fields',
            'error'
        );

        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/auth/register`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password
                })
            }
        );

        const data = await response.json();

        if (data.success) {

            showMessage(
                'registerMessage',
                'Registration successful! Please login.',
                'success'
            );

            setTimeout(() => {

                closeModal('registerModal');

                showModal('loginModal');

            }, 1500);

        } else {

            showMessage(
                'registerMessage',
                data.message ||
                    'Registration failed',
                'error'
            );
        }

    } catch (error) {

        console.error(
            'Registration error:',
            error
        );

        showMessage(
            'registerMessage',
            'Network error. Please try again.',
            'error'
        );
    }
}


async function login() {

    const email =
        document.getElementById('loginEmail')
            ?.value.trim();

    const password =
        document.getElementById('loginPassword')
            ?.value;

    if (!email || !password) {

        showMessage(
            'loginMessage',
            'Please fill all fields',
            'error'
        );

        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/auth/login`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (data.success) {

            token = data.token;

            currentUser = data.user;

            localStorage.setItem(
                'token',
                token
            );

            localStorage.setItem(
                'user',
                JSON.stringify(currentUser)
            );

            updateAuthUI();

            showMessage(
                'loginMessage',
                'Login successful!',
                'success'
            );

            setTimeout(() => {

                closeModal('loginModal');

                showPage('home');

            }, 1000);

        } else {

            showMessage(
                'loginMessage',
                data.message ||
                    'Login failed',
                'error'
            );
        }

    } catch (error) {

        console.error(
            'Login error:',
            error
        );

        showMessage(
            'loginMessage',
            'Network error. Please try again.',
            'error'
        );
    }
}


function logout() {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

    token = null;

    currentUser = null;

    updateAuthUI();

    showPage('home');
}


function loadUserData() {

    updateWalletBalance();
}


// ======================================================
// WALLET
// ======================================================

async function updateWalletBalance() {

    if (!token) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE}/wallet/balance`,
            {
                headers: {
                    'Authorization':
                        `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (data.success) {

            const balance =
                parseFloat(data.balance) || 0;

            const walletBalanceElement =
                document.getElementById(
                    'walletBalance'
                );

            if (walletBalanceElement) {

                walletBalanceElement.textContent =
                    `₦${balance.toLocaleString(
                        'en-NG',
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}`;
            }

            if (currentUser) {

                currentUser.wallet_balance =
                    balance;

                localStorage.setItem(
                    'user',
                    JSON.stringify(currentUser)
                );
            }
        }

    } catch (error) {

        console.error(
            'Failed to fetch balance:',
            error
        );
    }
}


async function fundWallet() {

    if (!token) {

        showMessage(
            'fundMessage',
            'Please login first',
            'error'
        );

        return;
    }

    const amount =
        parseFloat(
            document.getElementById(
                'fundAmount'
            )?.value
        );

    if (
        !Number.isFinite(amount) ||
        amount < 100
    ) {

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

        const response =
            await fetch(
                `${API_BASE}/payment/initialize`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        amount
                    })
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            showMessage(
                'fundMessage',
                data.message ||
                    'Unable to initialize payment',
                'error'
            );

            return;
        }

        localStorage.setItem(
            'pendingPaymentReference',
            data.reference
        );

        window.location.href =
            data.authorization_url;

    } catch (error) {

        console.error(
            'Payment initialization error:',
            error
        );

        showMessage(
            'fundMessage',
            'Unable to connect to payment service',
            'error'
        );
    }
}


// ======================================================
// AIRTIME
// ======================================================

async function loadAirtimeProviders() {

    try {

        const response =
            await fetch(
                `${API_BASE}/airtime/providers`
            );

        const data =
            await response.json();

        if (data.success) {

            const select =
                document.getElementById(
                    'airtimeProvider'
                );

            if (!select) {
                return;
            }

            select.innerHTML =
                '<option value="">-- Select Provider --</option>';

            data.providers.forEach(
                provider => {

                    select.innerHTML += `
                        <option value="${escapeHtml(provider)}">
                            ${escapeHtml(provider)}
                        </option>
                    `;
                }
            );
        }

    } catch (error) {

        console.error(
            'Failed to load airtime providers:',
            error
        );
    }
}


async function loadAirtimePlans() {

    const provider =
        document.getElementById(
            'airtimeProvider'
        )?.value;

    const plansList =
        document.getElementById(
            'airtimePlansList'
        );

    if (!provider) {

        if (plansList) {
            plansList.innerHTML = '';
        }

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/airtime/plans?provider=${encodeURIComponent(provider)}`
            );

        const data =
            await response.json();

        if (!data.success) {
            return;
        }

        let html = '';

        data.plans.forEach(plan => {

            html += `
                <div class="plan-item">

                    <div class="plan-info">

                        <h4>
                            ${escapeHtml(
                                plan.provider
                            )}
                        </h4>

                        <p>
                            ${escapeHtml(
                                plan.description || ''
                            )}
                        </p>

                    </div>

                    <button
                        class="btn btn-primary plan-buy-btn"
                        onclick="buyAirtime(${plan.id}, ${plan.price}, this)"
                    >
                        ₦${Number(
                            plan.price
                        ).toLocaleString('en-NG')}
                    </button>

                </div>
            `;
        });

        if (plansList) {
            plansList.innerHTML = html;
        }

    } catch (error) {

        console.error(
            'Failed to load airtime plans:',
            error
        );

        showMessage(
            'airtimeMessage',
            'Failed to load plans',
            'error'
        );
    }
}


async function buyAirtime(
    planId,
    amount,
    button
) {

    if (!token) {

        showMessage(
            'airtimeMessage',
            'Please login first',
            'error'
        );

        return;
    }

    const phone =
        document.getElementById(
            'airtimePhone'
        )?.value.trim();

    if (!phone) {

        showMessage(
            'airtimeMessage',
            'Please enter phone number',
            'error'
        );

        return;
    }

    if (
        currentUser &&
        parseFloat(
            currentUser.wallet_balance
        ) < parseFloat(amount)
    ) {

        showMessage(
            'airtimeMessage',
            'Insufficient wallet balance. Please fund your wallet.',
            'error'
        );

        return;
    }

    if (button) {

        button.disabled = true;

        button.textContent =
            'Processing...';
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/airtime/buy`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        phone_number: phone,
                        plan_id: planId
                    })
                }
            );

        const data =
            await response.json();

        if (data.success) {

            showMessage(
                'airtimeMessage',
                `✓ Airtime purchase successful! Ref: ${data.reference}`,
                'success'
            );

            await updateWalletBalance();

            const phoneInput =
                document.getElementById(
                    'airtimePhone'
                );

            if (phoneInput) {
                phoneInput.value = '';
            }

        } else {

            showMessage(
                'airtimeMessage',
                data.message ||
                    'Purchase failed',
                'error'
            );
        }

    } catch (error) {

        console.error(
            'Airtime purchase error:',
            error
        );

        showMessage(
            'airtimeMessage',
            'Network error',
            'error'
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                `₦${Number(
                    amount
                ).toLocaleString('en-NG')}`;
        }
    }
}


// ======================================================
// DATA
// ======================================================

async function loadDataProviders() {

    try {

        const response =
            await fetch(
                `${API_BASE}/data/providers`
            );

        const data =
            await response.json();

        const select =
            document.getElementById(
                'dataProvider'
            );

        if (!select) {
            return;
        }

        if (data.success) {

            select.innerHTML =
                '<option value="">-- Select Provider --</option>';

            data.providers.forEach(
                provider => {

                    select.innerHTML += `
                        <option value="${escapeHtml(provider)}">
                            ${escapeHtml(provider)}
                        </option>
                    `;
                }
            );

        } else {

            select.innerHTML =
                '<option value="">Failed to load providers</option>';

            showMessage(
                'dataMessage',
                data.message ||
                    'Failed to load providers',
                'error'
            );
        }

    } catch (error) {

        console.error(
            'Failed to load data providers:',
            error
        );

        showMessage(
            'dataMessage',
            'Failed to load data providers',
            'error'
        );
    }
}


async function loadDataPlans() {

    const provider =
        document.getElementById(
            'dataProvider'
        )?.value;

    const plansList =
        document.getElementById(
            'dataPlansList'
        );

    if (!plansList) {
        return;
    }

    if (!provider) {

        plansList.innerHTML = '';

        return;
    }

    plansList.innerHTML = `
        <div style="
            grid-column: 1 / -1;
            text-align: center;
            padding: 1rem;
        ">
            Loading ${escapeHtml(
                provider
            )} data plans...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API_BASE}/data/plans?provider=${encodeURIComponent(provider)}`
            );

        const data =
            await response.json();

        if (!data.success) {

            plansList.innerHTML = '';

            showMessage(
                'dataMessage',
                data.message ||
                    'Failed to load data plans',
                'error'
            );

            return;
        }

        if (
            !data.plans ||
            data.plans.length === 0
        ) {

            plansList.innerHTML = `
                <div style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 1.5rem;
                ">
                    No data plans available for
                    ${escapeHtml(provider)}.
                </div>
            `;

            return;
        }

        let html = '';

        data.plans.forEach(plan => {

            const price =
                parseFloat(
                    plan.price
                ).toLocaleString(
                    'en-NG',
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );

            const validity =
                plan.validity_days
                    ? `Valid for ${plan.validity_days} day${
                        plan.validity_days > 1
                            ? 's'
                            : ''
                    }`
                    : 'Validity varies';

            html += `
                <div class="plan-item">

                    <div class="plan-info">

                        <h4>
                            ${escapeHtml(
                                plan.name
                            )}
                        </h4>

                        <div class="plan-data-size">
                            ${escapeHtml(
                                plan.data_size ||
                                'Data Bundle'
                            )}
                        </div>

                        <div class="plan-validity">
                            ${validity}
                        </div>

                    </div>

                    <div class="plan-bottom">

                        <div class="plan-price">
                            ₦${price}
                        </div>

                        <button
                            class="btn btn-primary plan-buy-btn"
                            onclick="buyData(${plan.id}, ${plan.price}, this)"
                        >
                            Buy
                        </button>

                    </div>

                </div>
            `;
        });

        plansList.innerHTML = html;

    } catch (error) {

        console.error(
            'Failed to load data plans:',
            error
        );

        plansList.innerHTML = '';

        showMessage(
            'dataMessage',
            'Failed to load data plans',
            'error'
        );
    }
}


async function buyData(
    planId,
    amount,
    button
) {

    if (!token) {

        showMessage(
            'dataMessage',
            'Please login first',
            'error'
        );

        return;
    }

    const phoneInput =
        document.getElementById(
            'dataPhone'
        );

    if (!phoneInput) {
        return;
    }

    const phone =
        phoneInput.value.trim();

    if (!phone) {

        showMessage(
            'dataMessage',
            'Please enter the phone number that should receive the data',
            'error'
        );

        phoneInput.focus();

        return;
    }

    const cleanPhone =
        phone.replace(/\s+/g, '');

    if (!/^0\d{10}$/.test(cleanPhone)) {

        showMessage(
            'dataMessage',
            'Please enter a valid Nigerian phone number, e.g. 08011111111',
            'error'
        );

        phoneInput.focus();

        return;
    }

    amount =
        parseFloat(amount);

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showMessage(
            'dataMessage',
            'Invalid data plan amount',
            'error'
        );

        return;
    }

    if (
        currentUser &&
        parseFloat(
            currentUser.wallet_balance
        ) < amount
    ) {

        showMessage(
            'dataMessage',
            `Insufficient wallet balance. You need ₦${amount.toLocaleString('en-NG')}.`,
            'error'
        );

        return;
    }

    if (button) {

        button.disabled = true;

        button.textContent =
            'Processing...';
    }

    showMessage(
        'dataMessage',
        'Processing data purchase. Please wait...',
        'info'
    );

    try {

        const response =
            await fetch(
                `${API_BASE}/data/buy`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        phone_number:
                            cleanPhone,

                        plan_id:
                            planId
                    })
                }
            );

        const data =
            await response.json();

        if (data.success) {

            showMessage(
                'dataMessage',
                `✓ Data purchase successful! ${data.plan || ''} has been sent to ${data.phone_number || cleanPhone}. Reference: ${data.reference || ''}`,
                'success'
            );

            await updateWalletBalance();

            if (
                data.wallet_balance !==
                    undefined &&
                currentUser
            ) {

                currentUser.wallet_balance =
                    parseFloat(
                        data.wallet_balance
                    );

                localStorage.setItem(
                    'user',
                    JSON.stringify(
                        currentUser
                    )
                );
            }

            phoneInput.value = '';

        } else {

            showMessage(
                'dataMessage',
                data.message ||
                    'Data purchase failed',
                'error'
            );
        }

    } catch (error) {

        console.error(
            'Data purchase error:',
            error
        );

        showMessage(
            'dataMessage',
            'Network error. Please try again.',
            'error'
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.textContent =
                'Buy';
        }
    }
}


// ======================================================
// UTILITY
// ======================================================

async function loadUtilityTypes() {

    try {

        const response =
            await fetch(
                `${API_BASE}/utility/types`
            );

        const data =
            await response.json();

        if (data.success) {

            const select =
                document.getElementById(
                    'utilityType'
                );

            if (!select) {
                return;
            }

            select.innerHTML =
                '<option value="">-- Select Utility --</option>';

            data.types.forEach(type => {

                select.innerHTML += `
                    <option value="${type.id}">
                        ${escapeHtml(type.name)}
                    </option>
                `;
            });
        }

    } catch (error) {

        console.error(
            'Failed to load utility types:',
            error
        );
    }
}


async function payUtilityBill() {

    if (!token) {

        showMessage(
            'utilityMessage',
            'Please login first',
            'error'
        );

        return;
    }

    const utilityTypeId =
        document.getElementById(
            'utilityType'
        )?.value;

    const account =
        document.getElementById(
            'utilityAccount'
        )?.value.trim();

    const amount =
        parseFloat(
            document.getElementById(
                'utilityAmount'
            )?.value
        );

    if (
        !utilityTypeId ||
        !account ||
        !amount
    ) {

        showMessage(
            'utilityMessage',
            'Please fill all fields',
            'error'
        );

        return;
    }

    if (
        currentUser &&
        parseFloat(
            currentUser.wallet_balance
        ) < amount
    ) {

        showMessage(
            'utilityMessage',
            'Insufficient wallet balance. Please fund your wallet',
            'error'
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/utility/pay`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        utility_type_id:
                            utilityTypeId,

                        utility_account_number:
                            account,

                        amount
                    })
                }
            );

        const data =
            await response.json();

        if (data.success) {

            showMessage(
                'utilityMessage',
                `✓ Bill paid successfully! Ref: ${data.reference}`,
                'success'
            );

            await updateWalletBalance();

            document.getElementById(
                'utilityAccount'
            ).value = '';

            document.getElementById(
                'utilityAmount'
            ).value = '';

        } else {

            showMessage(
                'utilityMessage',
                data.message ||
                    'Payment failed',
                'error'
            );
        }

    } catch (error) {

        console.error(
            'Utility payment error:',
            error
        );

        showMessage(
            'utilityMessage',
            'Network error',
            'error'
        );
    }
}


// ======================================================
// HISTORY
// ======================================================

async function loadTransactionHistory() {

    if (!token) {
        return;
    }

    const historyContent =
        document.getElementById(
            'historyContent'
        );

    if (!historyContent) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/wallet/transactions`,
                {
                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (
            data.success &&
            data.transactions &&
            data.transactions.length > 0
        ) {

            let html = '';

            data.transactions.forEach(
                transaction => {

                    const isCredit =
                        transaction.type ===
                        'credit';

                    const date =
                        new Date(
                            transaction.created_at
                        ).toLocaleString(
                            'en-NG',
                            {
                                dateStyle:
                                    'medium',

                                timeStyle:
                                    'short'
                            }
                        );

                    const amount =
                        parseFloat(
                            transaction.amount
                        ).toFixed(2);

                    const amountDisplay =
                        isCredit
                            ? `+₦${amount}`
                            : `-₦${amount}`;

                    const typeDisplay =
                        isCredit
                            ? 'Credit'
                            : 'Debit';

                    const status =
                        transaction.status ||
                        'completed';

                    html += `
                        <div style="
                            border: 1px solid #ddd;
                            border-radius: 10px;
                            padding: 15px;
                            margin-bottom: 12px;
                            background: #fff;
                        ">

                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                gap: 10px;
                            ">

                                <strong>
                                    ${escapeHtml(
                                        transaction.description ||
                                        ''
                                    )}
                                </strong>

                                <strong>
                                    ${amountDisplay}
                                </strong>

                            </div>

                            <div style="
                                margin-top: 8px;
                                font-size: 14px;
                                color: #666;
                            ">
                                ${escapeHtml(
                                    typeDisplay
                                )}
                                •
                                ${escapeHtml(
                                    status
                                )}
                            </div>

                            <div style="
                                margin-top: 5px;
                                font-size: 13px;
                                color: #888;
                            ">
                                ${escapeHtml(
                                    date
                                )}
                            </div>

                            <button
                                class="btn btn-primary"
                                onclick='downloadTransactionReceipt(${JSON.stringify(
                                    transaction
                                ).replace(
                                    /'/g,
                                    '&#39;'
                                )})'
                                style="
                                    margin-top: 10px;
                                    width: 100%;
                                "
                            >
                                🧾 Download Receipt
                            </button>

                        </div>
                    `;
                }
            );

            historyContent.innerHTML =
                html;

        } else {

            historyContent.innerHTML =
                '<p>No transactions yet.</p>';
        }

    } catch (error) {

        console.error(
            'Failed to load transaction history:',
            error
        );

        historyContent.innerHTML =
            '<p>Failed to load transaction history.</p>';
    }
}


// ======================================================
// TRANSACTION RECEIPT
// ======================================================

function downloadTransactionReceipt(
    transaction
) {

    const amount =
        parseFloat(
            transaction.amount
        ).toFixed(2);

    const date =
        new Date(
            transaction.created_at
        ).toLocaleString(
            'en-NG',
            {
                dateStyle:
                    'medium',

                timeStyle:
                    'short'
            }
        );

    const type =
        transaction.type === 'credit'
            ? 'Credit'
            : 'Debit';

    const status =
        transaction.status ||
        'completed';

    const receiptNumber =
        `DH-${transaction.id}-${Date.now()}`;

    const receiptHtml = `
        <!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            >

            <title>
                DataHub Transaction Receipt
            </title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    background: #f5f5f5;
                    padding: 30px;
                }

                .receipt {
                    max-width: 500px;
                    margin: auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow:
                        0 2px 10px
                        rgba(0,0,0,0.1);
                }

                h1 {
                    text-align: center;
                    color: #1e3c72;
                    margin-bottom: 5px;
                }

                .subtitle {
                    text-align: center;
                    color: #666;
                    margin-bottom: 25px;
                }

                .row {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 10px 0;
                    border-bottom:
                        1px solid #eee;
                }

                .label {
                    color: #666;
                }

                .value {
                    font-weight: bold;
                    text-align: right;
                }

                .amount {
                    font-size: 24px;
                    color: #1e3c72;
                }

                .footer {
                    text-align: center;
                    margin-top: 25px;
                    color: #777;
                    font-size: 13px;
                }

            </style>

        </head>

        <body>

            <div class="receipt">

                <h1>
                    💳 DataHub
                </h1>

                <div class="subtitle">
                    Transaction Receipt
                </div>

                <div class="row">
                    <span class="label">
                        Receipt No.
                    </span>

                    <span class="value">
                        ${escapeHtml(
                            receiptNumber
                        )}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Transaction ID
                    </span>

                    <span class="value">
                        ${escapeHtml(
                            String(
                                transaction.id
                            )
                        )}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Description
                    </span>

                    <span class="value">
                        ${escapeHtml(
                            transaction.description ||
                            ''
                        )}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Type
                    </span>

                    <span class="value">
                        ${escapeHtml(type)}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Amount
                    </span>

                    <span class="value amount">
                        ₦${escapeHtml(amount)}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Status
                    </span>

                    <span class="value">
                        ${escapeHtml(status)}
                    </span>
                </div>

                <div class="row">
                    <span class="label">
                        Date
                    </span>

                    <span class="value">
                        ${escapeHtml(date)}
                    </span>
                </div>

                <div class="footer">
                    Thank you for using DataHub.
                    <br>
                    Keep this receipt for your records.
                </div>

            </div>

        </body>

        </html>
    `;

    const blob =
        new Blob(
            [receiptHtml],
            {
                type: 'text/html'
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement('a');

    link.href = url;

    link.download =
        `DataHub-Receipt-${transaction.id}.html`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


// ======================================================
// PAYMENT CALLBACK
// ======================================================

async function handlePaymentCallback() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const reference =
        params.get('reference') ||
        params.get('trxref') ||
        localStorage.getItem(
            'pendingPaymentReference'
        );

    if (!reference) {
        return;
    }

    if (!token) {

        showPage('home');

        alert(
            'Payment returned. Please log in to finish updating your wallet balance.'
        );

        return;
    }

    try {

        showPage('home');

        if (
            document.getElementById(
                'fundMessage'
            )
        ) {

            showMessage(
                'fundMessage',
                'Verifying your payment...',
                'info'
            );
        }

        const response =
            await fetch(
                `${API_BASE}/payment/verify/${encodeURIComponent(reference)}`,
                {
                    method: 'GET',

                    headers: {
                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (data.success) {

            await updateWalletBalance();

            showMessage(
                'fundMessage',
                `✓ Payment successful! ₦${Number(
                    data.amount || 0
                ).toLocaleString(
                    'en-NG'
                )} has been added to your wallet.`,
                'success'
            );

            localStorage.removeItem(
                'pendingPaymentReference'
            );

        } else {

            showMessage(
                'fundMessage',
                data.message ||
                    'Payment verification failed.',
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

    } finally {

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );
    }
}


// ======================================================
// UTILITY
// ======================================================

function escapeHtml(value) {

    const div =
        document.createElement('div');

    div.textContent =
        value ?? '';

    return div.innerHTML;
}


// ======================================================
// MODAL OUTSIDE CLICK
// ======================================================

window.addEventListener(
    'click',
    event => {

        if (
            event.target.classList.contains(
                'modal'
            )
        ) {

            event.target.classList.remove(
                'active'
            );
        }
    }
);


// ======================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ======================================================
//
// Your index.html uses inline handlers such as:
//
// onclick="showModal('loginModal')"
// onclick="login()"
// onclick="register()"
// onclick="logout()"
//
// Explicitly attaching them to window ensures
// those HTML onclick handlers can find them.
//

window.showPage =
    showPage;

window.showModal =
    showModal;

window.closeModal =
    closeModal;

window.selectService =
    selectService;

window.register =
    register;

window.login =
    login;

window.logout =
    logout;

window.fundWallet =
    fundWallet;

window.loadAirtimeProviders =
    loadAirtimeProviders;

window.loadAirtimePlans =
    loadAirtimePlans;

window.buyAirtime =
    buyAirtime;

window.loadDataProviders =
    loadDataProviders;

window.loadDataPlans =
    loadDataPlans;

window.buyData =
    buyData;

window.loadUtilityTypes =
    loadUtilityTypes;

window.payUtilityBill =
    payUtilityBill;

window.loadTransactionHistory =
    loadTransactionHistory;

window.downloadTransactionReceipt =
    downloadTransactionReceipt;

window.handlePaymentCallback =
    handlePaymentCallback;


// ======================================================
// INITIALIZATION
// ======================================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        console.log(
            'DataHub app.js loaded successfully'
        );

        console.log(
            'showModal available:',
            typeof window.showModal
        );

        // Restore saved login
        if (token) {

            try {

                const savedUser =
                    localStorage.getItem(
                        'user'
                    );

                if (savedUser) {

                    currentUser =
                        JSON.parse(
                            savedUser
                        );

                    updateAuthUI();

                    loadUserData();

                } else {

                    localStorage.removeItem(
                        'token'
                    );

                    token = null;

                    currentUser = null;
                }

            } catch (error) {

                console.error(
                    'Failed to restore user session:',
                    error
                );

                localStorage.removeItem(
                    'token'
                );

                localStorage.removeItem(
                    'user'
                );

                token = null;

                currentUser = null;
            }

        } else {

            updateAuthUI();
        }

        // Check Paystack callback
        await handlePaymentCallback();
    }
);

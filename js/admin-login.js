// ============================================================
// ADMIN LOGIN
// ============================================================

const API_BASE = '/api/admin';

document.addEventListener('DOMContentLoaded', () => {
    // Make sure 'loginForm' matches <form id="loginForm"> in your index.html
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            // 1. MUST BE FIRST: Stop the form from refreshing the page
            e.preventDefault(); 

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }

            try {
                // 2. Post to your exact backend endpoint
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Save admin authentication token & user info
                    if (data.token) {
                        localStorage.setItem('adminToken', data.token);
                    }
                    if (data.admin) {
                        localStorage.setItem('adminUser', JSON.stringify(data.admin));
                    }
                    
                    // 3. Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    alert(data.message || 'Login failed. Invalid email or password.');
                }
            } catch (error) {
                console.error('Login Error:', error);
                alert('Server connection error. Make sure your Node backend is running.');
            }
        });
    }
});
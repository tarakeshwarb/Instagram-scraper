// Authentication Handling
const authManager = {
    // Check if user is authenticated
    isAuthenticated() {
        return localStorage.getItem('token') !== null;
    },
    
    // Get current user data
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // Get authentication token
    getToken() {
        return localStorage.getItem('token');
    },
    
    // Logout the user
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Call logout endpoint to clear cookies
        fetch('/api/auth/logout', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getToken()}`
            }
        }).catch(err => console.error('Logout error:', err));
        
        // Redirect to login page
        window.location.href = '/login.html';
    },
    
    // Update UI based on auth status
    updateAuthUI() {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        const user = this.getCurrentUser();
        
        if (this.isAuthenticated() && user) {
            // User is logged in
            authButtons.classList.add('d-none');
            userMenu.classList.remove('d-none');
            
            // Update username in UI
            document.getElementById('usernameDisplay').textContent = user.username;
            
        } else {
            // User is not logged in
            authButtons.classList.remove('d-none');
            userMenu.classList.add('d-none');
        }
    }
};

// Authentication check on page load
document.addEventListener('DOMContentLoaded', () => {
    // Update UI based on auth status
    authManager.updateAuthUI();
    
    // Check if we need to redirect to login
    if (!authManager.isAuthenticated() && !window.location.pathname.includes('/login.html') && !window.location.pathname.includes('/register.html')) {
        // Save current URL to redirect back after login
        localStorage.setItem('redirectUrl', window.location.pathname);
        
        // Allow 2 seconds for the page to load before redirecting
        // This gives a better UX by briefly showing the dashboard before requiring login
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    }
    
    // Register event handlers
    
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = '/login.html';
        });
    }
    
    // Register button
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            window.location.href = '/register.html';
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authManager.logout();
        });
    }
});

// Add Authorization header to all fetch requests
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    // Only add auth header for our own API requests
    if (url.toString().startsWith('/api/') && authManager.isAuthenticated()) {
        options.headers = options.headers || {};
        
        // Don't override if Authorization is already set
        if (!options.headers.Authorization && !options.headers.authorization) {
            options.headers.Authorization = `Bearer ${authManager.getToken()}`;
        }
    }
    
    return originalFetch(url, options);
};
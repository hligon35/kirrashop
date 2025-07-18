// User Authentication & Session Management

// Check if user is logged in and redirect if not
function checkAuthStatus() {
    const userToken = localStorage.getItem('userToken');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    
    // Check if login-access-section exists
    const loginSection = document.querySelector('.login-access-section');
    
    if (userToken && userRole) {
        console.log('User is logged in as:', userRole);
        
        // Show user information
        if (loginSection) {
            loginSection.innerHTML = `
                <div class="user-welcome">
                    <div class="user-info">
                        <i class="fas ${userRole === 'admin' ? 'fa-user-shield' : 'fa-user'}"></i>
                        <div class="user-details">
                            <h3>Welcome, ${userName || (userRole === 'admin' ? 'Administrator' : 'Customer')}</h3>
                            <p>You are logged in as: ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
                        </div>
                    </div>
                    <button class="btn btn-black logout-btn" onclick="logoutUser()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            `;
        }
        
        // Set role-specific UI elements
        configureUserInterface(userRole);
        
    } else {
        console.log('User is not logged in');
        
        // Keep the login buttons visible (they're already in the HTML)
    }
}

// Configure UI based on user role
function configureUserInterface(role) {
    // Common elements to show/hide based on role
    if (role === 'admin') {
        // Show admin-only features
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.customer-only').forEach(el => el.style.display = 'none');
        
        // Enable all tabs for admin
        document.querySelectorAll('.tab-btn').forEach(tab => tab.style.display = 'block');
        
    } else if (role === 'customer') {
        // Show customer-only features
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.customer-only').forEach(el => el.style.display = 'block');
        
        // Only show relevant tabs for customers
        document.querySelectorAll('.tab-btn').forEach(tab => {
            const tabName = tab.getAttribute('data-tab');
            if (['appointments', 'gallery', 'promos', 'chat'].includes(tabName)) {
                tab.style.display = 'block';
            } else {
                tab.style.display = 'none';
            }
        });
        
        // Default to appointments tab for customers
        switchTab('appointments');
    }
}

// Logout user
function logoutUser() {
    // Use the consolidated logout function from script.js
    logout();
}

// Call the auth check when the page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

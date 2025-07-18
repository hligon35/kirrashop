// Customer Login Debug Helper Functions

// Function to test direct login without server interaction
function testDirectLogin() {
    console.log('Testing direct login functionality...');
    
    // Create mock user data
    const mockUserData = {
        user: {
            id: 'customer1',
            name: 'Test Customer',
            phone: '5555551234',
            role: 'customer'
        }
    };
    
    // Access the login manager from the global scope
    const loginManager = window.customerLoginManager;
    
    if (loginManager) {
        loginManager.successfulLogin(mockUserData);
    } else {
        console.error('Login manager not found');
        alert('Error: Login manager not initialized properly. Please refresh the page.');
    }
}

// Function to check server status
function checkServerStatus() {
    console.log('Checking server status...');
    
    // Show feedback to user
    const statusBtn = document.querySelector('button[onclick="checkServerStatus()"]');
    const originalText = statusBtn.innerHTML;
    statusBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    
    // Check if server is responding
    fetch('/api/status', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }
        throw new Error('Server returned status: ' + response.status);
    })
    .then(data => {
        console.log('Server status:', data);
        alert('Server is online! Status: ' + JSON.stringify(data));
    })
    .catch(error => {
        console.error('Server check failed:', error);
        alert('Server might be offline or not responding: ' + error.message);
    })
    .finally(() => {
        // Restore button text
        statusBtn.innerHTML = originalText;
    });
}

// Function to clear phone number input
function clearCustomerPhoneNumber() {
    document.getElementById('customerPhoneNumber').value = '';
}

// Function to go back to login screen from verification
function goBackToCustomerLogin() {
    const loginManager = window.customerLoginManager;
    if (loginManager) {
        loginManager.showLoginForm();
    }
}

// Function to simulate resending verification code
function resendCustomerCode() {
    console.log('Simulating code resend...');
    
    const loginManager = window.customerLoginManager;
    if (loginManager) {
        loginManager.showSuccess('Verification code resent!');
    }
}

// Initialize customer login manager in global scope when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.customerLoginManager = new CustomerLoginManager();
});

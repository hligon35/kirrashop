// Updated login-script.js to work with the new landing page structure

document.addEventListener('DOMContentLoaded', function() {
    // Setup form submission handlers
    setupLoginFormHandlers();
    
    // Setup verification form handler
    setupVerificationFormHandler();
});

function setupLoginFormHandlers() {
    // Admin login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const phoneNumber = document.getElementById('phoneNumber').value;
            const password = document.getElementById('password').value;
            handleLogin(phoneNumber, password, 'admin');
        });
    }
    
    // Customer login form
    const customerLoginForm = document.getElementById('customerLoginForm');
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const phoneNumber = document.getElementById('customerPhoneNumber').value;
            const password = document.getElementById('customerPassword').value;
            handleLogin(phoneNumber, password, 'customer');
        });
    }
}

function setupVerificationFormHandler() {
    const verificationForm = document.getElementById('verificationForm');
    if (verificationForm) {
        verificationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const code = document.getElementById('verificationCode').value;
            handleVerification(code);
        });
    }
}

function handleLogin(phoneNumber, password, userType) {
    // Show loading spinner
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
    
    // Hide error message if shown
    hideErrorMessage();
    
    // Simulate API call with delay (replace with actual API call)
    setTimeout(() => {
        // In a real app, we would make an API request here
        
        // For demo purposes, use test credentials
        const isValidCredentials = validateCredentials(phoneNumber, password, userType);
        
        if (isValidCredentials) {
            // Store masked phone for verification form
            const maskedPhone = maskPhoneNumber(phoneNumber);
            const maskedPhoneSpan = document.getElementById('maskedPhone');
            if (maskedPhoneSpan) {
                maskedPhoneSpan.textContent = maskedPhone;
            }
            
            // Hide loading spinner
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
            
            // Show verification form
            showVerificationForm();
        } else {
            // Hide loading spinner
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
            
            // Show error message
            showErrorMessage('Invalid phone number or password. Please try again.');
        }
    }, 1500);
}

function validateCredentials(phoneNumber, password, userType) {
    // Remove formatting from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // For demo purposes, use hardcoded test credentials
    if (userType === 'admin') {
        return cleanPhone === '5551234567' && password === 'Admin123!';
    } else if (userType === 'customer') {
        return cleanPhone === '5555551234' && password === 'Customer1!';
    }
    
    return false;
}

function maskPhoneNumber(phoneNumber) {
    // Remove formatting from phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Mask all but last 4 digits
    if (cleanPhone.length === 10) {
        return `(***) ***-${cleanPhone.substring(6, 10)}`;
    }
    
    return '(***) ***-****';
}

function handleVerification(code) {
    // Show loading spinner
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
    
    // Hide error message if shown
    hideErrorMessage();
    
    // Simulate API call with delay (replace with actual API call)
    setTimeout(() => {
        // In a real app, we would verify the code with an API request
        
        // For demo purposes, use '123456' as valid code
        if (code === '123456') {
            // Hide loading spinner
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
            
            // Show success message
            showSuccessMessage('Login successful! Redirecting...');
            
            // Set localStorage variables
            const activeTab = document.querySelector('.login-tab.active');
            const userRole = activeTab ? activeTab.getAttribute('data-target') : 'customer';
            
            localStorage.setItem('userToken', 'demo-token-' + Date.now());
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userName', userRole === 'admin' ? 'Kirra Admin' : 'Valued Customer');
            
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1500);
        } else {
            // Hide loading spinner
            if (loadingSpinner) {
                loadingSpinner.style.display = 'none';
            }
            
            // Show error message
            showErrorMessage('Invalid verification code. Please try again.');
        }
    }, 1500);
}

function showVerificationForm() {
    // Hide the login dropdown
    const loginDropdown = document.getElementById('loginDropdown');
    if (loginDropdown) {
        loginDropdown.classList.remove('active');
    }
    
    // Show the verification overlay
    const authOverlay = document.getElementById('authOverlay');
    if (authOverlay) {
        authOverlay.style.display = 'flex';
    }
}

function goBack() {
    // Hide verification form
    const authOverlay = document.getElementById('authOverlay');
    if (authOverlay) {
        authOverlay.style.display = 'none';
    }
}

function resendCode() {
    // Show success message for code resend
    showSuccessMessage('Verification code resent!');
}

function showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

function hideErrorMessage() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

function showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    
    if (successMessage && successText) {
        successText.textContent = message;
        successMessage.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    }
}

function clearPhoneNumber() {
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput) {
        phoneInput.value = '';
    }
}

function clearCustomerPhoneNumber() {
    const phoneInput = document.getElementById('customerPhoneNumber');
    if (phoneInput) {
        phoneInput.value = '';
    }
}

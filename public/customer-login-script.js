// Customer Login Script
class CustomerLoginManager {
    constructor() {
        this.loginForm = document.getElementById('customerLoginForm');
        this.verificationForm = document.getElementById('customerVerificationForm');
        this.loadingSpinner = document.getElementById('customerLoadingSpinner');
        this.errorMessage = document.getElementById('customerErrorMessage');
        this.successMessage = document.getElementById('customerSuccessMessage');
        
        this.currentPhone = '';
        this.sessionToken = '';
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Login form submission
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Verification form submission
        this.verificationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleVerification();
        });

        // Phone number formatting - simple approach without +1 prefix
        const phoneInput = document.getElementById('customerPhoneNumber');
        
        phoneInput.addEventListener('input', (e) => {
            const input = e.target;
            let value = input.value;
            
            // Remove all non-digits
            let digits = value.replace(/\D/g, '');
            
            // Limit to 10 digits max
            if (digits.length > 10) {
                digits = digits.substring(0, 10);
            }
            
            // Format based on length (without +1 prefix)
            let formatted = '';
            if (digits.length === 0) {
                formatted = '';
            } else if (digits.length <= 3) {
                formatted = `(${digits}`;
            } else if (digits.length <= 6) {
                formatted = `(${digits.substring(0, 3)}) ${digits.substring(3)}`;
            } else {
                formatted = `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
            }
            
            input.value = formatted;
        });

        // Only allow numeric input for verification code
        const verificationInput = document.getElementById('customerVerificationCode');
        verificationInput.addEventListener('keypress', (e) => {
            const key = e.key;
            if (!/^[0-9]$/.test(key) && !['Backspace', 'Delete', 'Tab'].includes(key)) {
                e.preventDefault();
            }
        });

        // Auto-advance to verification after entering 6 digits
        verificationInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length === 6) {
                // Auto-submit after brief delay
                setTimeout(() => {
                    this.handleVerification();
                }, 500);
            }
        });
    }

    showLoading() {
        this.loadingSpinner.style.display = 'block';
        this.loginForm.style.display = 'none';
        this.verificationForm.style.display = 'none';
        this.hideMessages();
    }

    hideLoading() {
        this.loadingSpinner.style.display = 'none';
    }

    showLoginForm() {
        this.loginForm.style.display = 'block';
        this.verificationForm.style.display = 'none';
        this.hideLoading();
    }

    showVerificationForm() {
        this.loginForm.style.display = 'none';
        this.verificationForm.style.display = 'block';
        this.hideLoading();
        
        // Mask phone number for display
        const maskedPhone = this.maskPhone(this.currentPhone);
        document.getElementById('customerMaskedPhone').textContent = maskedPhone;
        
        // Focus on verification input
        setTimeout(() => {
            document.getElementById('customerVerificationCode').focus();
        }, 100);
    }

    showError(message) {
        this.errorMessage.style.display = 'block';
        document.getElementById('customerErrorText').textContent = message;
        this.successMessage.style.display = 'none';
        this.hideLoading();
    }

    showSuccess(message) {
        this.successMessage.style.display = 'block';
        document.getElementById('customerSuccessText').textContent = message;
        this.errorMessage.style.display = 'none';
    }

    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }

    maskPhone(phone) {
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-****');
    }

    validatePassword(password) {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        
        const hasUppercase = /[A-Z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (!hasUppercase) {
            return 'Password must contain at least one uppercase letter';
        }
        
        if (!hasSpecialChar) {
            return 'Password must contain at least one special character';
        }
        
        return null;
    }

    async handleLogin() {
        const phoneInput = document.getElementById('customerPhoneNumber');
        const passwordInput = document.getElementById('customerPassword');
        
        const phone = phoneInput.value;
        const password = passwordInput.value;

        // Debug logging
        console.log('=== CUSTOMER LOGIN DEBUG ===');
        console.log('Raw phone input:', phone);
        console.log('Password input:', password);

        // Basic validation
        if (!phone || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        // Extract clean phone number (remove formatting)
        const cleanPhone = phone.replace(/\D/g, '');
        console.log('Cleaned phone:', cleanPhone);
        
        if (cleanPhone.length !== 10) {
            this.showError('Please enter a valid 10-digit phone number');
            return;
        }

        // Validate password requirements
        const passwordError = this.validatePassword(password);
        if (passwordError) {
            this.showError(passwordError);
            return;
        }

        this.showLoading();

        console.log('Sending login request with:', { phone: cleanPhone, password });

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: cleanPhone,
                    password: password
                })
            });

            const data = await response.json();
            console.log('Login response:', { status: response.status, data });

            if (response.ok) {
                this.currentPhone = cleanPhone;
                this.sessionToken = data.sessionToken;
                this.showVerificationForm();
                this.showSuccess('Verification code sent to your phone!');
            } else {
                this.showError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    async handleVerification() {
        const code = document.getElementById('customerVerificationCode').value;

        if (!code || code.length !== 6) {
            this.showError('Please enter a valid 6-digit code');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: this.currentPhone,
                    code: code,
                    sessionToken: this.sessionToken
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('Login successful! Redirecting...');
                
                // Store authentication token
                localStorage.setItem('authToken', data.authToken);
                localStorage.setItem('userPhone', this.currentPhone);
                localStorage.setItem('userRole', 'customer');
                
                // Redirect to customer dashboard (main page for now)
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
                
            } else {
                this.showError(data.message || 'Verification failed');
                this.showVerificationForm(); // Keep verification form visible
            }
        } catch (error) {
            console.error('Verification error:', error);
            this.showError('Network error. Please try again.');
            this.showVerificationForm();
        }
    }

    async resendCode() {
        if (!this.currentPhone || !this.sessionToken) {
            this.showError('Session expired. Please login again.');
            this.showLoginForm();
            return;
        }

        this.showLoading();

        try {
            const response = await fetch('/api/auth/resend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: this.currentPhone,
                    sessionToken: this.sessionToken
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showVerificationForm();
                this.showSuccess('New verification code sent!');
                
                // Clear the verification input
                document.getElementById('customerVerificationCode').value = '';
            } else {
                this.showError(data.message || 'Failed to resend code');
                this.showVerificationForm();
            }
        } catch (error) {
            console.error('Resend error:', error);
            this.showError('Network error. Please try again.');
            this.showVerificationForm();
        }
    }

    goBack() {
        this.showLoginForm();
        this.hideMessages();
        
        // Clear form data
        this.currentPhone = '';
        this.sessionToken = '';
        document.getElementById('customerVerificationCode').value = '';
    }
}

// Global functions for button onclick handlers
function clearCustomerPhoneNumber() {
    document.getElementById('customerPhoneNumber').value = '';
    document.getElementById('customerPhoneNumber').focus();
}

function resendCustomerCode() {
    if (window.customerLoginManager) {
        window.customerLoginManager.resendCode();
    }
}

function goBackToCustomerLogin() {
    if (window.customerLoginManager) {
        window.customerLoginManager.goBack();
    }
}

// Direct test function for debugging
async function testDirectLogin() {
    console.log('=== DIRECT LOGIN TEST ===');
    
    // Test with exact server credentials
    const testCredentials = [
        { phone: '5555551234', password: 'Test123!', name: 'Raw Number' },
        { phone: '(555) 555-1234', password: 'Test123!', name: 'Formatted Number' }
    ];
    
    for (const cred of testCredentials) {
        console.log(`Testing ${cred.name}: ${cred.phone}`);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    phone: cred.phone.replace(/\D/g, ''), // Clean it
                    password: cred.password 
                })
            });
            
            const data = await response.json();
            console.log(`${cred.name} result:`, { status: response.status, data });
            
            if (response.ok) {
                alert(`✅ ${cred.name} LOGIN SUCCESS!\nVerification code: Check server console`);
                return; // Stop on first success
            } else {
                console.log(`❌ ${cred.name} failed:`, data.message);
            }
            
        } catch (error) {
            console.error(`${cred.name} error:`, error);
        }
    }
    
    alert('❌ ALL LOGIN TESTS FAILED\nCheck browser console for details');
}

// Server status check function
async function checkServerStatus() {
    console.log('=== SERVER STATUS CHECK ===');
    
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        console.log('Server status:', data);
        
        if (response.ok) {
            alert(`✅ SERVER IS RUNNING\n\nUsers available:\n${data.users.map(u => `${u.role}: ${u.phone}`).join('\n')}\n\nTime: ${data.time}`);
        } else {
            alert('❌ SERVER ERROR\nCheck console for details');
        }
        
    } catch (error) {
        console.error('Server status error:', error);
        alert('❌ CANNOT CONNECT TO SERVER\nMake sure server is running on port 3000');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.customerLoginManager = new CustomerLoginManager();
    
    // Auto-fill test credentials when clicking on them
    document.addEventListener('click', (e) => {
        if (e.target.closest('.test-credentials')) {
            const phoneInput = document.getElementById('customerPhoneNumber');
            const passwordInput = document.getElementById('customerPassword');
            
            // Try both formatted and raw number
            phoneInput.value = '5555551234'; // Use raw number first
            passwordInput.value = 'Test123!';
            
            console.log('Auto-filled credentials:', {
                phone: phoneInput.value,
                password: passwordInput.value
            });
            
            // Flash effect to show auto-fill
            phoneInput.style.backgroundColor = '#e8f5e8';
            passwordInput.style.backgroundColor = '#e8f5e8';
            
            setTimeout(() => {
                phoneInput.style.backgroundColor = '';
                passwordInput.style.backgroundColor = '';
            }, 1000);
        }
    });
});

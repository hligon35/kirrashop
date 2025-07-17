// Login Script
class LoginManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.verificationForm = document.getElementById('verificationForm');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        
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
        const phoneInput = document.getElementById('phoneNumber');
        
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
        
        phoneInput.addEventListener('keydown', (e) => {
            const input = e.target;
            const key = e.key;
            
            // Allow control keys
            if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
                return;
            }
            
            // Allow Ctrl combinations
            if (e.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) {
                return;
            }
            
            // Only allow digits
            if (!/^[0-9]$/.test(key)) {
                e.preventDefault();
                return;
            }
            
            // Get current digit count
            const currentDigits = input.value.replace(/\D/g, '');
            
            // Block if we already have 10 digits
            if (currentDigits.length >= 10) {
                e.preventDefault();
                return;
            }
        });

        // Clear phone number button
        const clearPhoneBtn = document.getElementById('clearPhone');
        if (clearPhoneBtn) {
            clearPhoneBtn.addEventListener('click', () => {
                phoneInput.value = '';
                phoneInput.focus();
            });
        }

        // Verification code formatting
        const codeInput = document.getElementById('verificationCode');
        codeInput.addEventListener('input', this.formatVerificationCode);

        // Auto-submit when verification code is complete
        codeInput.addEventListener('input', (e) => {
            if (e.target.value.length === 6) {
                setTimeout(() => this.handleVerification(), 500);
            }
        });
    }

    handlePhoneKeydown(e) {
        // This method is no longer used - keydown handling is now inline
        return;
    }

    formatPhoneNumber(e) {
        // This method is no longer used - formatting is handled in the input event listener
        return;
    }

    formatVerificationCode(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 6) value = value.slice(0, 6);
        e.target.value = value;
    }

    showLoading() {
        this.hideAllMessages();
        this.loadingSpinner.style.display = 'block';
    }

    hideLoading() {
        this.loadingSpinner.style.display = 'none';
    }

    showError(message) {
        this.hideLoading();
        document.getElementById('errorText').textContent = message;
        this.errorMessage.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        this.hideLoading();
        document.getElementById('successText').textContent = message;
        this.successMessage.style.display = 'flex';
    }

    hideAllMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
        this.loadingSpinner.style.display = 'none';
    }

    async handleLogin() {
        const phone = document.getElementById('phoneNumber').value;
        const password = document.getElementById('password').value;

        // Basic validation
        if (!phone || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        // Extract just the numbers from phone
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
            this.showError('Please enter a valid 10-digit phone number');
            return;
        }

        // Password validation
        const hasUppercase = /[A-Z]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;
        
        if (!isLongEnough) {
            this.showError('Password must be at least 8 characters long');
            return;
        }
        
        if (!hasUppercase || !hasSpecialChar) {
            this.showError('Password must contain at least 1 uppercase letter and 1 special character');
            return;
        }

        this.showLoading();

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
        const code = document.getElementById('verificationCode').value;

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
                
                // Redirect to main application
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                this.showError(data.message || 'Verification failed');
            }
        } catch (error) {
            console.error('Verification error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    showVerificationForm() {
        this.loginForm.style.display = 'none';
        this.verificationForm.style.display = 'flex';
        
        // Show masked phone number
        const maskedPhone = this.currentPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-****');
        document.getElementById('maskedPhone').textContent = maskedPhone;
        
        // Focus on verification code input
        setTimeout(() => {
            document.getElementById('verificationCode').focus();
        }, 300);
    }

    async resendCode() {
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
                this.showSuccess('New verification code sent!');
            } else {
                this.showError(data.message || 'Failed to resend code');
            }
        } catch (error) {
            console.error('Resend error:', error);
            this.showError('Network error. Please try again.');
        }
    }

    goBack() {
        this.verificationForm.style.display = 'none';
        this.loginForm.style.display = 'flex';
        this.hideAllMessages();
        
        // Clear verification code
        document.getElementById('verificationCode').value = '';
        
        // Focus on password field
        setTimeout(() => {
            document.getElementById('password').focus();
        }, 300);
    }
}

// Global functions for button onclick handlers
function resendCode() {
    loginManager.resendCode();
}

function goBack() {
    loginManager.goBack();
}

function clearPhoneNumber() {
    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.value = '';
    phoneInput.removeAttribute('data-previous-value');
    phoneInput.focus();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.loginManager = new LoginManager();
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        // Verify token is still valid
        fetch('/api/auth/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                window.location.href = '/';
            } else {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userPhone');
            }
        })
        .catch(error => {
            console.error('Token verification error:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userPhone');
        });
    }
});

// Global function for clear button
function clearPhoneNumber() {
    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.value = '';
    phoneInput.focus();
}
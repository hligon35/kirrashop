/**
 * Test Credentials for Kirra's Nail Studio
 * 
 * This file contains test credentials that can be used to log into the application.
 * DO NOT USE THESE IN PRODUCTION.
 */

// Admin credentials
const ADMIN_CREDENTIALS = {
    phoneNumber: '123-456-7890',
    password: 'admin123',
    verificationCode: '123456' // Static verification code for testing
};

// Customer credentials
const CUSTOMER_CREDENTIALS = {
    phoneNumber: '987-654-3210',
    verificationCode: '123456' // Static verification code for testing
};

// Use these credentials in the login form at /login.html for admin access
// or /customer-login.html for customer access

module.exports = {
    ADMIN_CREDENTIALS,
    CUSTOMER_CREDENTIALS
};

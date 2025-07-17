# Test Customer Login System

## Overview
The Kirra's Nail Studio application now includes a test customer login system that allows for testing customer-specific functionality separate from admin access.

## Test Accounts

### Admin Account
- **Phone:** (317) 432-3276 
- **Password:** Admin123!
- **Access:** Full admin dashboard with all management features
- **Login URL:** [http://localhost:3000/login.html](http://localhost:3000/login.html)

### Customer Account
- **Phone:** (555) 555-1234
- **Password:** Test123!
- **Access:** Customer view (currently redirects to main page)
- **Login URL:** [http://localhost:3000/customer-login.html](http://localhost:3000/customer-login.html)

## Features

### Customer Login Page
- **Dedicated Interface:** Separate login page specifically for customers
- **Test Credentials Display:** Visible test credentials that auto-fill when clicked
- **Two-Factor Authentication:** Same SMS verification system as admin
- **Navigation Links:** Easy switching between customer and admin login
- **Responsive Design:** Matches the application's purple/pink theme

### Authentication Flow
1. Enter phone number and password
2. Receive SMS verification code (displayed in server console for testing)
3. Enter 6-digit verification code
4. Successful login stores customer role in localStorage
5. Redirects to main dashboard

### Quick Access
- **Main Page:** Login buttons in header for both customer and admin access
- **Auto-Fill:** Click on test credentials section to automatically fill login form

## Usage Instructions

### For Testing Customer Login:
1. Visit [http://localhost:3000/customer-login.html](http://localhost:3000/customer-login.html)
2. Click on the test credentials section to auto-fill
3. Click "Login" button
4. Check server console for the 6-digit verification code
5. Enter the verification code
6. Login successful - redirected to main page

### For Testing Admin Login:
1. Visit [http://localhost:3000/login.html](http://localhost:3000/login.html)
2. Use credentials: (317) 432-3276 / Admin123!
3. Follow same verification process
4. Access full admin dashboard

## Technical Implementation

### Files Added/Modified:
- **customer-login.html** - Customer-specific login page
- **customer-login-script.js** - Customer login functionality
- **login-styles.css** - Enhanced with customer login styling
- **server.js** - Added test customer account
- **index.html** - Added header login buttons
- **styles.css** - Updated header layout and login button styles

### Authentication System:
- **Same Backend:** Uses existing `/api/auth/*` endpoints
- **Role Detection:** Stores user role in localStorage
- **Session Management:** Same token-based authentication
- **SMS Simulation:** Verification codes displayed in server console

## Next Steps

### Potential Enhancements:
1. **Customer Dashboard:** Create dedicated customer interface showing:
   - Personal appointment history
   - Booking calendar
   - Payment history
   - Profile management
   
2. **Role-Based UI:** Modify main page to show different content based on user role
3. **Customer Features:** 
   - Online booking system
   - Service catalog
   - Gallery viewing
   - Direct messaging with salon

### Security Considerations:
- Test credentials should be removed in production
- Implement proper password hashing
- Add rate limiting for login attempts
- Use real SMS service for verification

## Testing Checklist

- ✅ Customer login page loads correctly
- ✅ Test credentials auto-fill functionality works
- ✅ Phone number formatting works
- ✅ Password validation enforced
- ✅ SMS verification code generation
- ✅ Two-factor authentication flow
- ✅ Successful login and redirection
- ✅ Role storage in localStorage
- ✅ Navigation between customer and admin login
- ✅ Responsive design on mobile devices

## Support
For issues or questions about the test customer login system, check the server console for verification codes and ensure the Node.js server is running on port 3000.

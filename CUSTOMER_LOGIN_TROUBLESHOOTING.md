# Customer Login Troubleshooting Guide

## Test Customer Credentials
- **Phone:** (555) 555-1234 → Clean: 5555551234
- **Password:** Test123!

## Troubleshooting Steps

### 1. Check Server Status
Make sure the Node.js server is running:
```bash
node server.js
```
Server should start on port 3000 and show initialization messages.

### 2. Test Direct Credentials
Visit: `http://localhost:3000/test-login.html`
This will test the credentials directly without the UI.

### 3. Check Browser Console
1. Open customer login page: `http://localhost:3000/customer-login.html`
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Click "Test Login (Debug)" button
5. Check console for debug messages

### 4. Check Server Console
When attempting login, server console should show:
```
=== LOGIN ATTEMPT ===
Received phone: 5555551234
Received password: Test123!
Found user: { name: 'Test Customer', phone: '5555551234', role: 'customer' }
Password match: true
Authentication successful for: Test Customer
```

### 5. Auto-Fill Test
1. Click on the test credentials box on customer login page
2. Credentials should auto-fill in the form
3. Phone field should show: (555) 555-1234
4. Password field should show: Test123!

### 6. Manual Entry Test
1. Manually type: (555) 555-1234 in phone field
2. Manually type: Test123! in password field
3. Click Login button
4. Check browser console for debug output

## Common Issues

### Phone Number Formatting
- Input: "(555) 555-1234"
- Should clean to: "5555551234"
- Must match server user phone exactly

### Password Requirements
- Must be at least 8 characters
- Must contain 1 uppercase letter
- Must contain 1 special character
- "Test123!" meets all requirements

### Network Issues
- Check if server is running on port 3000
- Check for CORS errors in browser console
- Verify fetch request is reaching server

### Server-Side Issues
- Check if users array contains customer account
- Verify password matching logic
- Check for typos in phone number storage

## Debug Information

### Expected Server Users Array:
```javascript
[
  {
    id: 'admin',
    phone: '3174323276',
    password: 'Admin123!',
    name: 'Kirra Admin',
    role: 'admin'
  },
  {
    id: 'customer1',
    phone: '5555551234',
    password: 'Test123!',
    name: 'Test Customer',
    role: 'customer'
  }
]
```

### Expected Login Flow:
1. Enter credentials → Clean phone number
2. Validate requirements → Send to server
3. Server finds user → Generates verification code
4. Code sent (simulated) → User enters code
5. Verification successful → Redirect to main page

## Testing Commands

Run credential test:
```bash
node test-credentials.js
```

Check if credentials work:
```javascript
// In browser console on customer-login.html page
testDirectLogin()
```

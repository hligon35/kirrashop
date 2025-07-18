# Testing Guide for Kirra's Nail Studio

This document provides a comprehensive guide for testing the Kirra's Nail Studio application.

## Getting Started

1. Follow the setup instructions in the main README.md file.
2. Use the provided test credentials from test-credentials.js.

## Key Features to Test

### 1. Authentication

#### Admin Login
- Navigate to http://localhost:3000/login.html
- Enter phone number: 123-456-7890
- Enter password: admin123
- Verify you receive a verification code page
- Enter verification code: 123456
- Verify you are redirected to the admin dashboard

#### Customer Login
- Navigate to http://localhost:3000/customer-login.html
- Enter phone number: 987-654-3210
- Verify you receive a verification code page
- Enter verification code: 123456
- Verify you are redirected to the customer portal

### 2. Image Gallery

- After logging in, check that the vertical image sliders on both sides of the login page are working.
- Verify that images scroll smoothly in opposite directions.
- Hover over images to ensure they pause and show hover effects.
- Click on an image to verify the modal popup works and shows a larger version.
- Close the modal by clicking the X or pressing ESC.

### 3. Admin Dashboard

- Verify all tabs work: Appointments, Payments, Customers, Gallery, Social, Settings.
- Try adding a new appointment.
- Check that the appointment calendar displays correctly.
- Verify financial summaries are displayed.

### 4. Customer Portal

- Check that customers can view their appointment history.
- Verify they can request new appointments.
- Test the appointment time slot selection.

### 5. Mobile Responsiveness

- Test the application on various screen sizes by resizing your browser window.
- Verify that the layout adjusts appropriately.
- Check that the vertical sliders hide on mobile screens as expected.

## Known Issues

- The slider animation may appear slightly choppy on older devices.
- Some browsers may require a refresh for the login verification to work properly.

## Reporting Issues

If you encounter any issues while testing, please report them with the following information:
- Browser type and version
- Operating system
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

## Contact

For any questions or assistance, please contact: [Your Email or Contact Information]

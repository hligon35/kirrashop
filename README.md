# Kirra's Nail Studio

A full-stack nail tech business management application for managing appointments, payments, customers, gallery, and more.

## Features

- User authentication with two-factor verification
- Appointment management
- Payment processing and reminders
- Customer management
- Financial tracking
- Promotional code management
- Gallery for photos and videos
- Social media integration
- Chat system
- Mobile-responsive dashboard

## Architecture

The application has been modularized using the MVC (Model-View-Controller) architecture:

- **Models**: In-memory data storage (would be replaced with databases in production)
- **Controllers**: Business logic for each feature
- **Routes**: API endpoints for each feature
- **Middlewares**: Authentication, file uploads, etc.
- **Utils**: Helper functions and utilities
- **Config**: Application configuration

## Directory Structure

```
├── public/                  # Static frontend files
├── uploads/                 # Uploaded files (photos, videos)
├── src/
│   ├── config/              # Application configuration
│   ├── controllers/         # Business logic
│   ├── middlewares/         # Middleware functions
│   ├── models/              # Data models
│   ├── routes/              # API routes
│   └── utils/               # Utility functions
└── server.js                # Main application entry point
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. Development mode:
   ```
   npm run dev
   ```

## API Documentation

The application provides the following API endpoints:

- **Authentication**: `/api/auth/*`
- **Appointments**: `/api/appointments/*`
- **Payments**: `/api/payments/*`
- **Customers**: `/api/customers/*`
- **Finances**: `/api/finances/*`
- **Promo Codes**: `/api/promo-codes/*`
- **Communications**: `/api/communications/*`
- **Gallery**: `/api/gallery/*`
- **Chat**: `/chats/*`

## Testing Credentials

- **Admin**: 
  - Phone: `3174323276`
  - Password: `Admin123!`

- **Customer**: 
  - Phone: `5555551234`
  - Password: `Test123!`

- **Alternative Customer**: 
  - Phone: `1234567890`
  - Password: `Test123!`

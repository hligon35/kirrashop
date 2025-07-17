# Kirra's Nail Studio - Business Management System

A comprehensive web-based business management system for Kirra's Nail Studio, featuring appointment scheduling, customer management, financial tracking, and more.

## Features

### 🔐 Authentication System
- Phone number and password login
- 2FA SMS verification
- Enhanced password requirements (8+ characters, uppercase, special character)
- Session management

### 📅 Appointment Management
- Schedule new appointments
- Service type selection (Manicure, Pedicure, Gel Nails, Acrylic Set, Custom Nail Art, Mushroom Special)
- Client contact information management
- Special requests and notes

### 💰 Financial Dashboard
- Revenue tracking
- Expense management
- Net balance calculation
- Transaction history

### 👥 Customer Management
- Customer database
- Contact information
- Service history

### 🎯 Promotional Tools
- Promo code creation
- Discount management
- Expiry date tracking

### 📸 Gallery Management
- Photo and video uploads
- Social media integration options
- Media categorization

### 💬 Communications
- Customer messaging system
- Appointment reminders
- Promotional notifications

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **File Upload**: Multer
- **Authentication**: Custom session-based system
- **Styling**: Custom CSS with Font Awesome icons

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/hligon35/kirrashop.git
   cd kirrashop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   - Main Dashboard: `http://localhost:3000`
   - Login Page: `http://localhost:3000/login`

## Default Test Credentials

- **Phone Number**: `3174323276`
- **Password**: `Admin123!`

## File Structure

```
kirrashop/
├── public/                 # Frontend files
│   ├── images/            # Image gallery
│   ├── index.html         # Main dashboard
│   ├── login.html         # Login page
│   ├── login-script.js    # Login functionality
│   ├── login-styles.css   # Login styling
│   ├── script.js          # Main dashboard functionality
│   └── styles.css         # Main dashboard styling
├── server.js              # Express server and API endpoints
├── package.json           # Project dependencies
└── README.md             # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-2fa` - 2FA verification
- `POST /api/auth/logout` - User logout

### Business Operations
- `GET /api/appointments` - Get appointments
- `GET /api/customers` - Get customers
- `GET /api/finances` - Get financial data
- `GET /api/promo-codes` - Get promo codes
- `GET /api/communications` - Get communications

### Gallery
- `GET /api/gallery/photos` - Get photos
- `GET /api/gallery/videos` - Get videos
- `POST /api/gallery/upload` - Upload media

## Contributing

This is a private business management system for Kirra's Nail Studio. If you need to make changes or report issues, please contact the development team.

## License

Private - All rights reserved.

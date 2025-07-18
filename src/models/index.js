/**
 * In-memory database models
 * In a production environment, these would be replaced with actual database models
 */

// In-memory storage collections
const collections = {
  appointments: [],
  customers: [],
  finances: { revenue: 0, expenses: 0, balance: 0 },
  promoCodes: [],
  communications: [],
  galleryPhotos: [],
  galleryVideos: [],
  payments: [],
  chats: [],
  messages: [],
  paymentIntegrations: {
    applePay: { connected: false, merchantId: '' },
    cashApp: { connected: false, handle: '' },
    venmo: { connected: false, username: '' }
  },
  paymentSettings: {
    autoReminders: false,
    reminderFrequency: 7,
    paymentDueDays: 7
  },
  // Default users with test credentials
  users: [
    {
      id: 'admin',
      phone: '3174323276', // Admin test phone: (317) 432-3276
      password: 'Admin123!',  // Default admin password - contains uppercase and special character
      name: 'Kirra Admin',
      role: 'admin'
    },
    {
      id: 'customer1',
      phone: '5555551234', // Customer test phone: (555) 555-1234
      password: 'Test123!',   // Customer test password - contains uppercase and special character
      name: 'Test Customer',
      role: 'customer'
    },
    {
      id: 'customer_test',
      phone: '1234567890', // Fallback test phone: 1234567890
      password: 'Test123!',   // Same password
      name: 'Fallback Test Customer',
      role: 'customer'
    }
  ],
  activeSessions: new Map(), // sessionToken -> {phone, expiry, verified}
  verificationCodes: new Map() // phone -> {code, expiry, attempts}
};

// Export collections
module.exports = collections;

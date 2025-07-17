// Test Customer Login Credentials
console.log('=== CUSTOMER LOGIN TEST CREDENTIALS ===');
console.log('Phone: (555) 555-1234');
console.log('Cleaned Phone: 5555551234');
console.log('Password: Test123!');
console.log('');
console.log('Server User Array:');
const users = [
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
];

console.log(JSON.stringify(users, null, 2));

// Test phone cleaning
const testPhone = '(555) 555-1234';
const cleanPhone = testPhone.replace(/\D/g, '');
console.log('');
console.log('Phone Cleaning Test:');
console.log('Input:', testPhone);
console.log('Output:', cleanPhone);
console.log('Match:', cleanPhone === '5555551234');

// Test user lookup
const user = users.find(u => u.phone === cleanPhone);
console.log('');
console.log('User Lookup Test:');
console.log('Found User:', user ? user.name : 'NOT FOUND');
console.log('Password Match:', user && user.password === 'Test123!');

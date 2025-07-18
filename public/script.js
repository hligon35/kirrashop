// Authentication check
function checkAuthentication() {
    const authToken = localStorage.getItem('authToken');
    const userToken = localStorage.getItem('userToken');
    
    // Support both authentication methods (old and new)
    if (!authToken && !userToken) {
        // No authentication found - don't redirect, just show login buttons
        console.log('No authentication found - allowing access to public areas');
        return false;
    }
    
    // If we have userToken from the new auth system, consider it valid
    if (userToken) {
        console.log('User authenticated with new auth system');
        return true;
    }
    
    // Legacy token verification with server
    if (authToken) {
        fetch('/api/auth/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.valid) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userPhone');
                // Don't redirect, just show login buttons
            }
        })
        .catch(error => {
            console.error('Auth verification error:', error);
            // Don't redirect on error, just show login buttons
        });
    }
    
    return true;
}

function redirectToLogin() {
    window.location.href = '/login.html';
}

function logout() {
    // Handle both old and new authentication methods
    const authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
    }
    
    // Clear all authentication tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    
    // Show success message and reload page
    alert('You have been logged out successfully');
    window.location.reload();
}

// API Base URL
const API_BASE = '/api';

// Authenticated fetch helper
function authenticatedFetch(url, options = {}) {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        redirectToLogin();
        return Promise.reject(new Error('No auth token'));
    }
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...options.headers
        }
    };
    
    return fetch(url, { ...options, ...defaultOptions })
        .then(response => {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('authToken');
                localStorage.removeItem('userPhone');
                redirectToLogin();
                throw new Error('Authentication expired');
            }
            return response;
        });
}

// Global state
let currentTab = 'appointments';
let appointments = [];
let customers = [];
let finances = { revenue: 0, expenses: 0, balance: 0 };
let promoCodes = [];
let payments = [];
let paymentIntegrations = {
    applePay: { connected: false, merchantId: '' },
    cashApp: { connected: false, handle: '' },
    venmo: { connected: false, username: '' }
};
let paymentSettings = {
    autoReminders: false,
    reminderFrequency: 7,
    paymentDueDays: 7
};

// Chat system storage
let chats = [];
let currentChatId = null;
let messages = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuthentication()) {
        return; // Will redirect to login if not authenticated
    }
    
    // Initialize theme first
    initializeTheme();
    
    initializeEventListeners();
    loadAllData();
    loadGalleryImages();
    
    // Make functions globally accessible for onclick handlers
    window.deleteAppointment = deleteAppointment;
    window.editAppointment = editAppointment;
    window.deleteCustomer = deleteCustomer;
    
    // Test that JavaScript is working
    console.log('JavaScript loaded successfully');
    window.editCustomer = editCustomer;
    window.showAddAppointment = showAddAppointment;
    window.showAddCustomer = showAddCustomer;
    window.showAddPromo = showAddPromo;
    window.showSendPromo = showSendPromo;
    window.showAddMedia = showAddMedia;
    window.closeModal = closeModal;
    window.selectMediaType = selectMediaType;
    window.selectMediaSource = selectMediaSource;
    window.toggleExpiryOptions = toggleExpiryOptions;
    window.toggleCustomerSelection = toggleCustomerSelection;
    window.toggleRecipientOptions = toggleRecipientOptions;
    window.toggleTheme = toggleTheme;
    
    // Payment management functions
    window.showPaymentModal = showPaymentModal;
    window.confirmPayment = confirmPayment;
    window.sendPaymentReminder = sendPaymentReminder;
    window.sendPaymentReminders = sendPaymentReminders;
    window.showPaymentIntegrations = showPaymentIntegrations;
    window.setupApplePay = setupApplePay;
    window.setupCashApp = setupCashApp;
    window.setupVenmo = setupVenmo;
    window.filterPayments = filterPayments;
    window.updateServicePrice = updateServicePrice;
    
    // Chat system functions
    window.startNewChat = startNewChat;
    window.createNewChat = createNewChat;
    window.selectChat = selectChat;
    window.sendMessage = sendMessage;
    window.searchChats = searchChats;
    window.showChatDetails = showChatDetails;
    window.attachFile = attachFile;
});

// Theme Toggle Function
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    body.classList.toggle('dark-theme');
    
    // Update icon
    if (body.classList.contains('dark-theme')) {
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// Initialize theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        themeIcon.className = 'fas fa-sun';
    } else {
        body.classList.remove('dark-theme');
        themeIcon.className = 'fas fa-moon';
    }
}

// Event Listeners
function initializeEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Forms
    document.getElementById('appointmentForm').addEventListener('submit', handleAppointmentSubmit);
    document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
    document.getElementById('promoForm').addEventListener('submit', (e) => {
        const editId = e.target.getAttribute('data-edit-id');
        if (editId) {
            handlePromoEdit(e, editId);
        } else {
            handlePromoSubmit(e);
        }
    });
    document.getElementById('sendPromoForm').addEventListener('submit', handleSendPromoSubmit);
    document.getElementById('customerForm').addEventListener('submit', handleCustomerSubmit);
    
    // Payment form
    if (document.getElementById('paymentForm')) {
        document.getElementById('paymentForm').addEventListener('submit', confirmPayment);
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Tab Management
function switchTab(tabName) {
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    currentTab = tabName;
}

// API Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Handle responses with no content (like DELETE operations)
        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return {};
        }
        
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        
        return {};
    } catch (error) {
        console.error('API call failed:', error);
        showMessage('API call failed: ' + error.message, 'error');
        return null;
    }
}

// Load all data
async function loadAllData() {
    await Promise.all([
        loadAppointments(),
        loadCustomers(),
        loadFinances(),
        loadPromoCodes(),
        loadPayments(),
        loadPaymentSettings(),
        loadChats()
    ]);
}

// Appointments
async function loadAppointments() {
    const data = await apiCall('/appointments');
    if (data) {
        appointments = data;
        renderAppointments();
    }
}

function renderAppointments() {
    const container = document.getElementById('appointmentsList');
    
    if (appointments.length === 0) {
        container.innerHTML = `
            <div class="appointment-card">
                <h3>No appointments scheduled</h3>
                <p>Ready to book your first magical nail session!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = appointments.map(apt => {
        const paymentStatusClass = apt.paymentStatus || 'pending';
        const paymentStatusText = {
            'pending': 'Payment Pending',
            'partial': 'Partial Payment',
            'paid': 'Fully Paid',
            'overdue': 'Payment Overdue'
        }[paymentStatusClass] || 'Payment Pending';
        
        const servicePrice = apt.servicePrice || 0;
        const amountPaid = apt.amountPaid || 0;
        const balanceDue = servicePrice - amountPaid;
        
        return `
        <div class="appointment-card">
            <h3><i class="fas fa-user"></i> ${apt.clientName}</h3>
            <p><i class="fas fa-calendar"></i> ${apt.appointmentDate} at ${apt.appointmentTime}</p>
            <p><i class="fas fa-spa"></i> ${apt.serviceType}</p>
            <p><i class="fas fa-phone"></i> ${apt.clientPhone || 'No phone'}</p>
            <p><i class="fas fa-envelope"></i> ${apt.clientEmail || 'No email'}</p>
            ${apt.notes ? `<p><i class="fas fa-sticky-note"></i> ${apt.notes}</p>` : ''}
            
            <!-- Payment Information -->
            <div class="payment-summary">
                <div class="payment-row">
                    <span>Service Price:</span>
                    <span class="price">$${servicePrice.toFixed(2)}</span>
                </div>
                ${amountPaid > 0 ? `
                <div class="payment-row">
                    <span>Amount Paid:</span>
                    <span class="paid">$${amountPaid.toFixed(2)}</span>
                </div>` : ''}
                ${balanceDue > 0 ? `
                <div class="payment-row">
                    <span>Balance Due:</span>
                    <span class="due">$${balanceDue.toFixed(2)}</span>
                </div>` : ''}
                <div class="payment-status ${paymentStatusClass}">
                    <i class="fas fa-${paymentStatusClass === 'paid' ? 'check-circle' : paymentStatusClass === 'overdue' ? 'exclamation-triangle' : 'clock'}"></i>
                    ${paymentStatusText}
                </div>
            </div>
            
            <div style="margin-top: 15px;">
                <button class="btn" onclick="editAppointment('${apt.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-success" onclick="showPaymentModal('${apt.id}')">
                    <i class="fas fa-credit-card"></i> Payment
                </button>
                <button class="btn btn-danger" onclick="deleteAppointment('${apt.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
        `;
    }).join('');
}

async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const editId = form.getAttribute('data-edit-id');
    
    const formData = {
        clientName: document.getElementById('clientName').value,
        clientEmail: document.getElementById('clientEmail').value,
        clientPhone: document.getElementById('clientPhone').value,
        appointmentDate: document.getElementById('appointmentDate').value,
        appointmentTime: document.getElementById('appointmentTime').value,
        serviceType: document.getElementById('serviceType').value,
        notes: document.getElementById('notes').value,
        // Payment information
        servicePrice: parseFloat(document.getElementById('servicePrice').value) || 0,
        paymentStatus: document.getElementById('paymentStatus').value,
        amountPaid: parseFloat(document.getElementById('amountPaid').value) || 0,
        paymentMethod: document.getElementById('paymentMethod').value,
        paymentReference: document.getElementById('paymentReference').value,
        paymentNotes: document.getElementById('paymentNotes').value
    };

    let result;
    if (editId) {
        // Update existing appointment
        result = await apiCall(`/appointments/${editId}`, 'PUT', formData);
        if (result) {
            showMessage('Appointment updated successfully!', 'success');
        }
    } else {
        // Create new appointment
        result = await apiCall('/appointments', 'POST', formData);
        if (result) {
            showMessage('Appointment booked successfully!', 'success');
        }
    }
    
    if (result) {
        closeModal('appointmentModal');
        resetAppointmentForm();
        await loadAppointments();
    }
}

function resetAppointmentForm() {
    const form = document.getElementById('appointmentForm');
    form.removeAttribute('data-edit-id');
    form.reset();
    
    // Reset modal title and button text
    document.querySelector('#appointmentModal h3').textContent = 'Schedule New Appointment';
    document.querySelector('#appointmentForm button[type="submit"]').textContent = 'Book Appointment';
}

async function deleteAppointment(id) {
    console.log('Deleting appointment with ID:', id);
    
    if (confirm('Are you sure you want to delete this appointment?')) {
        try {
            const result = await apiCall(`/appointments/${id}`, 'DELETE');
            console.log('Delete result:', result);
            if (result !== null) {
                showMessage('Appointment deleted successfully', 'success');
                await loadAppointments();
            } else {
                console.error('Delete failed - result was null');
                showMessage('Delete failed - no response from server', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showMessage('Delete failed: ' + error.message, 'error');
        }
    }
}

async function editAppointment(id) {
    const appointment = appointments.find(apt => apt.id === id);
    if (!appointment) {
        showMessage('Appointment not found', 'error');
        return;
    }
    
    // Populate the form with existing appointment data
    document.getElementById('clientName').value = appointment.clientName || '';
    document.getElementById('clientEmail').value = appointment.clientEmail || '';
    document.getElementById('clientPhone').value = appointment.clientPhone || '';
    document.getElementById('appointmentDate').value = appointment.appointmentDate || '';
    document.getElementById('appointmentTime').value = appointment.appointmentTime || '';
    document.getElementById('serviceType').value = appointment.serviceType || '';
    document.getElementById('notes').value = appointment.notes || '';
    
    // Set the form to edit mode
    const form = document.getElementById('appointmentForm');
    form.setAttribute('data-edit-id', id);
    
    // Update modal title and button text
    document.querySelector('#appointmentModal h3').textContent = 'Edit Appointment';
    document.querySelector('#appointmentForm button[type="submit"]').textContent = 'Update Appointment';
    
    // Show the modal
    document.getElementById('appointmentModal').style.display = 'block';
}

// Finances
async function loadFinances() {
    const data = await apiCall('/finances');
    if (data) {
        finances = data;
        renderFinances();
    }
}

function renderFinances() {
    document.getElementById('totalRevenue').textContent = `$${finances.revenue.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${finances.expenses.toFixed(2)}`;
    document.getElementById('netBalance').textContent = `$${finances.balance.toFixed(2)}`;
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = {
        type: document.getElementById('transactionType').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        description: document.getElementById('transactionDescription').value
    };

    const result = await apiCall('/finances/transaction', 'POST', formData);
    if (result) {
        showMessage('Transaction added successfully!', 'success');
        document.getElementById('transactionForm').reset();
        await loadFinances();
    }
}

// Customers
async function loadCustomers() {
    const data = await apiCall('/customers');
    if (data) {
        customers = data;
        renderCustomers();
    }
}

function renderCustomers() {
    const container = document.getElementById('customersList');
    
    if (customers.length === 0) {
        container.innerHTML = `
            <div class="customer-card">
                <h3>No customers yet</h3>
                <p>Your nail art family is waiting to grow!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = customers.map(customer => `
        <div class="customer-card">
            <h3><i class="fas fa-user-circle"></i> ${customer.name}</h3>
            <p><i class="fas fa-envelope"></i> ${customer.email}</p>
            <p><i class="fas fa-phone"></i> ${customer.phone || 'No phone'}</p>
            <p><i class="fas fa-calendar-plus"></i> Joined: ${new Date(customer.createdAt).toLocaleDateString()}</p>
            
            <div style="margin-top: 15px;">
                <button class="btn" onclick="editCustomer('${customer.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteCustomer('${customer.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function handleCustomerSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const editId = form.getAttribute('data-edit-id');
    
    const formData = {
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value
    };

    let result;
    if (editId) {
        // Update existing customer
        result = await apiCall(`/customers/${editId}`, 'PUT', formData);
        if (result) {
            showMessage('Customer updated successfully!', 'success');
        }
    } else {
        // Create new customer
        result = await apiCall('/customers', 'POST', formData);
        if (result) {
            showMessage('Customer added successfully!', 'success');
        }
    }
    
    if (result) {
        closeModal('customerModal');
        resetCustomerForm();
        await loadCustomers();
    }
}

async function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        showMessage('Customer not found', 'error');
        return;
    }
    
    // Populate the form with existing customer data
    document.getElementById('customerName').value = customer.name || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerPhone').value = customer.phone || '';
    
    // Set the form to edit mode
    const form = document.getElementById('customerForm');
    form.setAttribute('data-edit-id', id);
    
    // Update modal title and button text
    document.querySelector('#customerModal h3').textContent = 'Edit Customer';
    document.querySelector('#customerForm button[type="submit"]').textContent = 'Update Customer';
    
    // Show the modal
    document.getElementById('customerModal').style.display = 'block';
}

async function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        const result = await apiCall(`/customers/${id}`, 'DELETE');
        if (result !== null) {
            showMessage('Customer deleted successfully', 'success');
            await loadCustomers();
        }
    }
}

function resetCustomerForm() {
    const form = document.getElementById('customerForm');
    form.removeAttribute('data-edit-id');
    form.reset();
    
    // Reset modal title and button text
    document.querySelector('#customerModal h3').textContent = 'Add New Customer';
    document.querySelector('#customerForm button[type="submit"]').textContent = 'Add Customer';
}

// Promo Codes
async function loadPromoCodes() {
    const data = await apiCall('/promo-codes');
    if (data) {
        promoCodes = data;
        renderPromoCodes();
    }
}

function renderPromoCodes() {
    const container = document.getElementById('promosList');
    
    if (promoCodes.length === 0) {
        container.innerHTML = `
            <div class="promo-card">
                <h3>No promo codes created</h3>
                <p>Create special offers to attract customers!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = promoCodes.map(promo => {
        const isExpired = promo.expiryDate && new Date(promo.expiryDate) < new Date();
        const isPermanent = !promo.expiryDate || promo.expiryDate === '';
        const statusClass = isExpired ? 'expired' : (promo.isActive ? 'active' : 'inactive');
        
        return `
            <div class="promo-card ${statusClass}">
                <div class="promo-header">
                    <h3><i class="fas fa-tag"></i> ${promo.promoCode}</h3>
                    <span class="promo-status ${statusClass}">
                        ${isExpired ? 'Expired' : (promo.isActive ? 'Active' : 'Inactive')}
                    </span>
                </div>
                <p><i class="fas fa-percentage"></i> ${promo.discountPercent}% off</p>
                ${isPermanent ? 
                    '<p><i class="fas fa-infinity"></i> Permanent Code</p>' : 
                    `<p><i class="fas fa-calendar-times"></i> Expires: ${new Date(promo.expiryDate).toLocaleDateString()}</p>`
                }
                <p><i class="fas fa-users"></i> Used: ${promo.used || 0} times</p>
                ${promo.specificCustomer ? `<p><i class="fas fa-user"></i> Customer Specific</p>` : ''}
                ${promo.promoDescription ? `<p><i class="fas fa-info-circle"></i> ${promo.promoDescription}</p>` : ''}
                
                <div class="promo-actions">
                    <button class="btn btn-small" onclick="editPromo('${promo.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="sendSpecificPromo('${promo.id}')">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deletePromo('${promo.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="btn btn-small ${promo.isActive ? 'btn-warning' : 'btn-success'}" onclick="togglePromoStatus('${promo.id}')">
                        <i class="fas fa-${promo.isActive ? 'pause' : 'play'}"></i> 
                        ${promo.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function handlePromoEdit(e, editId) {
    e.preventDefault();
    
    const expiryType = document.getElementById('expiryType').value;
    const customerSpecific = document.getElementById('customerSpecific').value;
    
    const formData = {
        promoCode: document.getElementById('promoCode').value.toUpperCase(),
        discountPercent: parseInt(document.getElementById('discountPercent').value),
        expiryDate: expiryType === 'permanent' ? null : document.getElementById('expiryDate').value,
        promoDescription: document.getElementById('promoDescription').value,
        isPermanent: expiryType === 'permanent',
        specificCustomer: customerSpecific === 'specific' ? document.getElementById('specificCustomer').value : null
    };

    const result = await apiCall(`/promo-codes/${editId}`, 'PUT', formData);
    if (result) {
        showMessage('Promo code updated successfully!', 'success');
        closeModal('promoModal');
        resetPromoFormAfterEdit();
        await loadPromoCodes();
    }
}

function resetPromoFormAfterEdit() {
    const form = document.getElementById('promoForm');
    form.removeAttribute('data-edit-id');
    form.reset();
    document.querySelector('#promoModal h3').textContent = 'Create Promo Code';
    document.querySelector('#promoForm button[type="submit"]').textContent = 'Create Promo';
    resetPromoForm();
}

async function handlePromoSubmit(e) {
    e.preventDefault();
    
    const expiryType = document.getElementById('expiryType').value;
    const customerSpecific = document.getElementById('customerSpecific').value;
    
    const formData = {
        promoCode: document.getElementById('promoCode').value.toUpperCase(),
        discountPercent: parseInt(document.getElementById('discountPercent').value),
        expiryDate: expiryType === 'permanent' ? null : document.getElementById('expiryDate').value,
        promoDescription: document.getElementById('promoDescription').value,
        isPermanent: expiryType === 'permanent',
        specificCustomer: customerSpecific === 'specific' ? document.getElementById('specificCustomer').value : null
    };

    const result = await apiCall('/promo-codes', 'POST', formData);
    if (result) {
        showMessage('Promo code created successfully!', 'success');
        closeModal('promoModal');
        document.getElementById('promoForm').reset();
        resetPromoForm();
        await loadPromoCodes();
    }
}

// Enhanced Gallery Management
let galleryData = {
    photos: [],
    videos: []
};

async function loadGalleryImages() {
    try {
        const photosData = await apiCall('/gallery/photos');
        const videosData = await apiCall('/gallery/videos');
        
        galleryData.photos = photosData || [];
        galleryData.videos = videosData || [];
        
        renderPhotoGallery();
        renderVideoGallery();
    } catch (error) {
        console.error('Failed to load gallery:', error);
        // Fallback to legacy API if new endpoints fail
        try {
            const legacyData = await apiCall('/gallery/images');
            if (legacyData && legacyData.length > 0) {
                galleryData.photos = legacyData.map(filename => ({
                    id: filename,
                    filename: filename,
                    url: `/images/${filename}`,
                    caption: `Nail art showcase`,
                    uploadedAt: new Date().toISOString(),
                    socialPlatforms: []
                }));
                renderPhotoGallery();
            } else {
                renderEmptyGallery();
            }
        } catch (legacyError) {
            console.error('Legacy API also failed:', legacyError);
            renderEmptyGallery();
        }
    }
}

function renderPhotoGallery() {
    const container = document.getElementById('photoGallery');
    
    if (galleryData.photos.length > 0) {
        container.innerHTML = galleryData.photos.map(photo => `
            <div class="gallery-item" onclick="openMediaModal('${photo.url}', 'image')">
                <img src="${photo.url}" alt="${photo.caption || 'Nail Art'}" loading="lazy">
                <div class="media-overlay">📷</div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteMedia('photo', '${photo.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    } else {
        renderEmptyGallery();
    }
}

function renderVideoGallery() {
    const container = document.getElementById('videoGallery');
    
    if (galleryData.videos.length > 0) {
        container.innerHTML = galleryData.videos.map(video => `
            <div class="gallery-item" onclick="openMediaModal('${video.url}', 'video')">
                <video src="${video.url}" preload="metadata"></video>
                <div class="media-overlay">🎥</div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteMedia('video', '${video.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    } else {
        container.innerHTML = `
            <div class="gallery-item" style="background: var(--card-bg); display: flex; align-items: center; justify-content: center; flex-direction: column;">
                <i class="fas fa-video" style="font-size: 2rem; color: var(--accent-color); margin-bottom: 10px;"></i>
                <p>No videos yet</p>
            </div>
        `;
    }
}

function renderEmptyGallery() {
    const photoContainer = document.getElementById('photoGallery');
    const videoContainer = document.getElementById('videoGallery');
    
    photoContainer.innerHTML = `
        <div class="gallery-item" style="background: var(--card-bg); display: flex; align-items: center; justify-content: center; flex-direction: column;">
            <i class="fas fa-camera" style="font-size: 2rem; color: var(--accent-color); margin-bottom: 10px;"></i>
            <p>No photos yet</p>
        </div>
    `;
    
    videoContainer.innerHTML = `
        <div class="gallery-item" style="background: var(--card-bg); display: flex; align-items: center; justify-content: center; flex-direction: column;">
            <i class="fas fa-video" style="font-size: 2rem; color: var(--accent-color); margin-bottom: 10px;"></i>
            <p>No videos yet</p>
        </div>
    `;
}

function openMediaModal(mediaSrc, type) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    
    const mediaElement = type === 'video' 
        ? `<video src="${mediaSrc}" controls style="width: 100%; height: auto; border-radius: 10px;"></video>`
        : `<img src="${mediaSrc}" style="width: 100%; height: auto; border-radius: 10px;" alt="Media">`;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90%; max-height: 90%; padding: 20px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            ${mediaElement}
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Unified Media Upload Functions
let currentMediaType = 'photo';

function showAddMedia() {
    document.getElementById('mediaModal').style.display = 'block';
    resetMediaForm();
    selectMediaType('photo'); // Default to photo
}

function selectMediaType(type) {
    currentMediaType = type;
    
    // Update button states
    document.getElementById('photoTypeBtn').classList.toggle('active', type === 'photo');
    document.getElementById('videoTypeBtn').classList.toggle('active', type === 'video');
    
    // Update labels and placeholders
    const sourceLabel = document.getElementById('sourceLabel');
    const uploadBtn = document.getElementById('uploadBtn');
    const mediaInput = document.getElementById('mediaInput');
    const mediaPreview = document.getElementById('mediaPreview');
    
    if (type === 'photo') {
        sourceLabel.textContent = 'Photo Source:';
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Photo';
        mediaInput.setAttribute('accept', 'image/*');
        mediaPreview.classList.remove('video');
        mediaPreview.classList.add('empty');
        mediaPreview.innerHTML = '';
    } else {
        sourceLabel.textContent = 'Video Source:';
        uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Video';
        mediaInput.setAttribute('accept', 'video/*');
        mediaPreview.classList.add('video');
        mediaPreview.classList.add('empty');
        mediaPreview.innerHTML = '';
    }
}

function selectMediaSource(source) {
    const input = document.getElementById('mediaInput');
    
    if (source === 'camera') {
        input.setAttribute('capture', 'environment');
    } else {
        input.removeAttribute('capture');
    }
    
    input.click();
}

function previewMedia(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('mediaPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (currentMediaType === 'photo') {
                // Show cropping interface for images
                showImageCropper(e.target.result, file);
            } else {
                preview.innerHTML = `<video src="${e.target.result}" controls preload="metadata"></video>`;
                preview.classList.remove('empty');
            }
        };
        reader.readAsDataURL(file);
    }
}

// Image Cropping Functionality
let originalFile = null;
let croppedCanvas = null;

function showImageCropper(imageSrc, file) {
    originalFile = file;
    const preview = document.getElementById('mediaPreview');
    
    preview.innerHTML = `
        <div class="image-cropper">
            <div class="crop-container">
                <img id="cropImage" src="${imageSrc}" alt="Image to crop" style="max-width: 100%; max-height: 400px;">
                <div class="crop-overlay" id="cropOverlay">
                    <div class="crop-box" id="cropBox">
                        <div class="crop-handle top-left"></div>
                        <div class="crop-handle top-right"></div>
                        <div class="crop-handle bottom-left"></div>
                        <div class="crop-handle bottom-right"></div>
                    </div>
                </div>
            </div>
            <div class="crop-controls">
                <button type="button" class="btn btn-secondary" onclick="resetCrop()">
                    <i class="fas fa-undo"></i> Reset
                </button>
                <button type="button" class="btn btn-primary" onclick="applyCrop()">
                    <i class="fas fa-crop"></i> Apply Crop
                </button>
                <button type="button" class="btn btn-success" onclick="skipCrop()">
                    <i class="fas fa-check"></i> Skip Crop
                </button>
            </div>
        </div>
    `;
    
    preview.classList.remove('empty');
    initializeCropper();
}

function initializeCropper() {
    const cropBox = document.getElementById('cropBox');
    const cropContainer = document.querySelector('.crop-container');
    const image = document.getElementById('cropImage');
    
    // Wait for image to load
    image.onload = function() {
        const containerRect = cropContainer.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();
        
        // Set initial crop box to center 80% of image
        const boxWidth = imageRect.width * 0.8;
        const boxHeight = imageRect.height * 0.8;
        const left = (imageRect.width - boxWidth) / 2;
        const top = (imageRect.height - boxHeight) / 2;
        
        cropBox.style.left = left + 'px';
        cropBox.style.top = top + 'px';
        cropBox.style.width = boxWidth + 'px';
        cropBox.style.height = boxHeight + 'px';
        
        makeCropBoxDraggable();
    };
}

function makeCropBoxDraggable() {
    const cropBox = document.getElementById('cropBox');
    const image = document.getElementById('cropImage');
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    // Make crop box draggable
    cropBox.addEventListener('mousedown', function(e) {
        if (!e.target.classList.contains('crop-handle')) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(cropBox.style.left);
            startTop = parseInt(cropBox.style.top);
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const newLeft = startLeft + (e.clientX - startX);
            const newTop = startTop + (e.clientY - startY);
            
            // Keep within image bounds
            const imageRect = image.getBoundingClientRect();
            const containerRect = image.parentElement.getBoundingClientRect();
            const relativeImageRect = {
                left: imageRect.left - containerRect.left,
                top: imageRect.top - containerRect.top,
                width: imageRect.width,
                height: imageRect.height
            };
            
            const boxWidth = parseInt(cropBox.style.width);
            const boxHeight = parseInt(cropBox.style.height);
            
            const constrainedLeft = Math.max(relativeImageRect.left, 
                Math.min(newLeft, relativeImageRect.left + relativeImageRect.width - boxWidth));
            const constrainedTop = Math.max(relativeImageRect.top, 
                Math.min(newTop, relativeImageRect.top + relativeImageRect.height - boxHeight));
            
            cropBox.style.left = constrainedLeft + 'px';
            cropBox.style.top = constrainedTop + 'px';
        }
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
}

function resetCrop() {
    initializeCropper();
}

function applyCrop() {
    const image = document.getElementById('cropImage');
    const cropBox = document.getElementById('cropBox');
    const container = document.querySelector('.crop-container');
    
    // Get crop dimensions relative to the actual image
    const imageRect = image.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const cropRect = cropBox.getBoundingClientRect();
    
    // Calculate relative positions
    const scaleX = image.naturalWidth / imageRect.width;
    const scaleY = image.naturalHeight / imageRect.height;
    
    const cropX = (cropRect.left - imageRect.left) * scaleX;
    const cropY = (cropRect.top - imageRect.top) * scaleY;
    const cropWidth = cropRect.width * scaleX;
    const cropHeight = cropRect.height * scaleY;
    
    // Create canvas and crop image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    
    // Draw cropped image
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    
    // Store cropped canvas
    croppedCanvas = canvas;
    
    // Show preview of cropped image
    const preview = document.getElementById('mediaPreview');
    preview.innerHTML = `
        <div class="cropped-preview">
            <img src="${canvas.toDataURL()}" alt="Cropped Preview" style="max-width: 100%; max-height: 300px; border-radius: 10px;">
            <div class="crop-actions">
                <button type="button" class="btn btn-secondary" onclick="showImageCropper('${image.src}', originalFile)">
                    <i class="fas fa-edit"></i> Re-crop
                </button>
            </div>
        </div>
    `;
}

function skipCrop() {
    // Show original image without cropping
    const preview = document.getElementById('mediaPreview');
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Media Preview">`;
        preview.classList.remove('empty');
    };
    reader.readAsDataURL(originalFile);
    croppedCanvas = null;
}

async function addMedia(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('mediaInput');
    const caption = document.getElementById('mediaCaption').value;
    const socialPlatforms = getSocialMediaSelections();
    
    if (!fileInput.files[0]) {
        alert(`Please select a ${currentMediaType} first!`);
        return;
    }
    
    const formData = new FormData();
    
    // Check if we have a cropped image canvas
    const croppedCanvas = document.getElementById('croppedCanvas');
    if (croppedCanvas && currentMediaType === 'photo') {
        // Convert canvas to blob and use that instead of original file
        croppedCanvas.toBlob((blob) => {
            const croppedFile = new File([blob], fileInput.files[0].name, { type: 'image/jpeg' });
            formData.append(currentMediaType, croppedFile);
            formData.append('caption', caption);
            formData.append('socialPlatforms', JSON.stringify(socialPlatforms));
            uploadMedia(formData);
        }, 'image/jpeg', 0.9);
        return;
    } else {
        // Use original file
        formData.append(currentMediaType, fileInput.files[0]);
        formData.append('caption', caption);
        formData.append('socialPlatforms', JSON.stringify(socialPlatforms));
        uploadMedia(formData);
    }
}

async function uploadMedia(formData) {
    
async function uploadMedia(formData) {
    try {
        const endpoint = currentMediaType === 'photo' ? '/api/gallery/photos' : '/api/gallery/videos';
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const result = await response.json();
            
            if (currentMediaType === 'photo') {
                galleryData.photos.push(result);
                renderPhotoGallery();
            } else {
                galleryData.videos.push(result);
                renderVideoGallery();
            }
            
            closeModal('mediaModal');
            
            const socialPlatforms = JSON.parse(formData.get('socialPlatforms'));
            if (socialPlatforms.length > 0) {
                showSocialMediaSuccess(socialPlatforms);
            }
            
            showNotification(`${currentMediaType.charAt(0).toUpperCase() + currentMediaType.slice(1)} uploaded successfully!`, 'success');
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error(`Error uploading ${currentMediaType}:`, error);
        showNotification(`Failed to upload ${currentMediaType}`, 'error');
    }
}
}

// Helper Functions
function getSocialMediaSelections() {
    const platforms = [];
    
    if (document.getElementById('postInstagram').checked) platforms.push('instagram');
    if (document.getElementById('postTiktok').checked) platforms.push('tiktok');
    if (document.getElementById('postFacebook').checked) platforms.push('facebook');
    if (document.getElementById('postTwitter').checked) platforms.push('twitter');
    if (document.getElementById('postSnapchat').checked) platforms.push('snapchat');
    
    return platforms;
}

function resetMediaForm() {
    document.getElementById('mediaInput').value = '';
    document.getElementById('mediaCaption').value = '';
    document.getElementById('mediaPreview').innerHTML = '';
    document.getElementById('mediaPreview').className = 'media-preview empty';
    
    // Reset social media checkboxes
    document.getElementById('postInstagram').checked = true;
    document.getElementById('postTiktok').checked = false;
    document.getElementById('postFacebook').checked = false;
    document.getElementById('postTwitter').checked = false;
    document.getElementById('postSnapchat').checked = false;
}

// Photo Upload Functions (Legacy - keeping for backward compatibility)
function showAddPhoto() {
    showAddMedia();
    selectMediaType('photo');
}

function showAddVideo() {
    showAddMedia();
    selectMediaType('video');
}

function selectPhotoSource(source) {
    selectMediaSource(source);
}

function selectVideoSource(source) {
    selectMediaSource(source);
}

function previewPhoto(event) {
    previewMedia(event);
}

function previewVideo(event) {
    previewMedia(event);
}

async function addPhoto(event) {
    currentMediaType = 'photo';
    return addMedia(event);
}

async function addVideo(event) {
    currentMediaType = 'video';
    return addMedia(event);
}

function showSocialMediaSuccess(platforms) {
    const platformNames = platforms.map(p => {
        switch(p) {
            case 'instagram': return 'Instagram';
            case 'tiktok': return 'TikTok';
            case 'facebook': return 'Facebook';
            case 'twitter': return 'X (Twitter)';
            case 'snapchat': return 'Snapchat';
            default: return p;
        }
    }).join(', ');
    
    showNotification(`Posted to: ${platformNames}`, 'success');
}

async function deleteMedia(type, id) {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
        try {
            const response = await fetch(`/api/gallery/${type}s/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                if (type === 'photo') {
                    galleryData.photos = galleryData.photos.filter(p => p.id !== id);
                    renderPhotoGallery();
                } else {
                    galleryData.videos = galleryData.videos.filter(v => v.id !== id);
                    renderVideoGallery();
                }
                showNotification(`${type} deleted successfully!`, 'success');
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error(`Error deleting ${type}:`, error);
            showNotification(`Failed to delete ${type}`, 'error');
        }
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--accent-color)'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Modal Management
function showAddAppointment() {
    resetAppointmentForm();
    document.getElementById('appointmentModal').style.display = 'block';
}

function showAddCustomer() {
    resetCustomerForm();
    document.getElementById('customerModal').style.display = 'block';
}

function showAddPromo() {
    document.getElementById('promoModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Utility Functions
function showMessage(text, type = 'success') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Insert at top of active tab content
    const activeTab = document.querySelector('.tab-content.active');
    activeTab.insertBefore(message, activeTab.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Promo Code Management Functions
function showSendPromo() {
    populatePromoDropdowns();
    document.getElementById('sendPromoModal').style.display = 'block';
}

function toggleExpiryOptions() {
    const expiryType = document.getElementById('expiryType').value;
    const expiryDateGroup = document.getElementById('expiryDateGroup');
    
    if (expiryType === 'permanent') {
        expiryDateGroup.style.display = 'none';
        document.getElementById('expiryDate').required = false;
    } else {
        expiryDateGroup.style.display = 'block';
        document.getElementById('expiryDate').required = true;
    }
}

function toggleCustomerSelection() {
    const customerSpecific = document.getElementById('customerSpecific').value;
    const customerSelection = document.getElementById('customerSelection');
    
    if (customerSpecific === 'specific') {
        customerSelection.style.display = 'block';
        populateCustomerDropdown();
    } else {
        customerSelection.style.display = 'none';
    }
}

function toggleRecipientOptions() {
    const recipientType = document.getElementById('recipientType').value;
    const multiSelect = document.getElementById('customerMultiSelect');
    const singleSelect = document.getElementById('customerSingleSelect');
    
    multiSelect.style.display = 'none';
    singleSelect.style.display = 'none';
    
    if (recipientType === 'multiple') {
        multiSelect.style.display = 'block';
        populateCustomerCheckboxes();
    } else if (recipientType === 'single') {
        singleSelect.style.display = 'block';
        populateSingleCustomerDropdown();
    }
}

function populatePromoDropdowns() {
    // Populate promo code selector
    const promoSelect = document.getElementById('selectPromoCode');
    promoSelect.innerHTML = '<option value="">Choose a promo code...</option>';
    
    promoCodes.forEach(promo => {
        if (promo.isActive && (!promo.expiryDate || new Date(promo.expiryDate) > new Date())) {
            promoSelect.innerHTML += `<option value="${promo.id}">${promo.promoCode} (${promo.discountPercent}% off)</option>`;
        }
    });
}

function populateCustomerDropdown() {
    const customerSelect = document.getElementById('specificCustomer');
    customerSelect.innerHTML = '<option value="">Select a customer...</option>';
    
    customers.forEach(customer => {
        customerSelect.innerHTML += `<option value="${customer.id}">${customer.name} (${customer.email})</option>`;
    });
}

function populateCustomerCheckboxes() {
    const container = document.getElementById('customerCheckboxes');
    container.innerHTML = '';
    
    customers.forEach(customer => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'checkbox-item';
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="customer_${customer.id}" value="${customer.id}">
            <label for="customer_${customer.id}">${customer.name} (${customer.email})</label>
        `;
        container.appendChild(checkboxDiv);
    });
}

function populateSingleCustomerDropdown() {
    const customerSelect = document.getElementById('singleCustomer');
    customerSelect.innerHTML = '<option value="">Choose a customer...</option>';
    
    customers.forEach(customer => {
        customerSelect.innerHTML += `<option value="${customer.id}">${customer.name} (${customer.email})</option>`;
    });
}

function resetPromoForm() {
    document.getElementById('expiryType').value = 'date';
    document.getElementById('customerSpecific').value = 'general';
    toggleExpiryOptions();
    toggleCustomerSelection();
}

async function handleSendPromoSubmit(e) {
    e.preventDefault();
    
    const promoCodeId = document.getElementById('selectPromoCode').value;
    const recipientType = document.getElementById('recipientType').value;
    const messageText = document.getElementById('promoMessage').value;
    
    if (!promoCodeId) {
        showMessage('Please select a promo code', 'error');
        return;
    }
    
    let customerIds = 'all';
    
    if (recipientType === 'single') {
        const singleCustomer = document.getElementById('singleCustomer').value;
        if (!singleCustomer) {
            showMessage('Please select a customer', 'error');
            return;
        }
        customerIds = [singleCustomer];
    } else if (recipientType === 'multiple') {
        const checkboxes = document.querySelectorAll('#customerCheckboxes input[type="checkbox"]:checked');
        if (checkboxes.length === 0) {
            showMessage('Please select at least one customer', 'error');
            return;
        }
        customerIds = Array.from(checkboxes).map(cb => cb.value);
    }
    
    const result = await apiCall('/promo-codes/send', 'POST', {
        promoCodeId,
        customerIds,
        messageText
    });
    
    if (result) {
        showMessage(`Promo code sent to ${result.recipients} customers successfully!`, 'success');
        closeModal('sendPromoModal');
        document.getElementById('sendPromoForm').reset();
        toggleRecipientOptions();
        await loadCommunications();
    }
}

async function editPromo(id) {
    const promo = promoCodes.find(p => p.id === id);
    if (!promo) return;
    
    // Populate form with existing data
    document.getElementById('promoCode').value = promo.promoCode;
    document.getElementById('discountPercent').value = promo.discountPercent;
    document.getElementById('expiryType').value = promo.isPermanent ? 'permanent' : 'date';
    
    if (!promo.isPermanent && promo.expiryDate) {
        document.getElementById('expiryDate').value = promo.expiryDate;
    }
    
    document.getElementById('customerSpecific').value = promo.specificCustomer ? 'specific' : 'general';
    document.getElementById('promoDescription').value = promo.promoDescription || '';
    
    if (promo.specificCustomer) {
        populateCustomerDropdown();
        document.getElementById('specificCustomer').value = promo.specificCustomer;
    }
    
    toggleExpiryOptions();
    toggleCustomerSelection();
    
    // Change form to edit mode
    const form = document.getElementById('promoForm');
    form.setAttribute('data-edit-id', id);
    document.querySelector('#promoModal h3').textContent = 'Edit Promo Code';
    document.querySelector('#promoForm button[type="submit"]').textContent = 'Update Promo';
    
    document.getElementById('promoModal').style.display = 'block';
}

async function deletePromo(id) {
    if (confirm('Are you sure you want to delete this promo code?')) {
        const result = await apiCall(`/promo-codes/${id}`, 'DELETE');
        if (result !== null) {
            showMessage('Promo code deleted successfully', 'success');
            await loadPromoCodes();
        }
    }
}

async function togglePromoStatus(id) {
    const promo = promoCodes.find(p => p.id === id);
    if (!promo) return;
    
    const result = await apiCall(`/promo-codes/${id}`, 'PUT', {
        isActive: !promo.isActive
    });
    
    if (result) {
        showMessage(`Promo code ${result.isActive ? 'activated' : 'deactivated'} successfully`, 'success');
        await loadPromoCodes();
    }
}

async function sendSpecificPromo(promoId) {
    const promo = promoCodes.find(p => p.id === promoId);
    if (!promo) return;
    
    // Pre-select this promo code in the send modal
    document.getElementById('selectPromoCode').value = promoId;
    showSendPromo();
}

// Sample data initialization (remove in production)
function initializeSampleData() {
    // Add sample customers first
    const sampleCustomers = [
        {
            name: 'Sarah Johnson',
            email: 'sarah.johnson@email.com',
            phone: '(555) 123-4567'
        },
        {
            name: 'Mike Chen',
            email: 'mike.chen@email.com', 
            phone: '(555) 234-5678'
        },
        {
            name: 'Emma Wilson',
            email: 'emma.wilson@email.com',
            phone: '(555) 345-6789'
        },
        {
            name: 'David Brown',
            email: 'david.brown@email.com',
            phone: '(555) 456-7890'
        }
    ];

    // Create sample customers
    sampleCustomers.forEach(async (customer) => {
        await apiCall('/customers', 'POST', customer);
    });

    // Add some sample appointments
    const sampleAppointments = [
        {
            clientName: "Sarah Johnson",
            clientEmail: "sarah@example.com",
            clientPhone: "(555) 123-4567",
            appointmentDate: "2025-07-18",
            appointmentTime: "14:00",
            serviceType: "mushroom-design",
            notes: "Loves purple mushrooms!"
        },
        {
            clientName: "Mike Wilson",
            clientEmail: "mike@example.com",
            clientPhone: "(555) 987-6543",
            appointmentDate: "2025-07-20",
            appointmentTime: "11:00",
            serviceType: "gel",
            notes: "First time client"
        }
    ];

    // Create sample appointments
    sampleAppointments.forEach(async (apt) => {
        await apiCall('/appointments', 'POST', apt);
    });

    // Add sample transactions
    apiCall('/finances/transaction', 'POST', {
        type: 'revenue',
        amount: 70,
        description: 'Mushroom nail art - Sarah'
    });

    apiCall('/finances/transaction', 'POST', {
        type: 'revenue',
        amount: 45,
        description: 'Gel nails - Mike'
    });

    apiCall('/finances/transaction', 'POST', {
        type: 'expense',
        amount: 25,
        description: 'Nail supplies'
    });
}

// Call this once to populate sample data
initializeSampleData();

// Payment Management Functions
async function loadPayments() {
    const data = await apiCall('/payments');
    if (data) {
        payments = data;
        renderPayments();
        updatePaymentOverview();
    }
}

async function loadPaymentSettings() {
    const data = await apiCall('/payment-settings');
    if (data) {
        paymentSettings = data;
        paymentIntegrations = data.integrations || paymentIntegrations;
    }
}

function renderPayments() {
    const container = document.getElementById('paymentsList');
    
    if (!container) return; // Not on payments tab
    
    let filteredPayments = [...appointments];
    
    // Apply filters
    const statusFilter = document.getElementById('paymentStatusFilter')?.value;
    const methodFilter = document.getElementById('paymentMethodFilter')?.value;
    const dateFilter = document.getElementById('paymentDateFilter')?.value;
    
    if (statusFilter && statusFilter !== 'all') {
        filteredPayments = filteredPayments.filter(apt => (apt.paymentStatus || 'pending') === statusFilter);
    }
    
    if (methodFilter && methodFilter !== 'all') {
        filteredPayments = filteredPayments.filter(apt => apt.paymentMethod === methodFilter);
    }
    
    if (dateFilter) {
        filteredPayments = filteredPayments.filter(apt => apt.appointmentDate === dateFilter);
    }
    
    if (filteredPayments.length === 0) {
        container.innerHTML = `
            <div class="payment-item">
                <h3>No payments found</h3>
                <p>No appointments match the current filters.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredPayments.map(apt => {
        const paymentStatus = apt.paymentStatus || 'pending';
        const servicePrice = apt.servicePrice || 0;
        const amountPaid = apt.amountPaid || 0;
        const balanceDue = servicePrice - amountPaid;
        
        return `
            <div class="payment-item ${paymentStatus}">
                <div class="payment-details">
                    <h4>${apt.clientName}</h4>
                    <p><i class="fas fa-calendar"></i> ${apt.appointmentDate} at ${apt.appointmentTime}</p>
                    <p><i class="fas fa-spa"></i> ${apt.serviceType}</p>
                    <p><i class="fas fa-dollar-sign"></i> Service Price: $${servicePrice.toFixed(2)}</p>
                    ${amountPaid > 0 ? `<p><i class="fas fa-money-bill"></i> Paid: $${amountPaid.toFixed(2)}</p>` : ''}
                    ${balanceDue > 0 ? `<p><i class="fas fa-exclamation-circle"></i> Due: $${balanceDue.toFixed(2)}</p>` : ''}
                    ${apt.paymentMethod ? `<p><i class="fas fa-credit-card"></i> Method: ${apt.paymentMethod}</p>` : ''}
                    <span class="payment-status ${paymentStatus}">${paymentStatus}</span>
                </div>
                <div class="payment-actions">
                    <button class="btn btn-success btn-small" onclick="showPaymentModal('${apt.id}')">
                        <i class="fas fa-check"></i> Confirm Payment
                    </button>
                    ${paymentStatus !== 'paid' ? `
                    <button class="btn btn-warning btn-small" onclick="sendPaymentReminder('${apt.id}')">
                        <i class="fas fa-bell"></i> Send Reminder
                    </button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function updatePaymentOverview() {
    const pending = appointments.filter(apt => (apt.paymentStatus || 'pending') === 'pending');
    const overdue = appointments.filter(apt => apt.paymentStatus === 'overdue');
    const partial = appointments.filter(apt => apt.paymentStatus === 'partial');
    const paidToday = appointments.filter(apt => {
        const today = new Date().toISOString().split('T')[0];
        return apt.paymentStatus === 'paid' && apt.appointmentDate === today;
    });
    
    const pendingAmount = pending.reduce((sum, apt) => sum + ((apt.servicePrice || 0) - (apt.amountPaid || 0)), 0);
    const overdueAmount = overdue.reduce((sum, apt) => sum + ((apt.servicePrice || 0) - (apt.amountPaid || 0)), 0);
    const partialAmount = partial.reduce((sum, apt) => sum + ((apt.servicePrice || 0) - (apt.amountPaid || 0)), 0);
    const paidTodayAmount = paidToday.reduce((sum, apt) => sum + (apt.amountPaid || 0), 0);
    
    if (document.getElementById('pendingPayments')) {
        document.getElementById('pendingPayments').textContent = `$${pendingAmount.toFixed(2)}`;
        document.getElementById('pendingCount').textContent = `${pending.length} appointments`;
        
        document.getElementById('overduePayments').textContent = `$${overdueAmount.toFixed(2)}`;
        document.getElementById('overdueCount').textContent = `${overdue.length} appointments`;
        
        document.getElementById('partialPayments').textContent = `$${partialAmount.toFixed(2)}`;
        document.getElementById('partialCount').textContent = `${partial.length} appointments`;
        
        document.getElementById('paidToday').textContent = `$${paidTodayAmount.toFixed(2)}`;
        document.getElementById('paidTodayCount').textContent = `${paidToday.length} appointments`;
    }
}

function showPaymentModal(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;
    
    // Populate modal with appointment details
    document.getElementById('paymentAppointmentId').value = appointmentId;
    document.getElementById('paymentClientName').textContent = appointment.clientName;
    document.getElementById('paymentServiceDetails').textContent = `${appointment.serviceType} on ${appointment.appointmentDate} at ${appointment.appointmentTime}`;
    document.getElementById('paymentTotalAmount').textContent = `Total: $${(appointment.servicePrice || 0).toFixed(2)}`;
    
    // Pre-fill existing payment data
    document.getElementById('confirmPaymentMethod').value = appointment.paymentMethod || '';
    document.getElementById('confirmAmountPaid').value = appointment.amountPaid || 0;
    document.getElementById('confirmPaymentStatus').value = appointment.paymentStatus || 'pending';
    document.getElementById('confirmPaymentReference').value = appointment.paymentReference || '';
    document.getElementById('confirmPaymentNotes').value = appointment.paymentNotes || '';
    
    document.getElementById('paymentModal').style.display = 'block';
}

async function confirmPayment(event) {
    if (event) event.preventDefault();
    
    const appointmentId = document.getElementById('paymentAppointmentId').value;
    const paymentData = {
        paymentMethod: document.getElementById('confirmPaymentMethod').value,
        amountPaid: parseFloat(document.getElementById('confirmAmountPaid').value),
        paymentStatus: document.getElementById('confirmPaymentStatus').value,
        paymentReference: document.getElementById('confirmPaymentReference').value,
        paymentNotes: document.getElementById('confirmPaymentNotes').value,
        paymentDate: new Date().toISOString()
    };
    
    const result = await apiCall(`/appointments/${appointmentId}/payment`, 'PUT', paymentData);
    if (result) {
        showMessage('Payment updated successfully!', 'success');
        closeModal('paymentModal');
        await loadAppointments();
        renderPayments();
        updatePaymentOverview();
    }
}

async function sendPaymentReminder(appointmentId) {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;
    
    const balanceDue = (appointment.servicePrice || 0) - (appointment.amountPaid || 0);
    
    const reminderData = {
        recipientEmail: appointment.clientEmail,
        recipientName: appointment.clientName,
        appointmentDate: appointment.appointmentDate,
        serviceType: appointment.serviceType,
        balanceDue: balanceDue.toFixed(2),
        paymentMethods: Object.keys(paymentIntegrations).filter(key => paymentIntegrations[key].connected)
    };
    
    const result = await apiCall('/payment-reminder', 'POST', reminderData);
    if (result) {
        showMessage(`Payment reminder sent to ${appointment.clientName}`, 'success');
    }
}

async function sendPaymentReminders() {
    const pendingPayments = appointments.filter(apt => 
        (apt.paymentStatus || 'pending') === 'pending' || apt.paymentStatus === 'partial'
    );
    
    if (pendingPayments.length === 0) {
        showMessage('No pending payments to remind', 'info');
        return;
    }
    
    const result = await apiCall('/payment-reminders/bulk', 'POST', {
        appointments: pendingPayments.map(apt => apt.id)
    });
    
    if (result) {
        showMessage(`Payment reminders sent to ${pendingPayments.length} clients`, 'success');
    }
}

function showPaymentIntegrations() {
    // Update integration status
    document.getElementById('applePayStatus').textContent = paymentIntegrations.applePay.connected ? 'Connected' : 'Not Connected';
    document.getElementById('applePayStatus').className = paymentIntegrations.applePay.connected ? 'status connected' : 'status';
    
    document.getElementById('cashappStatus').textContent = paymentIntegrations.cashApp.connected ? 'Connected' : 'Not Connected';
    document.getElementById('cashappStatus').className = paymentIntegrations.cashApp.connected ? 'status connected' : 'status';
    document.getElementById('cashappHandle').value = paymentIntegrations.cashApp.handle;
    
    document.getElementById('venmoStatus').textContent = paymentIntegrations.venmo.connected ? 'Connected' : 'Not Connected';
    document.getElementById('venmoStatus').className = paymentIntegrations.venmo.connected ? 'status connected' : 'status';
    document.getElementById('venmoHandle').value = paymentIntegrations.venmo.username;
    
    // Update settings
    document.getElementById('autoReminders').checked = paymentSettings.autoReminders;
    document.getElementById('reminderFrequency').value = paymentSettings.reminderFrequency;
    document.getElementById('paymentDueDays').value = paymentSettings.paymentDueDays;
    
    document.getElementById('paymentIntegrationsModal').style.display = 'block';
}

async function setupApplePay() {
    // In a real implementation, this would integrate with Apple Pay
    showMessage('Apple Pay integration coming soon! For now, you can accept Apple Pay manually.', 'info');
}

async function setupCashApp() {
    const handle = document.getElementById('cashappHandle').value;
    if (!handle) {
        showMessage('Please enter your CashApp handle', 'error');
        return;
    }
    
    paymentIntegrations.cashApp = {
        connected: true,
        handle: handle
    };
    
    const result = await apiCall('/payment-integrations/cashapp', 'POST', {
        handle: handle
    });
    
    if (result) {
        document.getElementById('cashappStatus').textContent = 'Connected';
        document.getElementById('cashappStatus').className = 'status connected';
        showMessage('CashApp connected successfully!', 'success');
    }
}

async function setupVenmo() {
    const username = document.getElementById('venmoHandle').value;
    if (!username) {
        showMessage('Please enter your Venmo username', 'error');
        return;
    }
    
    paymentIntegrations.venmo = {
        connected: true,
        username: username
    };
    
    const result = await apiCall('/payment-integrations/venmo', 'POST', {
        username: username
    });
    
    if (result) {
        document.getElementById('venmoStatus').textContent = 'Connected';
        document.getElementById('venmoStatus').className = 'status connected';
        showMessage('Venmo connected successfully!', 'success');
    }
}

function filterPayments() {
    renderPayments();
}

function updateServicePrice() {
    const serviceType = document.getElementById('serviceType').value;
    const priceMap = {
        'manicure': 25,
        'pedicure': 35,
        'gel': 45,
        'acrylic': 55,
        'nail-art': 65,
        'mushroom-design': 70
    };
    
    const price = priceMap[serviceType] || 0;
    document.getElementById('servicePrice').value = price;
}

// Chat System Functions
async function loadChats() {
    const data = await apiCall('/chats');
    if (data) {
        chats = data;
        renderChatList();
    }
}

function renderChatList() {
    const container = document.getElementById('chatList');
    
    if (!container) return; // Not on chat tab
    
    if (chats.length === 0) {
        container.innerHTML = `
            <div class="no-chats">
                <div style="text-align: center; padding: 40px 20px; opacity: 0.6;">
                    <i class="fas fa-comments" style="font-size: 3rem; color: var(--medium-purple); margin-bottom: 15px;"></i>
                    <h4>No conversations yet</h4>
                    <p>Start your first chat with a customer!</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = chats.map(chat => {
        const customer = customers.find(c => c.id === chat.customerId);
        const lastMessage = chat.lastMessage || '';
        const unreadCount = chat.unreadCount || 0;
        const timeAgo = formatTimeAgo(chat.lastMessageTime);
        
        return `
            <div class="chat-item ${chat.id === currentChatId ? 'active' : ''}" onclick="selectChat('${chat.id}')">
                <div class="chat-avatar">
                    ${customer ? customer.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div class="chat-preview">
                    <h5>${customer ? customer.name : 'Unknown Customer'}</h5>
                    <p>${lastMessage || 'No messages yet'}</p>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${timeAgo}</div>
                    ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function startNewChat() {
    // Populate customer dropdown
    const recipientSelect = document.getElementById('chatRecipient');
    recipientSelect.innerHTML = '<option value="">Choose a customer...</option>';
    
    customers.forEach(customer => {
        recipientSelect.innerHTML += `<option value="${customer.id}">${customer.name} (${customer.email})</option>`;
    });
    
    document.getElementById('newChatModal').style.display = 'block';
}

async function createNewChat(event) {
    event.preventDefault();
    
    const customerId = document.getElementById('chatRecipient').value;
    const chatType = document.getElementById('chatType').value;
    const initialMessage = document.getElementById('initialMessage').value;
    
    if (!customerId) {
        showMessage('Please select a customer', 'error');
        return;
    }
    
    // Check if chat already exists with this customer
    const existingChat = chats.find(chat => chat.customerId === customerId);
    if (existingChat) {
        selectChat(existingChat.id);
        closeModal('newChatModal');
        
        if (initialMessage.trim()) {
            document.getElementById('messageInput').value = initialMessage;
        }
        return;
    }
    
    const chatData = {
        customerId: customerId,
        chatType: chatType,
        createdAt: new Date().toISOString(),
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
    };
    
    const result = await apiCall('/chats', 'POST', chatData);
    if (result) {
        chats.push(result);
        renderChatList();
        selectChat(result.id);
        closeModal('newChatModal');
        
        // Send initial message if provided
        if (initialMessage.trim()) {
            await sendInitialMessage(result.id, initialMessage);
        }
        
        showMessage('New chat started successfully!', 'success');
        
        // Reset form
        document.getElementById('newChatForm').reset();
    }
}

async function selectChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find(c => c.id === chatId);
    
    if (!chat) return;
    
    const customer = customers.find(c => c.id === chat.customerId);
    
    // Update header
    document.getElementById('participantName').textContent = customer ? customer.name : 'Unknown Customer';
    document.getElementById('participantStatus').textContent = customer ? `${customer.email} • ${chat.chatType}` : 'Customer';
    document.getElementById('participantAvatar').innerHTML = customer ? customer.name.charAt(0).toUpperCase() : 'U';
    
    // Show chat details button and input area
    document.getElementById('chatDetailsBtn').style.display = 'block';
    document.getElementById('chatInputContainer').style.display = 'block';
    
    // Load messages for this chat
    await loadChatMessages(chatId);
    
    // Mark as read
    if (chat.unreadCount > 0) {
        chat.unreadCount = 0;
        await apiCall(`/chats/${chatId}/mark-read`, 'PUT');
        renderChatList();
    }
}

async function loadChatMessages(chatId) {
    const data = await apiCall(`/chats/${chatId}/messages`);
    if (data) {
        renderChatMessages(data);
    }
}

function renderChatMessages(messages) {
    const container = document.getElementById('chatMessages');
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="no-messages">
                <div style="text-align: center; padding: 40px 20px; opacity: 0.6;">
                    <i class="fas fa-comment" style="font-size: 2.5rem; color: var(--medium-purple); margin-bottom: 15px;"></i>
                    <h4>Start the conversation</h4>
                    <p>Send your first message below!</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map(message => {
        const isFromAdmin = message.senderId === 'admin'; // Assuming admin is the sender
        const messageClass = isFromAdmin ? 'sent' : 'received';
        const timeFormatted = formatMessageTime(message.createdAt);
        
        return `
            <div class="message ${messageClass}">
                <div class="message-bubble">
                    ${message.content}
                    ${message.attachmentUrl ? `
                        <div class="message-attachment">
                            ${message.attachmentType === 'image' ? 
                                `<img src="${message.attachmentUrl}" alt="Attachment" style="max-width: 200px; border-radius: 10px; margin-top: 10px;">` :
                                `<a href="${message.attachmentUrl}" target="_blank" class="attachment-link">
                                    <i class="fas fa-paperclip"></i> ${message.attachmentName}
                                </a>`
                            }
                        </div>
                    ` : ''}
                </div>
                <div class="message-time">${timeFormatted}</div>
                ${isFromAdmin ? `<div class="message-status">${message.status || 'Sent'}</div>` : ''}
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function sendMessage(event) {
    event.preventDefault();
    
    const messageInput = document.getElementById('messageInput');
    const messageContent = messageInput.value.trim();
    
    if (!messageContent || !currentChatId) return;
    
    const messageData = {
        chatId: currentChatId,
        senderId: 'admin', // Current user is admin
        content: messageContent,
        messageType: 'text',
        createdAt: new Date().toISOString()
    };
    
    const result = await apiCall('/messages', 'POST', messageData);
    if (result) {
        // Clear input
        messageInput.value = '';
        
        // Reload messages
        await loadChatMessages(currentChatId);
        
        // Update chat list
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.lastMessage = messageContent;
            chat.lastMessageTime = new Date().toISOString();
            renderChatList();
        }
    }
}

async function sendInitialMessage(chatId, message) {
    const messageData = {
        chatId: chatId,
        senderId: 'admin',
        content: message,
        messageType: 'text',
        createdAt: new Date().toISOString()
    };
    
    await apiCall('/messages', 'POST', messageData);
}

function searchChats() {
    const searchTerm = document.getElementById('chatSearch').value.toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const customerName = item.querySelector('h5').textContent.toLowerCase();
        const lastMessage = item.querySelector('p').textContent.toLowerCase();
        
        if (customerName.includes(searchTerm) || lastMessage.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function showChatDetails() {
    if (!currentChatId) return;
    
    const chat = chats.find(c => c.id === currentChatId);
    const customer = customers.find(c => c.id === chat.customerId);
    
    if (!chat || !customer) return;
    
    const detailsContent = document.getElementById('chatDetailsContent');
    detailsContent.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Customer:</span>
            <span>${customer.name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span>${customer.email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span>${customer.phone || 'Not provided'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Chat Type:</span>
            <span>${chat.chatType}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Started:</span>
            <span>${formatDateTime(chat.createdAt)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Last Message:</span>
            <span>${formatDateTime(chat.lastMessageTime)}</span>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--light-purple);">
            <h4 style="color: var(--medium-purple); margin-bottom: 15px;">Quick Actions</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-purple btn-small" onclick="viewCustomerAppointments('${customer.id}')">
                    <i class="fas fa-calendar"></i> View Appointments
                </button>
                <button class="btn btn-success btn-small" onclick="createAppointmentFromChat('${customer.id}')">
                    <i class="fas fa-plus"></i> Book Appointment
                </button>
                <button class="btn btn-warning btn-small" onclick="sendPaymentReminder('${customer.id}')">
                    <i class="fas fa-credit-card"></i> Payment Reminder
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('chatDetailsModal').style.display = 'block';
}

function attachFile() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,application/pdf,.doc,.docx,.txt';
    fileInput.style.display = 'none';
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            // In production, upload file and get URL
            showMessage('File attachment feature coming soon!', 'info');
        }
    });
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// Helper functions
function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString();
}

function formatMessageTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function viewCustomerAppointments(customerId) {
    // Switch to appointments tab and filter by customer
    switchTab('appointments');
    closeModal('chatDetailsModal');
    // Implementation would filter appointments by customer
}

function createAppointmentFromChat(customerId) {
    // Pre-fill appointment form with customer data
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        switchTab('appointments');
        closeModal('chatDetailsModal');
        
        // Show appointment modal with pre-filled data
        setTimeout(() => {
            showAddAppointment();
            document.getElementById('clientName').value = customer.name;
            document.getElementById('clientEmail').value = customer.email;
            document.getElementById('clientPhone').value = customer.phone || '';
        }, 500);
    }
}

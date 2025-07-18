// Appointment Request System
// Handles appointment requests from customers and notifications for admin

// Global storage for appointment requests
let appointmentRequests = [];
let notificationCount = 0;

// Show the request appointment modal for customers
function showRequestAppointment() {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('requestDate').value = tomorrow.toISOString().split('T')[0];
    
    // Set default time to noon
    document.getElementById('requestTime').value = '12:00';
    
    // Clear other fields
    document.getElementById('requestServiceType').value = '';
    document.getElementById('requestNotes').value = '';
    
    // Show the modal
    document.getElementById('requestAppointmentModal').style.display = 'block';
}

// Update service price in the request form (mirrors the admin version)
function updateRequestServicePrice() {
    const serviceType = document.getElementById('requestServiceType').value;
    let price = 0;
    
    switch(serviceType) {
        case 'manicure': price = 25; break;
        case 'pedicure': price = 35; break;
        case 'gel': price = 45; break;
        case 'acrylic': price = 55; break;
        case 'nail-art': price = 65; break;
        case 'mushroom-design': price = 70; break;
    }
}

// Handle the appointment request submission
function handleAppointmentRequest(e) {
    e.preventDefault();
    
    // Get current user info
    const userName = localStorage.getItem('userName') || 'Customer';
    const userPhone = localStorage.getItem('userPhone') || '';
    const userId = localStorage.getItem('userId') || '';
    
    // Get form data
    const formData = {
        clientName: userName,
        clientPhone: userPhone,
        userId: userId,
        appointmentDate: document.getElementById('requestDate').value,
        appointmentTime: document.getElementById('requestTime').value,
        serviceType: document.getElementById('requestServiceType').value,
        notes: document.getElementById('requestNotes').value,
        status: 'pending',
        requestDate: new Date().toISOString(),
        id: 'req-' + Date.now()
    };
    
    // Save to local storage for persistence between sessions
    saveAppointmentRequest(formData);
    
    // Close the modal
    closeModal('requestAppointmentModal');
    
    // Show success message
    showMessage('Your appointment request has been sent! You will be notified once it\'s confirmed.', 'success');
    
    // Update the appointments list
    renderAppointments();
}

// Save appointment request to localStorage
function saveAppointmentRequest(request) {
    // Get existing requests
    let requests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    
    // Add the new request
    requests.push(request);
    
    // Save back to localStorage
    localStorage.setItem('appointmentRequests', JSON.stringify(requests));
    
    // Update the global variable
    appointmentRequests = requests;
    
    // Add notification for admin
    addAdminNotification(request);
}

// Add notification for admin
function addAdminNotification(request) {
    // Get existing notifications
    let notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    
    // Add the new notification
    notifications.push({
        id: 'notif-' + Date.now(),
        type: 'appointment-request',
        message: `New appointment request from ${request.clientName} for ${request.appointmentDate}`,
        requestId: request.id,
        date: new Date().toISOString(),
        read: false
    });
    
    // Save back to localStorage
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    
    // Update notification count
    updateAdminNotificationCount();
}

// Update admin notification count and badge
function updateAdminNotificationCount() {
    // Only proceed if user is admin
    if (localStorage.getItem('userRole') !== 'admin') return;
    
    // Get existing notifications
    let notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    
    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;
    
    // Update global variable
    notificationCount = unreadCount;
    
    // Update UI
    const notificationBadge = document.getElementById('notificationBadge');
    if (notificationBadge) {
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = 'block';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
}

// Load appointment requests from localStorage
function loadAppointmentRequests() {
    // Get requests from localStorage
    const requests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    
    // Update global variable
    appointmentRequests = requests;
    
    // Return the requests
    return requests;
}

// Combine admin appointments and customer requests for display
function loadAllAppointments() {
    // Get admin appointments (from server or mock data)
    const adminPromise = loadAppointments();
    
    // Get customer requests (from localStorage)
    const requests = loadAppointmentRequests();
    
    // When admin appointments load, combine with requests
    adminPromise.then(() => {
        // Create combined list - admin appointments from the global appointments variable
        const combined = [...appointments, ...requests];
        
        // Sort by date and time
        combined.sort((a, b) => {
            const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
            const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
            return dateA - dateB;
        });
        
        // Update global appointments array with combined list
        appointments = combined;
        
        // Render the appointments - admin sees all, customer sees time slots
        if (localStorage.getItem('userRole') === 'admin') {
            renderAppointments(); // Admin view
        } else {
            renderCustomerTimeSlots(); // Customer view with available time slots
        }
    });
}

// Approve appointment request (admin only)
function approveAppointmentRequest(requestId) {
    // Get the request
    const request = appointmentRequests.find(req => req.id === requestId);
    if (!request) return;
    
    // Convert to regular appointment
    const appointmentData = {
        clientName: request.clientName,
        clientPhone: request.clientPhone,
        appointmentDate: request.appointmentDate,
        appointmentTime: request.appointmentTime,
        serviceType: request.serviceType,
        notes: request.notes,
        status: 'confirmed',
        paymentStatus: 'pending',
        servicePrice: getServicePrice(request.serviceType),
        amountPaid: 0
    };
    
    // Save to server
    apiCall('/appointments', 'POST', appointmentData)
        .then(result => {
            if (result) {
                // Remove the request
                removeAppointmentRequest(requestId);
                
                // Show success message
                showMessage('Appointment request approved!', 'success');
                
                // Reload appointments
                loadAllAppointments();
            }
        });
}

// Get service price based on service type
function getServicePrice(serviceType) {
    switch(serviceType) {
        case 'manicure': return 25;
        case 'pedicure': return 35;
        case 'gel': return 45;
        case 'acrylic': return 55;
        case 'nail-art': return 65;
        case 'mushroom-design': return 70;
        default: return 0;
    }
}

// Remove appointment request
function removeAppointmentRequest(requestId) {
    // Get existing requests
    let requests = JSON.parse(localStorage.getItem('appointmentRequests') || '[]');
    
    // Filter out the request
    requests = requests.filter(req => req.id !== requestId);
    
    // Save back to localStorage
    localStorage.setItem('appointmentRequests', JSON.stringify(requests));
    
    // Update the global variable
    appointmentRequests = requests;
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    // Get existing notifications
    let notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
    
    // Find and update the notification
    notifications = notifications.map(n => {
        if (n.id === notificationId) {
            return { ...n, read: true };
        }
        return n;
    });
    
    // Save back to localStorage
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    
    // Update notification count
    updateAdminNotificationCount();
}

// Initialize event listeners for appointment requests
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for request appointment form
    const requestForm = document.getElementById('requestAppointmentForm');
    if (requestForm) {
        requestForm.addEventListener('submit', handleAppointmentRequest);
    }
    
    // Add notification badge to admin interface if logged in as admin
    if (localStorage.getItem('userRole') === 'admin') {
        const headerActions = document.querySelector('.section-header');
        if (headerActions) {
            const badge = document.createElement('div');
            badge.id = 'notificationBadge';
            badge.className = 'notification-badge';
            badge.style.display = 'none';
            headerActions.appendChild(badge);
        }
        
        // Update notification count
        updateAdminNotificationCount();
    }
});

// Override the existing loadAppointments function to include requests
const originalLoadAppointments = window.loadAppointments;
window.loadAppointments = function() {
    // Call the original function
    const promise = originalLoadAppointments();
    
    // When it's done, load requests too
    promise.then(() => {
        loadAllAppointments();
    });
    
    // Return the promise
    return promise;
};

// Override the original renderAppointments function to include request status
const originalRenderAppointments = window.renderAppointments;
window.renderAppointments = function() {
    // Get if user is admin
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    
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
        const isRequest = apt.id && apt.id.startsWith('req-');
        const paymentStatusClass = apt.paymentStatus || (isRequest ? 'pending' : 'pending');
        const paymentStatusText = {
            'pending': 'Payment Pending',
            'partial': 'Partial Payment',
            'paid': 'Fully Paid',
            'overdue': 'Payment Overdue'
        }[paymentStatusClass] || 'Payment Pending';
        
        const servicePrice = apt.servicePrice || getServicePrice(apt.serviceType) || 0;
        const amountPaid = apt.amountPaid || 0;
        const balanceDue = servicePrice - amountPaid;
        
        // Additional request-specific UI
        const requestStatus = isRequest ? 
            `<div class="request-status pending">
                <i class="fas fa-clock"></i> Pending Approval
            </div>` : '';
            
        const approveButton = (isRequest && isAdmin) ? 
            `<button class="btn btn-success" onclick="approveAppointmentRequest('${apt.id}')">
                <i class="fas fa-check"></i> Approve
            </button>` : '';
            
        const denyButton = (isRequest && isAdmin) ? 
            `<button class="btn btn-danger" onclick="denyAppointmentRequest('${apt.id}')">
                <i class="fas fa-times"></i> Deny
            </button>` : '';
            
        const adminRequestControls = (isRequest && isAdmin) ? 
            `<div class="request-controls">
                ${approveButton}
                ${denyButton}
            </div>` : '';
        
        return `
        <div class="appointment-card ${isRequest ? 'appointment-request' : ''}">
            <h3><i class="fas fa-user"></i> ${apt.clientName}</h3>
            ${requestStatus}
            <p><i class="fas fa-calendar"></i> ${apt.appointmentDate} at ${apt.appointmentTime}</p>
            <p><i class="fas fa-spa"></i> ${apt.serviceType}</p>
            <p><i class="fas fa-phone"></i> ${apt.clientPhone || 'No phone'}</p>
            ${apt.clientEmail ? `<p><i class="fas fa-envelope"></i> ${apt.clientEmail}</p>` : ''}
            ${apt.notes ? `<p><i class="fas fa-sticky-note"></i> ${apt.notes}</p>` : ''}
            
            ${isRequest ? '' : `
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
            `}
            
            ${adminRequestControls}
            
            ${isRequest ? '' : `
            <div style="margin-top: 15px;">
                <button class="btn" onclick="editAppointment('${apt.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteAppointment('${apt.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            `}
        </div>
        `;
    }).join('');
};

// Function to deny appointment request
function denyAppointmentRequest(requestId) {
    if (confirm('Are you sure you want to deny this appointment request?')) {
        // Remove the request
        removeAppointmentRequest(requestId);
        
        // Show success message
        showMessage('Appointment request denied!', 'success');
        
        // Reload appointments
        loadAllAppointments();
    }
}

// Customer Time Slots UI
// This section creates the time slots UI for customers

// Global variables for customer time slots
let selectedDate = new Date();
let selectedTimeSlot = null;
let selectedService = '';

// Create and render time slots UI for customers
function renderCustomerTimeSlots() {
    const container = document.getElementById('appointmentsList');
    if (!container) return;
    
    // Format date for display
    const formattedDate = formatDate(selectedDate);
    
    // Create UI
    container.innerHTML = `
        <div class="time-slots-container">
            <div class="time-slots-header">
                <h3 class="time-slots-title">
                    <i class="fas fa-calendar-alt"></i> Available Appointments
                </h3>
                <div class="date-navigation">
                    <button id="prevDate"><i class="fas fa-chevron-left"></i></button>
                    <div class="current-date">${formattedDate}</div>
                    <button id="nextDate"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
            
            <div class="service-selection">
                <select id="serviceTypeSelect">
                    <option value="">Select a Service</option>
                    <option value="manicure">Classic Manicure - $25</option>
                    <option value="pedicure">Pedicure - $35</option>
                    <option value="gel">Gel Nails - $45</option>
                    <option value="acrylic">Acrylic Set - $55</option>
                    <option value="nail-art">Custom Nail Art - $65</option>
                    <option value="mushroom-design">Mushroom Special - $70</option>
                </select>
            </div>
            
            <div id="timeSlotsGrid" class="time-slots-grid">
                <div class="no-slots-message">
                    Please select a service to view available time slots
                </div>
            </div>
            
            <div class="wait-time-meter" id="waitTimeMeter" style="display: none;">
                <div class="wait-time-title">
                    <i class="fas fa-hourglass-half"></i> Estimated Wait Time
                </div>
                <div class="wait-time-display">
                    <span id="waitTimeMinutes">20</span> minutes
                </div>
                <div class="wait-time-bar">
                    <div class="wait-time-progress" id="waitTimeProgress"></div>
                </div>
                <div class="wait-time-legend">
                    <span>No Wait</span>
                    <span>Average</span>
                    <span>Busy</span>
                </div>
                <div class="wait-time-note">
                    This is an estimate based on current bookings and service type
                </div>
            </div>
            
            <button id="requestSelectedTime" class="btn btn-primary" style="margin-top: 20px; display: none;">
                <i class="fas fa-calendar-check"></i> Request this Appointment
            </button>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('prevDate').addEventListener('click', () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 1);
        selectedDate = newDate;
        updateTimeSlots();
    });
    
    document.getElementById('nextDate').addEventListener('click', () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 1);
        selectedDate = newDate;
        updateTimeSlots();
    });
    
    document.getElementById('serviceTypeSelect').addEventListener('change', function() {
        selectedService = this.value;
        updateTimeSlots();
        
        // Show wait time meter if service is selected
        if (selectedService) {
            document.getElementById('waitTimeMeter').style.display = 'block';
            updateWaitTimeMeter(selectedService);
        } else {
            document.getElementById('waitTimeMeter').style.display = 'none';
        }
    });
    
    document.getElementById('requestSelectedTime').addEventListener('click', () => {
        if (selectedTimeSlot && selectedService) {
            showRequestAppointment();
            
            // Pre-fill the request form with selected date, time and service
            document.getElementById('requestDate').value = formatDateForInput(selectedDate);
            document.getElementById('requestTime').value = selectedTimeSlot;
            document.getElementById('requestServiceType').value = selectedService;
            
            // Focus on notes field
            setTimeout(() => {
                document.getElementById('requestNotes').focus();
            }, 500);
        }
    });
}

// Format date for display (e.g., "Monday, July 20")
function formatDate(date) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format date for input field (YYYY-MM-DD)
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Update time slots when date or service changes
function updateTimeSlots() {
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    const requestButton = document.getElementById('requestSelectedTime');
    
    if (!selectedService) {
        timeSlotsGrid.innerHTML = `
            <div class="no-slots-message">
                Please select a service to view available time slots
            </div>
        `;
        requestButton.style.display = 'none';
        return;
    }
    
    // Get available time slots
    const availableSlots = generateAvailableTimeSlots(selectedDate, selectedService);
    
    if (availableSlots.length === 0) {
        timeSlotsGrid.innerHTML = `
            <div class="no-slots-message">
                No available time slots for this date. Please try another day.
            </div>
        `;
        requestButton.style.display = 'none';
        return;
    }
    
    // Create time slot elements
    timeSlotsGrid.innerHTML = availableSlots.map(slot => {
        const isSelected = slot.time === selectedTimeSlot;
        return `
            <div class="time-slot available ${isSelected ? 'selected' : ''}" data-time="${slot.time}">
                ${slot.time}
                <div class="duration">${slot.duration} min</div>
            </div>
        `;
    }).join('');
    
    // Add click event to time slots
    const slotElements = timeSlotsGrid.querySelectorAll('.time-slot');
    slotElements.forEach(slot => {
        slot.addEventListener('click', () => {
            // Remove selected class from all slots
            slotElements.forEach(s => s.classList.remove('selected'));
            
            // Add selected class to clicked slot
            slot.classList.add('selected');
            
            // Update selected time
            selectedTimeSlot = slot.dataset.time;
            
            // Show request button
            requestButton.style.display = 'block';
        });
    });
    
    // Hide request button if no slot is selected
    requestButton.style.display = selectedTimeSlot ? 'block' : 'none';
}

// Update wait time meter based on service type
function updateWaitTimeMeter(serviceType) {
    const waitTime = calculateEstimatedWaitTime(serviceType);
    const waitTimeMinutes = document.getElementById('waitTimeMinutes');
    const waitTimeProgress = document.getElementById('waitTimeProgress');
    
    // Update wait time text
    waitTimeMinutes.textContent = waitTime;
    
    // Calculate percentage for progress bar (assuming max wait time is 40 minutes)
    const percentage = Math.min(100, (waitTime / 40) * 100);
    waitTimeProgress.style.width = `${percentage}%`;
    
    // Change color based on wait time
    if (waitTime <= 15) {
        waitTimeProgress.style.background = 'linear-gradient(135deg, #8cc152, #a0d468)'; // Green
    } else if (waitTime <= 25) {
        waitTimeProgress.style.background = 'var(--purple-gradient)'; // Purple
    } else {
        waitTimeProgress.style.background = 'linear-gradient(135deg, #ff8d6b, #ff6b6b)'; // Orange/Red
    }
}

// The original renderAppointments is already saved at the top of this file
// Just modify the existing override to handle customer view
window.renderAppointments = function() {
    // Check if user is admin or customer
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    
    if (isAdmin) {
        // Use the original function for admin view
        return originalRenderAppointments.apply(this, arguments);
    } else {
        // Use customer view with time slots
        renderCustomerTimeSlots();
        return;
    }
};

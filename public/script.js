// Authentication check
function checkAuthentication() {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        redirectToLogin();
        return false;
    }
    
    // Verify token with server
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
            redirectToLogin();
        }
    })
    .catch(error => {
        console.error('Auth verification error:', error);
        redirectToLogin();
    });
    
    return true;
}

function redirectToLogin() {
    window.location.href = '/login.html';
}

function logout() {
    const authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('userPhone');
    redirectToLogin();
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
let communications = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuthentication()) {
        return; // Will redirect to login if not authenticated
    }
    
    initializeEventListeners();
    loadAllData();
    loadGalleryImages();
    addLogoutButton();
});

// Add logout button to header
function addLogoutButton() {
    const header = document.querySelector('.header');
    const logoSection = header.querySelector('.logo-section');
    
    if (!document.getElementById('logoutBtn')) {
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'logout-btn';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.onclick = logout;
        
        header.appendChild(logoutBtn);
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
    document.getElementById('promoForm').addEventListener('submit', handlePromoSubmit);
    document.getElementById('messageForm').addEventListener('submit', handleMessageSubmit);

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
        
        return await response.json();
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
        loadCommunications()
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

    container.innerHTML = appointments.map(apt => `
        <div class="appointment-card">
            <h3><i class="fas fa-user"></i> ${apt.clientName}</h3>
            <p><i class="fas fa-calendar"></i> ${apt.appointmentDate} at ${apt.appointmentTime}</p>
            <p><i class="fas fa-spa"></i> ${apt.serviceType}</p>
            <p><i class="fas fa-phone"></i> ${apt.clientPhone || 'No phone'}</p>
            <p><i class="fas fa-envelope"></i> ${apt.clientEmail || 'No email'}</p>
            ${apt.notes ? `<p><i class="fas fa-sticky-note"></i> ${apt.notes}</p>` : ''}
            <div style="margin-top: 15px;">
                <button class="btn" onclick="editAppointment('${apt.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn" onclick="deleteAppointment('${apt.id}')" style="background: var(--danger);">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function handleAppointmentSubmit(e) {
    e.preventDefault();
    
    const formData = {
        clientName: document.getElementById('clientName').value,
        clientEmail: document.getElementById('clientEmail').value,
        clientPhone: document.getElementById('clientPhone').value,
        appointmentDate: document.getElementById('appointmentDate').value,
        appointmentTime: document.getElementById('appointmentTime').value,
        serviceType: document.getElementById('serviceType').value,
        notes: document.getElementById('notes').value
    };

    const result = await apiCall('/appointments', 'POST', formData);
    if (result) {
        showMessage('Appointment booked successfully!', 'success');
        closeModal('appointmentModal');
        document.getElementById('appointmentForm').reset();
        await loadAppointments();
    }
}

async function deleteAppointment(id) {
    if (confirm('Are you sure you want to delete this appointment?')) {
        const result = await apiCall(`/appointments/${id}`, 'DELETE');
        if (result !== null) {
            showMessage('Appointment deleted successfully', 'success');
            await loadAppointments();
        }
    }
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
        </div>
    `).join('');
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

    container.innerHTML = promoCodes.map(promo => `
        <div class="promo-card">
            <h3><i class="fas fa-tag"></i> ${promo.promoCode}</h3>
            <p><i class="fas fa-percentage"></i> ${promo.discountPercent}% off</p>
            <p><i class="fas fa-calendar-times"></i> Expires: ${promo.expiryDate}</p>
            <p><i class="fas fa-users"></i> Used: ${promo.used} times</p>
            ${promo.promoDescription ? `<p><i class="fas fa-info-circle"></i> ${promo.promoDescription}</p>` : ''}
        </div>
    `).join('');
}

async function handlePromoSubmit(e) {
    e.preventDefault();
    
    const formData = {
        promoCode: document.getElementById('promoCode').value.toUpperCase(),
        discountPercent: parseInt(document.getElementById('discountPercent').value),
        expiryDate: document.getElementById('expiryDate').value,
        promoDescription: document.getElementById('promoDescription').value
    };

    const result = await apiCall('/promo-codes', 'POST', formData);
    if (result) {
        showMessage('Promo code created successfully!', 'success');
        closeModal('promoModal');
        document.getElementById('promoForm').reset();
        await loadPromoCodes();
    }
}

// Communications
async function loadCommunications() {
    const data = await apiCall('/communications');
    if (data) {
        communications = data;
        renderCommunications();
    }
}

function renderCommunications() {
    const container = document.getElementById('communicationsList');
    
    if (communications.length === 0) {
        container.innerHTML = `
            <div class="communication-item">
                <h3>No messages sent</h3>
                <p>Start communicating with your customers!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = communications.map(comm => `
        <div class="communication-item">
            <h4><i class="fas fa-paper-plane"></i> ${comm.messageSubject}</h4>
            <p><i class="fas fa-envelope"></i> To: ${comm.recipientEmail}</p>
            <p><i class="fas fa-tag"></i> Type: ${comm.messageType}</p>
            <p><i class="fas fa-clock"></i> ${new Date(comm.timestamp).toLocaleString()}</p>
            <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                ${comm.messageBody}
            </div>
        </div>
    `).join('');
}

async function handleMessageSubmit(e) {
    e.preventDefault();
    
    const formData = {
        messageType: document.getElementById('messageType').value,
        recipientEmail: document.getElementById('recipientEmail').value,
        messageSubject: document.getElementById('messageSubject').value,
        messageBody: document.getElementById('messageBody').value
    };

    const result = await apiCall('/communications', 'POST', formData);
    if (result) {
        showMessage('Message sent successfully!', 'success');
        closeModal('messageModal');
        document.getElementById('messageForm').reset();
        await loadCommunications();
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
                preview.innerHTML = `<img src="${e.target.result}" alt="Media Preview">`;
            } else {
                preview.innerHTML = `<video src="${e.target.result}" controls preload="metadata"></video>`;
            }
            preview.classList.remove('empty');
        };
        reader.readAsDataURL(file);
    }
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
    formData.append(currentMediaType, fileInput.files[0]);
    formData.append('caption', caption);
    formData.append('socialPlatforms', JSON.stringify(socialPlatforms));
    
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
    document.getElementById('appointmentModal').style.display = 'block';
}

function showAddCustomer() {
    // Create customer modal if it doesn't exist
    showMessage('Customer management coming soon!', 'success');
}

function showAddPromo() {
    document.getElementById('promoModal').style.display = 'block';
}

function showSendMessage() {
    document.getElementById('messageModal').style.display = 'block';
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

// Sample data initialization (remove in production)
function initializeSampleData() {
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
// initializeSampleData();

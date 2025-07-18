// Landing Page Script

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the landing page
    initLandingPage();
});

function initLandingPage() {
    // Setup login toggle
    setupLoginToggle();
    
    // Setup login tabs (keeping this for potential future use)
    setupLoginTabs();
    
    // Setup appointment modal
    setupAppointmentModal();
    
    // Setup contact form
    setupContactForm();
    
    // Gallery functions removed as requested
}

// Toggle login dropdown
function setupLoginToggle() {
    const toggleBtn = document.getElementById('toggleLoginForm');
    const dropdown = document.getElementById('loginDropdown');
    
    if (toggleBtn && dropdown) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('#toggleLoginForm') && !event.target.closest('.login-dropdown') && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });
    }
}

// Setup appointment modal
function setupAppointmentModal() {
    const bookButtons = document.querySelectorAll('a[href="#contact"]');
    const appointmentOverlay = document.getElementById('appointmentOverlay');
    const closeModalBtn = document.getElementById('closeAppointmentModal');
    
    if (bookButtons.length && appointmentOverlay) {
        bookButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                appointmentOverlay.style.display = 'flex';
                setTimeout(() => {
                    appointmentOverlay.classList.add('active');
                }, 10);
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            });
        });
        
        // Close modal when clicking the close button
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                closeAppointmentModal();
            });
        }
        
        // Close modal when clicking outside the modal content
        appointmentOverlay.addEventListener('click', (e) => {
            if (e.target === appointmentOverlay) {
                closeAppointmentModal();
            }
        });
        
        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && appointmentOverlay.classList.contains('active')) {
                closeAppointmentModal();
            }
        });
    }
}

function closeAppointmentModal() {
    const appointmentOverlay = document.getElementById('appointmentOverlay');
    appointmentOverlay.classList.remove('active');
    setTimeout(() => {
        appointmentOverlay.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }, 300);
}

// Handle login tab switching
function setupLoginTabs() {
    const tabs = document.querySelectorAll('.login-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Show corresponding panel
            const targetPanel = tab.getAttribute('data-target');
            const panels = document.querySelectorAll('.login-panel');
            
            panels.forEach(panel => {
                panel.classList.remove('active');
                panel.style.display = 'none';
            });
            
            const activePanel = document.querySelector(`.login-panel[data-panel="${targetPanel}"]`);
            if (activePanel) {
                activePanel.classList.add('active');
                activePanel.style.display = 'block';
            }
        });
    });
}

// Load gallery images for the landing page
async function loadLandingGallery() {
    const galleryContainer = document.getElementById('landingGallery');
    
    if (!galleryContainer) return;
    
    try {
        // Show loading indicator
        galleryContainer.innerHTML = `
            <div class="loading-gallery">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading gallery...</p>
            </div>
        `;
        
        // Try to load images without showing API errors to the user
        let galleryImagesLoaded = false;
        
        // Try to use the existing gallery loading function if available
        if (typeof loadGalleryImages === 'function') {
            try {
                // Override the error message function temporarily
                const originalShowMessage = window.showMessage;
                window.showMessage = function(text, type) {
                    // Suppress API error messages for gallery loading
                    if (text.includes('API call failed') && type === 'error') {
                        console.log('Suppressed API error message:', text);
                        return;
                    }
                    // Call the original for other messages
                    if (originalShowMessage) originalShowMessage(text, type);
                };
                
                // Try loading gallery, but catch any errors silently
                await loadGalleryImages();
                renderLandingGallery(galleryContainer);
                galleryImagesLoaded = true;
                
                // Restore the original showMessage function
                window.showMessage = originalShowMessage;
            } catch (innerError) {
                console.error('Gallery loading error (suppressed):', innerError);
            }
        }
        
        // If gallery didn't load, use fallback
        if (!galleryImagesLoaded) {
            const galleryImages = await fetchGalleryImages();
            renderLandingGalleryImages(galleryContainer, galleryImages);
        }
    } catch (error) {
        console.error('Failed to load gallery images:', error);
        galleryContainer.innerHTML = `
            <div class="gallery-item-grid">
                ${generateFallbackGalleryHTML()}
            </div>
        `;
    }
}

// Render the landing gallery using the global galleryData object
function renderLandingGallery(container) {
    if (typeof galleryData !== 'undefined' && galleryData.photos && galleryData.photos.length > 0) {
        const limitedPhotos = galleryData.photos.slice(0, 8); // Limit to 8 photos for the landing page
        
        container.innerHTML = limitedPhotos.map(photo => `
            <div class="gallery-item">
                <img src="${photo.url}" alt="${photo.caption || 'Nail Art'}" loading="lazy"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Nail+Art';">
            </div>
        `).join('');
        
        // Add a "See More" button if there are more than 8 photos
        if (galleryData.photos.length > 8) {
            container.innerHTML += `
                <div class="see-more-container">
                    <a href="/index.html#gallery" class="btn btn-secondary">
                        <i class="fas fa-images"></i> See More
                    </a>
                </div>
            `;
        }
    } else {
        // If gallery data is empty or undefined, try the fallback
        try {
            const fallbackHTML = generateFallbackGalleryHTML();
            container.innerHTML = fallbackHTML;
        } catch (error) {
            renderEmptyLandingGallery(container);
        }
    }
}

// Fallback gallery image fetching
async function fetchGalleryImages() {
    // Mock gallery images using the PNG files in the workspace
    return [
        { url: 'images/IMG_9914.PNG', caption: 'Nail Design' },
        { url: 'images/IMG_9915.PNG', caption: 'Nail Design' },
        { url: 'images/IMG_9916.PNG', caption: 'Nail Design' },
        { url: 'images/IMG_9917.PNG', caption: 'Nail Design' },
        { url: 'images/IMG_9918.PNG', caption: 'Nail Design' },
        { url: 'images/IMG_9919.PNG', caption: 'Nail Design' },
        { url: 'images/IMG_9920.PNG', caption: 'Nail Design' },
        { url: 'images/IMG_9921.PNG', caption: 'Nail Design' }
    ];
}

// Generate HTML for fallback gallery when everything else fails
function generateFallbackGalleryHTML() {
    // Use a fixed set of local images
    const fallbackImages = [
        'images/IMG_9914.PNG', 'images/IMG_9915.PNG', 'images/IMG_9916.PNG', 'images/IMG_9917.PNG',
        'images/IMG_9918.PNG', 'images/IMG_9919.PNG', 'images/IMG_9920.PNG', 'images/IMG_9921.PNG'
    ];
    
    return fallbackImages.map(img => `
        <div class="gallery-item">
            <img src="${img}" alt="Nail Art Design" loading="lazy" 
                 onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\' viewBox=\'0 0 300 300\'%3E%3Crect width=\'300\' height=\'300\' fill=\'%23f8f0ff\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-size=\'24\' text-anchor=\'middle\' fill=\'%238a2be2\' font-family=\'Arial\'%3ENail Art%3C/text%3E%3C/svg%3E';">
        </div>
    `).join('');
}

// Load horizontally scrolling gallery sliders
async function loadSliderGalleries() {
    const topSliderContainer = document.getElementById('topGallerySlider');
    const bottomSliderContainer = document.getElementById('bottomGallerySlider');
    
    if (!topSliderContainer || !bottomSliderContainer) return;
    
    try {
        // Get all available images
        let allImages = [];
        
        // Try to use existing gallery data if available
        if (typeof galleryData !== 'undefined' && galleryData.photos && galleryData.photos.length > 0) {
            allImages = galleryData.photos.map(photo => photo.url);
        } else {
            // Use fallback images - make sure there are plenty for the endless effect
            allImages = [
                'images/IMG_9914.PNG', 'images/IMG_9915.PNG', 'images/IMG_9916.PNG', 'images/IMG_9917.PNG',
                'images/IMG_9918.PNG', 'images/IMG_9919.PNG', 'images/IMG_9920.PNG', 'images/IMG_9921.PNG',
                'images/IMG_9922.PNG', 'images/IMG_9923.PNG', 'images/IMG_9924.PNG', 'images/IMG_9925.PNG',
                'images/IMG_9926.PNG', 'images/IMG_9927.PNG', 'images/IMG_9928.PNG', 'images/IMG_9929.PNG',
                'images/IMG_9930.PNG', 'images/IMG_9931.PNG', 'images/IMG_9932.PNG', 'images/IMG_9933.PNG'
            ];
        }
        
        // Multiply the images several times for truly endless scrolling
        const extendedImages = [...allImages, ...allImages, ...allImages, ...allImages];
        
        // Render top slider with all extended images
        const topSliderHTML = generateSliderHTML(extendedImages);
        topSliderContainer.innerHTML = topSliderHTML;
        
        // Render bottom slider with all extended images in reverse
        const bottomSliderHTML = generateSliderHTML([...extendedImages].reverse());
        bottomSliderContainer.innerHTML = bottomSliderHTML;
        
    } catch (error) {
        console.error('Failed to load slider galleries:', error);
        
        // Use fallback images for both sliders
        const fallbackImages = [
            'images/IMG_9914.PNG', 'images/IMG_9915.PNG', 'images/IMG_9916.PNG', 'images/IMG_9917.PNG',
            'images/IMG_9918.PNG', 'images/IMG_9919.PNG', 'images/IMG_9920.PNG', 'images/IMG_9921.PNG',
            'images/IMG_9922.PNG', 'images/IMG_9923.PNG', 'images/IMG_9924.PNG', 'images/IMG_9925.PNG',
            'images/IMG_9926.PNG', 'images/IMG_9927.PNG', 'images/IMG_9928.PNG', 'images/IMG_9929.PNG'
        ];
        
        // Duplicate fallback images for more seamless experience
        const extendedFallbacks = [...fallbackImages, ...fallbackImages, ...fallbackImages];
        
        topSliderContainer.innerHTML = generateSliderHTML(extendedFallbacks);
        bottomSliderContainer.innerHTML = generateSliderHTML([...extendedFallbacks].reverse());
    }
}

// Generate HTML for slider galleries
function generateSliderHTML(images) {
    // Clone the images array to create a true infinite effect
    const clonedImages = [...images, ...images.slice(0, 5)];
    
    return clonedImages.map(img => {
        const imgSrc = typeof img === 'string' ? img : img.url || img;
        return `
            <div class="slider-item">
                <img src="${imgSrc}" alt="Nail Art Design" loading="lazy" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/250x250?text=Nail+Art';">
            </div>
        `;
    }).join('');
}

// Render gallery images from fetched data
function renderLandingGalleryImages(container, images) {
    if (images && images.length > 0) {
        container.innerHTML = images.map(image => `
            <div class="gallery-item">
                <img src="${image.url}" alt="${image.caption || 'Nail Art'}" loading="lazy"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Nail+Art';">
            </div>
        `).join('');
    } else {
        renderEmptyLandingGallery(container);
    }
}

// Render empty gallery message
function renderEmptyLandingGallery(container) {
    container.innerHTML = `
        <div class="empty-gallery">
            <i class="fas fa-images"></i>
            <p>No gallery images available at the moment. Check back soon!</p>
        </div>
    `;
}

// Setup contact form functionality
function setupContactForm() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                service: document.getElementById('service').value,
                date: document.getElementById('date').value,
                time: document.getElementById('time').value,
                message: document.getElementById('message').value
            };
            
            // Validate form data
            if (!formData.name || !formData.email || !formData.phone || !formData.service || !formData.date || !formData.time) {
                showToast('Please fill all required fields', 'error');
                return;
            }
            
            // Simulate form submission
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            // Simulate API call with timeout
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                
                // Show success message
                showToast('Appointment request submitted successfully! We\'ll contact you shortly.', 'success');
                
                // Reset form
                contactForm.reset();
                
                // Close the modal
                closeAppointmentModal();
            }, 1500);
        });
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-notification');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    // Set toast content and type
    toast.textContent = message;
    toast.className = `toast-notification ${type}`;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

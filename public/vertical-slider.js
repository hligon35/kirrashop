// Populate vertical sliders with images
document.addEventListener('DOMContentLoaded', function() {
    // Create and show loading spinner
    const createLoadingSpinner = () => {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        document.body.appendChild(spinner);
        return spinner;
    };
    
    const removeLoadingSpinner = (spinner) => {
        if (spinner && document.body.contains(spinner)) {
            document.body.removeChild(spinner);
        }
    };
    
    // Show loading spinner
    const loadingSpinner = createLoadingSpinner();
    
    // List of images in the folder
    const images = [
        'IMG_9914.PNG', 'IMG_9915.PNG', 'IMG_9916.PNG', 'IMG_9917.PNG', 'IMG_9918.PNG', 
        'IMG_9919.PNG', 'IMG_9920.PNG', 'IMG_9921.PNG', 'IMG_9922.PNG', 'IMG_9923.PNG', 
        'IMG_9924.PNG', 'IMG_9925.PNG', 'IMG_9926.PNG', 'IMG_9927.PNG', 'IMG_9928.PNG', 
        'IMG_9929.PNG', 'IMG_9930.PNG', 'IMG_9931.PNG', 'IMG_9932.PNG', 'IMG_9933.PNG', 
        'IMG_9934.PNG', 'IMG_9936.PNG', 'IMG_9937.PNG', 'IMG_9938.PNG', 'IMG_9939.PNG', 
        'IMG_9940.PNG', 'IMG_9941.PNG'
    ];
    
    // Preload all images for faster loading
    const preloadImages = () => {
        const preloadPromises = images.map(imgSrc => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(imgSrc);
                img.onerror = () => reject(imgSrc);
                img.src = `images/${imgSrc}`;
            });
        });
        
        return Promise.all(preloadPromises)
            .then(loadedImages => {
                console.log('All images preloaded successfully');
                return loadedImages;
            })
            .catch(failedImage => {
                console.warn(`Failed to preload image: ${failedImage}`);
                return images; // Return all images anyway to continue
            });
    };
    
    // Shuffle images for variety
    const shuffleArray = arr => {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };
    
    const leftImages = shuffleArray([...images]);
    const rightImages = shuffleArray([...images]);
    
    // Create modal elements
    const createModal = () => {
        // Remove existing modal if present
        const existingModal = document.querySelector('.slider-modal');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'slider-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.right = '0';
        modal.style.bottom = '0';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '9999';
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '20px';
        closeBtn.style.right = '25px';
        closeBtn.style.fontSize = '35px';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.cursor = 'pointer';
        
        modal.appendChild(closeBtn);
        
        // Handle closing
        const closeModal = () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        return { modal, closeModal };
    };
    
    // Generate a set of slider items
    const generateSliderItems = (container, imageSet) => {
        imageSet.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'vertical-slider-item';
            
            const imgElement = document.createElement('img');
            imgElement.src = `images/${img}`;
            imgElement.alt = `Nail Design ${index + 1}`;
            imgElement.loading = 'eager'; // Eager loading for faster initial loading
            imgElement.setAttribute('fetchpriority', 'high'); // High fetch priority
            imgElement.dataset.index = index;
            
            item.appendChild(imgElement);
            container.appendChild(item);
            
            // Add click event to open image in modal
            imgElement.addEventListener('click', function() {
                const { modal, closeModal } = createModal();
                
                const modalImg = document.createElement('img');
                modalImg.src = this.src;
                modalImg.style.maxWidth = '80%';
                modalImg.style.maxHeight = '80%';
                modalImg.style.borderRadius = '8px';
                modalImg.style.boxShadow = '0 5px 25px rgba(0, 0, 0, 0.3)';
                modalImg.style.border = '3px solid rgba(255, 255, 255, 0.2)';
                
                modal.appendChild(modalImg);
                document.body.appendChild(modal);
                
                // Fade in animation
                setTimeout(() => {
                    modal.style.opacity = '1';
                }, 50);
                
                // Close on ESC key
                document.addEventListener('keydown', function escClose(e) {
                    if (e.key === 'Escape') {
                        closeModal();
                        document.removeEventListener('keydown', escClose);
                    }
                });
            });
        });
    };
    
    // Create duplicate container for seamless infinite scrolling
    const setupInfiniteScroll = (sliderContainer) => {
        // Clear existing clones first
        const parent = sliderContainer.parentNode;
        Array.from(parent.children).forEach(child => {
            if (child !== sliderContainer && !child.id) {
                parent.removeChild(child);
            }
        });
        
        // Clone the container
        const clone = sliderContainer.cloneNode(true);
        
        // Remove any ID to avoid duplicates
        clone.removeAttribute('id');
        
        // Ensure proper positioning
        clone.style.position = 'absolute';
        clone.style.top = '100%';
        clone.style.left = '0';
        clone.style.width = '100%';
        
        // Append to parent
        sliderContainer.parentNode.appendChild(clone);
    };
    
    // Initialize sliders after preloading images
    preloadImages().then(() => {
        // Remove loading spinner
        removeLoadingSpinner(loadingSpinner);
        
        const leftImages = shuffleArray([...images]);
        const rightImages = shuffleArray([...images]);
        
        // Populate left slider
        const leftSliderContainer = document.getElementById('leftSliderContainer');
        generateSliderItems(leftSliderContainer, leftImages);
        // Add just enough duplicates, but not too many
        generateSliderItems(leftSliderContainer, leftImages.slice(0, 10));
        
        // Populate right slider
        const rightSliderContainer = document.getElementById('rightSliderContainer');
        generateSliderItems(rightSliderContainer, rightImages);
        // Add just enough duplicates, but not too many
        generateSliderItems(rightSliderContainer, rightImages.slice(0, 10));
        
        // Set up infinite scroll for both sliders
        setupInfiniteScroll(leftSliderContainer);
        setupInfiniteScroll(rightSliderContainer);
        
        // Pause animation on hover
        document.querySelectorAll('.vertical-slider-container').forEach(container => {
            container.addEventListener('mouseenter', function() {
                this.style.animationPlayState = 'paused';
            });
            
            container.addEventListener('mouseleave', function() {
                this.style.animationPlayState = 'running';
            });
        });
    });
    
    // Pause animation on hover
    document.querySelectorAll('.vertical-slider-container').forEach(container => {
        container.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused';
        });
        
        container.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running';
        });
    });
});

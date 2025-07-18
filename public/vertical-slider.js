// Populate vertical sliders with images
document.addEventListener('DOMContentLoaded', function() {
    console.log('Slider script loaded');
    
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
    
    // Hardcoded fallback images
    const FALLBACK_IMAGES = [
        'IMG_9914.PNG', 'IMG_9915.PNG', 'IMG_9916.PNG', 'IMG_9917.PNG', 'IMG_9918.PNG', 
        'IMG_9919.PNG', 'IMG_9920.PNG', 'IMG_9921.PNG', 'IMG_9922.PNG', 'IMG_9923.PNG', 
        'IMG_9924.PNG', 'IMG_9925.PNG', 'IMG_9926.PNG', 'IMG_9927.PNG', 'IMG_9928.PNG', 
        'IMG_9929.PNG', 'IMG_9930.PNG', 'IMG_9931.PNG', 'IMG_9932.PNG', 'IMG_9933.PNG', 
        'IMG_9934.PNG', 'IMG_9936.PNG', 'IMG_9937.PNG', 'IMG_9938.PNG', 'IMG_9939.PNG', 
        'IMG_9940.PNG', 'IMG_9941.PNG'
    ];
    
    // Fetch images from server
    const getImages = async () => {
        try {
            const response = await fetch('/api/gallery-images');
            if (!response.ok) throw new Error('Failed to fetch images');
            const images = await response.json();
            console.log('Images fetched successfully:', images);
            return images.length > 0 ? images : FALLBACK_IMAGES;
        } catch (error) {
            console.error('Error fetching images:', error);
            return FALLBACK_IMAGES;
        }
    };
    
    // Shuffle an array
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };
    
    // Preload images for smoother initial display
    const preloadImages = async (images) => {
        // Preload the first 10 images with high priority (visible in initial view)
        const criticalImages = images.slice(0, 10);
        const otherImages = images.slice(10);
        
        // Load critical images first with Promise.all
        const criticalPromises = criticalImages.map(image => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false); // Continue even if loading fails
                img.src = `images/${image}`;
            });
        });
        
        await Promise.all(criticalPromises);
        
        // Then start loading the remaining images in the background
        otherImages.forEach(image => {
            const img = new Image();
            img.src = `images/${image}`;
        });
    };
    
    // Add images to a slider
    const populateSlider = (containerId, images) => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }
        
        container.innerHTML = '';
        
        images.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'vertical-slider-item';
            
            const img = document.createElement('img');
            img.src = `images/${image}`;
            img.alt = `Nail Design ${index + 1}`;
            img.loading = 'eager';
            img.decoding = 'async'; // Use async decoding to improve performance
            img.setAttribute('fetchpriority', 'high'); // Set high priority for initial images
            
            // Add size hints to help browser allocate space before image loads
            img.width = img.height = 140;
            
            // Add image load error handling
            img.onerror = () => {
                console.warn(`Failed to load image: ${image}`);
                img.src = 'images/IMG_9914.PNG'; // Fallback to a default image
            };
            item.appendChild(img);
            container.appendChild(item);
        });
        
        // Set animation direction based on slider
        const isLeftSlider = container.parentElement.classList.contains('left-slider');
        container.style.animation = isLeftSlider ? 
            'scrollDown 36.85s linear infinite' :
            'scrollUp 36.85s linear infinite';
    };
    
    // Initialize sliders
    const initSliders = async () => {
        try {
            // Get images
            const images = await getImages();
            
            // Preload images before displaying them
            await preloadImages(images);
            
            // Create shuffled sets for each slider
            const leftImages = shuffleArray(images);
            const rightImages = shuffleArray(images);
            
            // Duplicate images for continuous scrolling
            const leftImageSet = [...leftImages, ...leftImages.slice(0, 10)];
            const rightImageSet = [...rightImages, ...rightImages.slice(0, 10)];
            
            // Populate sliders
            populateSlider('leftSliderContainer', leftImageSet);
            populateSlider('rightSliderContainer', rightImageSet);
            
            // Add hover pause effect
            document.querySelectorAll('.vertical-slider-container').forEach(container => {
                container.addEventListener('mouseenter', () => {
                    container.style.animationPlayState = 'paused';
                });
                
                container.addEventListener('mouseleave', () => {
                    container.style.animationPlayState = 'running';
                });
            });
            
            // Remove loading spinner
            removeLoadingSpinner(loadingSpinner);
            
            console.log('Sliders initialized successfully');
        } catch (error) {
            console.error('Error initializing sliders:', error);
            removeLoadingSpinner(loadingSpinner);
        }
    };
    
    // Initialize immediately
    initSliders();
    
    // Set up event listener for gallery updates
    window.addEventListener('galleryUpdated', initSliders);
    
    // Periodically refresh (every 5 minutes)
    setInterval(initSliders, 5 * 60 * 1000);
});

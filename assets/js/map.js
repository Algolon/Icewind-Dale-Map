class InteractiveMap {
    constructor() {
        this.mapContainer = document.getElementById('mapContainer');
        this.mapImage = document.getElementById('mapImage');
        this.coordinates = document.getElementById('coordinates');
        
        // Map state - START ZOOMED OUT
        this.scale = this.calculateInitialZoom(); // Start zoomed out to fit screen
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Map dimensions
        this.mapWidth = MAP_CONFIG.width;
        this.mapHeight = MAP_CONFIG.height;
        
        // Zoom settings
        this.minZoom = 0.1; // 10% - very zoomed out
        this.maxZoom = 3;   // 300% - detailed view
        this.zoomStep = 0.25; // 25% increments
        this.wheelZoomSensitivity = 0.1; // Smooth wheel zooming
        
        // Initialize
        this.setupEventListeners();
        this.centerMap();
        this.updateTransform();
        
        // Initialize marker manager AFTER map is set up
        setTimeout(() => {
            this.markerManager = new MarkerManager(this);
        }, 100);
        
        console.log(`Map initialized: ${Math.round(this.scale * 100)}% zoom, centered`);
    }
    
    setupEventListeners() {
        // Zoom buttons only
        this.setupZoomControls();
        
        // Mouse events
        this.setupMouseEvents();
        
        // Touch events
        this.setupTouchEvents();
        
        // Keyboard events
        this.setupKeyboardEvents();
        
        // Window events
        this.setupWindowEvents();
    }
    
    setupZoomControls() {
        // Only zoom buttons - no slider
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomIn();
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoomOut();
            });
        }
    }
    
    setupMouseEvents() {
        // Mouse down - only on map container, not markers
        this.mapContainer.addEventListener('mousedown', (e) => {
            // Don't start dragging if clicking on a marker
            if (e.target.classList.contains('marker')) return;
            this.handleMouseDown(e);
        });
        
        // Mouse move
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // Mouse up
        document.addEventListener('mouseup', () => {
            this.handleMouseUp();
        });
        
        // Wheel zoom
        this.mapContainer.addEventListener('wheel', (e) => {
            this.handleWheel(e);
        }, { passive: false });
        
        // Double click to zoom
        this.mapContainer.addEventListener('dblclick', (e) => {
            // Don't zoom if clicking on a marker
            if (e.target.classList.contains('marker')) return;
            this.handleDoubleClick(e);
        });
        
        // Prevent context menu
        this.mapContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Mouse coordinate tracking
        if (MAP_CONFIG.showCoordinates && this.coordinates) {
            this.mapContainer.addEventListener('mousemove', (e) => {
                this.updateCoordinates(e);
            });
        }
    }
    
    setupTouchEvents() {
        this.mapContainer.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: false });
        
        this.mapContainer.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        }, { passive: false });
        
        this.mapContainer.addEventListener('touchend', () => {
            this.handleTouchEnd();
        });
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            const panDistance = 50;
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.translateY += panDistance;
                    this.constrainPosition();
                    this.updateTransform();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.translateY -= panDistance;
                    this.constrainPosition();
                    this.updateTransform();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.translateX += panDistance;
                    this.constrainPosition();
                    this.updateTransform();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.translateX -= panDistance;
                    this.constrainPosition();
                    this.updateTransform();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    this.resetView();
                    break;
            }
        });
    }
    
    setupWindowEvents() {
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    // Mouse event handlers
    handleMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.mapContainer.style.cursor = 'grabbing';
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            
            this.translateX += deltaX;
            this.translateY += deltaY;
            
            this.constrainPosition();
            this.updateTransform();
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.mapContainer.style.cursor = 'grab';
    }
    
    // FIXED wheel zoom - now works properly
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom direction and new scale
        const zoomDirection = e.deltaY < 0 ? 1 : -1;
        const zoomAmount = this.wheelZoomSensitivity * zoomDirection;
        const newScale = Math.max(this.minZoom, Math.min(this.maxZoom, this.scale + zoomAmount));
        
        if (newScale !== this.scale) {
            this.zoomToPoint(mouseX, mouseY, newScale);
            console.log(`Wheel zoom to ${Math.round(newScale * 100)}%`);
        }
    }
    
    handleDoubleClick(e) {
        const rect = this.mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Double click zooms in, or out if already zoomed
        const targetZoom = this.scale >= 2 ? 1 : 2;
        this.zoomToPoint(mouseX, mouseY, targetZoom);
    }
    
    // Touch handling
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && this.isDragging) {
            const deltaX = e.touches[0].clientX - this.lastMouseX;
            const deltaY = e.touches[0].clientY - this.lastMouseY;
            
            this.translateX += deltaX;
            this.translateY += deltaY;
            
            this.constrainPosition();
            this.updateTransform();
            
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        }
    }
    
    handleTouchEnd() {
        this.isDragging = false;
    }
    
    // SIMPLE zoom methods
    zoomIn() {
        const newScale = Math.min(this.maxZoom, this.scale + this.zoomStep);
        this.zoomToCenter(newScale);
        console.log(`Zoomed in to ${Math.round(newScale * 100)}%`);
    }
    
    zoomOut() {
        const newScale = Math.max(this.minZoom, this.scale - this.zoomStep);
        this.zoomToCenter(newScale);
        console.log(`Zoomed out to ${Math.round(newScale * 100)}%`);
    }
    
    zoomToCenter(newScale) {
        const rect = this.mapContainer.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        this.zoomToPoint(centerX, centerY, newScale);
    }
    
    zoomToPoint(clientX, clientY, targetScale) {
        const newScale = Math.max(this.minZoom, Math.min(this.maxZoom, targetScale));
        
        if (newScale !== this.scale) {
            // Calculate the point in map coordinates
            const mapX = (clientX - this.translateX) / this.scale;
            const mapY = (clientY - this.translateY) / this.scale;
            
            // Update scale
            this.scale = newScale;
            
            // Recalculate position to keep point under cursor
            this.translateX = clientX - mapX * this.scale;
            this.translateY = clientY - mapY * this.scale;
            
            this.constrainPosition();
            this.updateTransform();
        }
    }
    
    // FIXED constraint method - proper boundaries
    constrainPosition() {
        const containerRect = this.mapContainer.getBoundingClientRect();
        const scaledWidth = this.mapWidth * this.scale;
        const scaledHeight = this.mapHeight * this.scale;
        
        // Don't allow panning past map edges
        const minX = containerRect.width - scaledWidth;
        const maxX = 0;
        const minY = containerRect.height - scaledHeight;
        const maxY = 0;
        
        // Constrain to boundaries
        this.translateX = Math.max(minX, Math.min(maxX, this.translateX));
        this.translateY = Math.max(minY, Math.min(maxY, this.translateY));
        
        // Special case: if map is smaller than container, center it
        if (scaledWidth < containerRect.width) {
            this.translateX = (containerRect.width - scaledWidth) / 2;
        }
        if (scaledHeight < containerRect.height) {
            this.translateY = (containerRect.height - scaledHeight) / 2;
        }
    }
    
    updateTransform() {
        this.mapImage.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
    
    updateCoordinates(e) {
        if (!this.coordinates) return;
        
        const rect = this.mapContainer.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left - this.translateX) / this.scale);
        const y = Math.round((e.clientY - rect.top - this.translateY) / this.scale);
        
        // Only show coordinates if within map bounds
        if (x >= 0 && x <= this.mapWidth && y >= 0 && y <= this.mapHeight) {
            this.coordinates.textContent = `X: ${x}, Y: ${y}`;
        } else {
            this.coordinates.textContent = 'Outside map bounds';
        }
    }
    
    // Calculate initial zoom to fit entire map on screen
    calculateInitialZoom() {
        const containerRect = this.mapContainer.getBoundingClientRect();
        
        // Calculate scale needed to fit map width and height
        const scaleX = containerRect.width / this.mapWidth;
        const scaleY = containerRect.height / this.mapHeight;
        
        // Use the smaller scale to ensure entire map fits
        const fitScale = Math.min(scaleX, scaleY);
        
        // Make it slightly smaller for padding (90% of fit scale)
        const initialScale = Math.max(this.minZoom, fitScale * 0.9);
        
        console.log(`Container: ${containerRect.width}x${containerRect.height}, Map: ${this.mapWidth}x${this.mapHeight}`);
        console.log(`Calculated initial zoom: ${Math.round(initialScale * 100)}%`);
        
        return initialScale;
    }
    
    centerMap() {
        const containerRect = this.mapContainer.getBoundingClientRect();
        
        // Center the map in the container
        this.translateX = (containerRect.width - this.mapWidth * this.scale) / 2;
        this.translateY = (containerRect.height - this.mapHeight * this.scale) / 2;
        
        console.log(`Centered map: translate(${Math.round(this.translateX)}, ${Math.round(this.translateY)})`);
        this.constrainPosition();
    }
    
    resetView() {
        this.scale = this.calculateInitialZoom();
        this.centerMap();
        this.updateTransform();
        console.log('Reset to initial zoomed-out view');
    }
    
    handleResize() {
        // Recalculate initial zoom on resize
        this.scale = this.calculateInitialZoom();
        this.centerMap();
        this.updateTransform();
        console.log('Resized and recentered map');
    }
    
    // Public API methods
    panTo(x, y) {
        const containerRect = this.mapContainer.getBoundingClientRect();
        this.translateX = containerRect.width / 2 - x * this.scale;
        this.translateY = containerRect.height / 2 - y * this.scale;
        this.constrainPosition();
        this.updateTransform();
    }
    
    zoomToMarker(markerId) {
        const marker = this.markerManager?.getMarkerById(markerId);
        if (marker) {
            this.scale = 2;
            this.panTo(marker.x, marker.y);
            console.log(`Zoomed to marker: ${marker.name}`);
        }
    }
    
    getCurrentBounds() {
        const containerRect = this.mapContainer.getBoundingClientRect();
        return {
            left: -this.translateX / this.scale,
            top: -this.translateY / this.scale,
            right: (-this.translateX + containerRect.width) / this.scale,
            bottom: (-this.translateY + containerRect.height) / this.scale
        };
    }
    
    isPointVisible(x, y) {
        const bounds = this.getCurrentBounds();
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
    }
    
    // Debug method
    debugInfo() {
        console.log('=== MAP DEBUG ===');
        console.log('Scale:', this.scale);
        console.log('Translation:', { x: this.translateX, y: this.translateY });
        console.log('Map size:', { width: this.mapWidth, height: this.mapHeight });
        console.log('Bounds:', this.getCurrentBounds());
        console.log('Markers:', this.markerManager?.markers?.length || 0);
    }
}
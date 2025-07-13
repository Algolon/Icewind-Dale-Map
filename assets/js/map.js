class InteractiveMap {
    constructor() {
        this.mapContainer = document.getElementById('mapContainer');
        this.mapImage = document.getElementById('mapImage');
        this.zoomSlider = document.getElementById('zoomSlider');
        this.zoomLevel = document.getElementById('zoomLevel');
        this.coordinates = document.getElementById('coordinates');
        
        // Map state
        this.scale = MAP_CONFIG.initialZoom;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Touch handling
        this.initialDistance = 0;
        this.initialScale = 1;
        
        // Map dimensions
        this.mapWidth = MAP_CONFIG.width;
        this.mapHeight = MAP_CONFIG.height;
        
        // Initialize
        this.setupEventListeners();
        this.centerMap();
        this.updateTransform();
        this.updateZoomLevel();
        
        // Initialize marker manager AFTER map is set up
        setTimeout(() => {
            this.markerManager = new MarkerManager(this);
        }, 100);
    }
    
    setupEventListeners() {
        // Zoom controls
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
        // Zoom slider
        this.zoomSlider.addEventListener('input', (e) => {
            const newScale = parseFloat(e.target.value);
            this.zoomToCenter(newScale);
        });
        
        // Zoom buttons
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.zoomIn();
        });
        
        document.getElementById('zoomOut').addEventListener('click', () => {
            this.zoomOut();
        });
    }
    
    setupMouseEvents() {
        // Mouse down
        this.mapContainer.addEventListener('mousedown', (e) => {
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
        
        // Wheel zoom - FIXED
        this.mapContainer.addEventListener('wheel', (e) => {
            this.handleWheel(e);
        }, { passive: false });
        
        // Double click to zoom
        this.mapContainer.addEventListener('dblclick', (e) => {
            this.handleDoubleClick(e);
        });
        
        // Prevent context menu
        this.mapContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Mouse coordinate tracking
        if (MAP_CONFIG.showCoordinates) {
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
            // Arrow keys for panning
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
    
    // FIXED wheel zoom behavior
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom direction and amount
        const zoomDirection = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = 1 + (MAP_CONFIG.wheelZoomSensitivity * zoomDirection);
        const newScale = Math.max(MAP_CONFIG.minZoom, Math.min(MAP_CONFIG.maxZoom, this.scale * zoomFactor));
        
        if (newScale !== this.scale) {
            // Calculate the point in map coordinates before zoom
            const mapX = (mouseX - this.translateX) / this.scale;
            const mapY = (mouseY - this.translateY) / this.scale;
            
            // Update scale
            this.scale = newScale;
            this.zoomSlider.value = this.scale;
            
            // Calculate new translation to keep the mouse point stationary
            this.translateX = mouseX - mapX * this.scale;
            this.translateY = mouseY - mapY * this.scale;
            
            this.constrainPosition();
            this.updateTransform();
            this.updateZoomLevel();
        }
    }
    
    handleDoubleClick(e) {
        if (e.target.classList.contains('marker')) return;
        
        const rect = this.mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const targetZoom = this.scale < 2 ? 2 : 1;
        this.zoomToPoint(mouseX, mouseY, targetZoom);
    }
    
    // Touch event handlers
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            this.isDragging = false;
            this.initialDistance = this.getTouchDistance(e.touches);
            this.initialScale = this.scale;
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
        } else if (e.touches.length === 2) {
            const currentDistance = this.getTouchDistance(e.touches);
            const scaleChange = currentDistance / this.initialDistance;
            const newScale = Math.max(MAP_CONFIG.minZoom, Math.min(MAP_CONFIG.maxZoom, this.initialScale * scaleChange));
            
            // Get center point of pinch
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            
            const rect = this.mapContainer.getBoundingClientRect();
            const touchX = centerX - rect.left;
            const touchY = centerY - rect.top;
            
            this.zoomToPoint(touchX, touchY, newScale);
        }
    }
    
    handleTouchEnd() {
        this.isDragging = false;
    }
    
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // FIXED zoom methods
    zoomIn() {
        const newScale = Math.min(MAP_CONFIG.maxZoom, this.scale + MAP_CONFIG.zoomStep);
        this.zoomToCenter(newScale);
    }
    
    zoomOut() {
        const newScale = Math.max(MAP_CONFIG.minZoom, this.scale - MAP_CONFIG.zoomStep);
        this.zoomToCenter(newScale);
    }
    
    zoomToCenter(newScale) {
        const rect = this.mapContainer.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        this.zoomToPoint(centerX, centerY, newScale);
    }
    
    zoomToPoint(clientX, clientY, targetScale) {
        const newScale = Math.max(MAP_CONFIG.minZoom, Math.min(MAP_CONFIG.maxZoom, targetScale));
        
        if (newScale !== this.scale) {
            // Calculate the point in map coordinates before zoom
            const mapX = (clientX - this.translateX) / this.scale;
            const mapY = (clientY - this.translateY) / this.scale;
            
            // Update scale
            this.scale = newScale;
            this.zoomSlider.value = this.scale;
            
            // Calculate new translation to keep the point stationary
            this.translateX = clientX - mapX * this.scale;
            this.translateY = clientY - mapY * this.scale;
            
            this.constrainPosition();
            this.updateTransform();
            this.updateZoomLevel();
        }
    }
    
    // FIXED position constraint method
    constrainPosition() {
        const containerRect = this.mapContainer.getBoundingClientRect();
        const scaledWidth = this.mapWidth * this.scale;
        const scaledHeight = this.mapHeight * this.scale;
        
        // Calculate bounds
        let minX, maxX, minY, maxY;
        
        if (scaledWidth <= containerRect.width) {
            // If image is smaller than container, center it
            minX = maxX = (containerRect.width - scaledWidth) / 2;
        } else {
            // If image is larger than container, constrain to edges
            minX = containerRect.width - scaledWidth;
            maxX = 0;
        }
        
        if (scaledHeight <= containerRect.height) {
            // If image is smaller than container, center it
            minY = maxY = (containerRect.height - scaledHeight) / 2;
        } else {
            // If image is larger than container, constrain to edges
            minY = containerRect.height - scaledHeight;
            maxY = 0;
        }
        
        this.translateX = Math.max(minX, Math.min(maxX, this.translateX));
        this.translateY = Math.max(minY, Math.min(maxY, this.translateY));
    }
    
    updateTransform() {
        this.mapImage.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
    
    updateZoomLevel() {
        if (this.zoomLevel) {
            this.zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }
    
    updateCoordinates(e) {
        if (!this.coordinates) return;
        
        const rect = this.mapContainer.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left - this.translateX) / this.scale);
        const y = Math.round((e.clientY - rect.top - this.translateY) / this.scale);
        
        // Only show coordinates if they're within the map bounds
        if (x >= 0 && x <= this.mapWidth && y >= 0 && y <= this.mapHeight) {
            this.coordinates.textContent = `X: ${x}, Y: ${y}`;
        }
    }
    
    centerMap() {
        const containerRect = this.mapContainer.getBoundingClientRect();
        this.translateX = (containerRect.width - this.mapWidth * this.scale) / 2;
        this.translateY = (containerRect.height - this.mapHeight * this.scale) / 2;
        this.constrainPosition();
    }
    
    resetView() {
        this.scale = MAP_CONFIG.initialZoom;
        this.zoomSlider.value = this.scale;
        this.centerMap();
        this.updateTransform();
        this.updateZoomLevel();
    }
    
    handleResize() {
        this.constrainPosition();
        this.updateTransform();
    }
    
    // Public API methods
    panTo(x, y, animated = true) {
        const containerRect = this.mapContainer.getBoundingClientRect();
        this.translateX = containerRect.width / 2 - x * this.scale;
        this.translateY = containerRect.height / 2 - y * this.scale;
        this.constrainPosition();
        this.updateTransform();
    }
    
    zoomToMarker(markerId) {
        const marker = this.markerManager.getMarkerById(markerId);
        if (marker) {
            // First zoom to 2x
            this.scale = 2;
            this.zoomSlider.value = this.scale;
            // Then pan to marker
            this.panTo(marker.x, marker.y);
            this.updateZoomLevel();
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
}
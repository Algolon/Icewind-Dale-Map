class InteractiveMap {
    constructor() {
        console.log('Initializing InteractiveMap...');
        
        // Get DOM elements
        this.mapContainer = document.getElementById('mapContainer');
        this.mapImage = document.getElementById('mapImage');
        this.coordinates = document.getElementById('coordinates');
        this.zoomInBtn = document.getElementById('zoomIn');
        this.zoomOutBtn = document.getElementById('zoomOut');
        
        // Validate required elements
        if (!this.mapContainer || !this.mapImage) {
            console.error('Required DOM elements not found!');
            return;
        }
        
        // Map state
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Map dimensions
        this.mapWidth = MAP_CONFIG.width;
        this.mapHeight = MAP_CONFIG.height;
        
        // Zoom settings
        this.minZoom = MAP_CONFIG.minZoom;
        this.maxZoom = MAP_CONFIG.maxZoom;
        this.zoomStep = MAP_CONFIG.zoomStep;
        this.wheelSensitivity = MAP_CONFIG.wheelZoomSensitivity;
        
        // Wait for image to load, then initialize
        if (this.mapImage.complete) {
            this.init();
        } else {
            this.mapImage.addEventListener('load', () => this.init());
            this.mapImage.addEventListener('error', () => {
                console.warn('Map image failed to load, using placeholder');
                this.init();
            });
        }
    }
    
    init() {
        console.log('Map image loaded, setting up...');
        
        // Calculate initial zoom to fit screen
        this.calculateInitialZoom();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Position map
        this.centerMap();
        this.updateTransform();
        
        // Initialize markers after a short delay
        setTimeout(() => {
            this.markerManager = new MarkerManager(this);
        }, 200);
        
        console.log(`Map initialized: ${Math.round(this.scale * 100)}% zoom`);
    }
    
    calculateInitialZoom() {
        const containerRect = this.mapContainer.getBoundingClientRect();
        
        // Calculate scale to fit entire map with padding
        const scaleX = (containerRect.width * 0.9) / this.mapWidth;
        const scaleY = (containerRect.height * 0.9) / this.mapHeight;
        
        // Use smaller scale to ensure map fits entirely
        this.scale = Math.max(this.minZoom, Math.min(scaleX, scaleY));
        
        console.log(`Container: ${Math.round(containerRect.width)}x${Math.round(containerRect.height)}`);
        console.log(`Map: ${this.mapWidth}x${this.mapHeight}`);
        console.log(`Initial zoom: ${Math.round(this.scale * 100)}%`);
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Zoom buttons
        if (this.zoomInBtn) {
            this.zoomInBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.zoomIn();
            });
        }
        
        if (this.zoomOutBtn) {
            this.zoomOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.zoomOut();
            });
        }
        
        // Mouse events
        this.mapContainer.addEventListener('mousedown', (e) => {
            if (!e.target.classList.contains('marker')) {
                this.startDrag(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            this.handleDrag(e.clientX, e.clientY);
            this.updateCoordinates(e);
        });
        
        document.addEventListener('mouseup', () => {
            this.stopDrag();
        });
        
        // Wheel zoom
        this.mapContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleWheel(e);
        }, { passive: false });
        
        // Touch events
        this.mapContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.startDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });
        
        this.mapContainer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1) {
                this.handleDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });
        
        this.mapContainer.addEventListener('touchend', () => {
            this.stopDrag();
        });
        
        // Double click zoom
        this.mapContainer.addEventListener('dblclick', (e) => {
            if (!e.target.classList.contains('marker')) {
                this.handleDoubleClick(e);
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Prevent context menu
        this.mapContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    startDrag(clientX, clientY) {
        this.isDragging = true;
        this.lastMouseX = clientX;
        this.lastMouseY = clientY;
        this.mapContainer.style.cursor = 'grabbing';
    }
    
    handleDrag(clientX, clientY) {
        if (this.isDragging) {
            const deltaX = clientX - this.lastMouseX;
            const deltaY = clientY - this.lastMouseY;
            
            this.translateX += deltaX;
            this.translateY += deltaY;
            
            this.constrainPosition();
            this.updateTransform();
            
            this.lastMouseX = clientX;
            this.lastMouseY = clientY;
        }
    }
    
    stopDrag() {
        this.isDragging = false;
        this.mapContainer.style.cursor = 'grab';
    }
    
    handleWheel(e) {
        const rect = this.mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Determine zoom direction
        const zoomIn = e.deltaY < 0;
        const zoomAmount = this.wheelSensitivity * (zoomIn ? 1 : -1);
        
        this.zoomToPoint(mouseX, mouseY, zoomAmount);
    }
    
    handleDoubleClick(e) {
        const rect = this.mapContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Smart zoom: zoom in if zoomed out, zoom out if zoomed in
        const targetZoom = this.scale < 1.5 ? 2 : this.calculateInitialZoom();
        this.zoomToPointAbsolute(mouseX, mouseY, targetZoom);
    }
    
    handleKeyboard(e) {
        const panAmount = 50;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.pan(0, panAmount);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.pan(0, -panAmount);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.pan(panAmount, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.pan(-panAmount, 0);
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
    }
    
    handleResize() {
        this.calculateInitialZoom();
        this.centerMap();
        this.updateTransform();
    }
    
    // Zoom methods
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
        this.zoomToPointAbsolute(centerX, centerY, newScale);
    }
    
    zoomToPoint(clientX, clientY, zoomAmount) {
        const newScale = Math.max(this.minZoom, Math.min(this.maxZoom, this.scale + zoomAmount));
        this.zoomToPointAbsolute(clientX, clientY, newScale);
    }
    
    zoomToPointAbsolute(clientX, clientY, newScale) {
        if (newScale === this.scale) return;
        
        // Calculate point in map coordinates before zoom
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
    
    pan(deltaX, deltaY) {
        this.translateX += deltaX;
        this.translateY += deltaY;
        this.constrainPosition();
        this.updateTransform();
    }
    
    constrainPosition() {
        const containerRect = this.mapContainer.getBoundingClientRect();
        const scaledWidth = this.mapWidth * this.scale;
        const scaledHeight = this.mapHeight * this.scale;
        
        // Calculate bounds
        let minX = containerRect.width - scaledWidth;
        let maxX = 0;
        let minY = containerRect.height - scaledHeight;
        let maxY = 0;
        
        // If map is smaller than container, center it
        if (scaledWidth <= containerRect.width) {
            minX = maxX = (containerRect.width - scaledWidth) / 2;
        }
        if (scaledHeight <= containerRect.height) {
            minY = maxY = (containerRect.height - scaledHeight) / 2;
        }
        
        // Apply constraints
        this.translateX = Math.max(minX, Math.min(maxX, this.translateX));
        this.translateY = Math.max(minY, Math.min(maxY, this.translateY));
    }
    
    centerMap() {
        const containerRect = this.mapContainer.getBoundingClientRect();
        const scaledWidth = this.mapWidth * this.scale;
        const scaledHeight = this.mapHeight * this.scale;
        
        this.translateX = (containerRect.width - scaledWidth) / 2;
        this.translateY = (containerRect.height - scaledHeight) / 2;
        
        console.log(`Centered: translate(${Math.round(this.translateX)}, ${Math.round(this.translateY)})`);
    }
    
    updateTransform() {
        if (this.mapImage) {
            this.mapImage.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        }
    }
    
    updateCoordinates(e) {
        if (!this.coordinates || !this.mapContainer.contains(e.target)) return;
        
        const rect = this.mapContainer.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left - this.translateX) / this.scale);
        const y = Math.round((e.clientY - rect.top - this.translateY) / this.scale);
        
        if (x >= 0 && x <= this.mapWidth && y >= 0 && y <= this.mapHeight) {
            this.coordinates.textContent = `X: ${x}, Y: ${y}`;
        } else {
            this.coordinates.textContent = 'Outside map';
        }
    }
    
    resetView() {
        this.calculateInitialZoom();
        this.centerMap();
        this.updateTransform();
        console.log('Reset to initial view');
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
        if (!this.markerManager) return;
        
        const marker = this.markerManager.getMarkerById(markerId);
        if (marker) {
            this.scale = 2;
            this.panTo(marker.x, marker.y);
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
    
    debugInfo() {
        console.log('=== MAP DEBUG ===');
        console.log('Scale:', this.scale);
        console.log('Translation:', { x: this.translateX, y: this.translateY });
        console.log('Map size:', { width: this.mapWidth, height: this.mapHeight });
        console.log('Container size:', this.mapContainer.getBoundingClientRect());
        console.log('Markers:', this.markerManager?.markers?.length || 0);
    }
}
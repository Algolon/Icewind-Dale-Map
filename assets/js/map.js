class InteractiveMap {
    constructor() {
        this.container = document.getElementById('map-container');
        this.viewport = document.getElementById('map-viewport');
        this.image = document.getElementById('map-image');
        this.markerLayer = document.getElementById('marker-layer');
        this.coordDisplay = document.getElementById('coordinates');
        this.popup = document.getElementById('popup');
        
        // Map state
        this.scale = 1;
        this.x = 0;
        this.y = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        
        // Markers
        this.markers = [];
        this.markerManager = null;
        
        // Initialize
        this.init();
    }
    
    init() {
        // Show loading state
        this.showLoading();
        
        // Wait for image to load
        if (this.image.complete) {
            this.onImageLoad();
        } else {
            this.image.addEventListener('load', () => this.onImageLoad());
            this.image.addEventListener('error', () => this.onImageError());
        }
        
        this.setupEventListeners();
    }
    
    showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.textContent = 'Loading map...';
        loading.id = 'loading-indicator';
        document.body.appendChild(loading);
    }
    
    hideLoading() {
        const loading = document.getElementById('loading-indicator');
        if (loading) loading.remove();
    }
    
    onImageLoad() {
        this.hideLoading();
        this.setupMap();
        
        // Initialize marker manager
        this.markerManager = new MarkerManager(this);
        this.markerManager.loadMarkers();
        
        if (DEBUG) console.log('Map loaded successfully');
    }
    
    onImageError() {
        this.hideLoading();
        console.error('Failed to load map image. Please check the map.jpg file exists.');
        alert('Failed to load map image. Please ensure map.jpg is in the root directory.');
    }
    
    setupMap() {
        // Calculate initial scale to fit map in viewport
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        
        const scaleX = containerWidth / MAP_CONFIG.mapWidth;
        const scaleY = containerHeight / MAP_CONFIG.mapHeight;
        this.scale = Math.min(scaleX, scaleY) * MAP_CONFIG.initialPadding;
        
        // Ensure we don't zoom out too far
        this.scale = Math.max(this.scale, MAP_CONFIG.minZoom);
        
        // Center the map
        this.x = (containerWidth - MAP_CONFIG.mapWidth * this.scale) / 2;
        this.y = (containerHeight - MAP_CONFIG.mapHeight * this.scale) / 2;
        
        this.updateTransform();
    }
    
    setupEventListeners() {
        // Mouse events
        this.container.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
        
        // Touch events
        let touchStartDistance = 0;
        let touchStartScale = 1;
        
        this.container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.startDrag(e.touches[0]);
            } else if (e.touches.length === 2) {
                // Pinch zoom start
                touchStartDistance = this.getTouchDistance(e.touches);
                touchStartScale = this.scale;
            }
        });
        
        this.container.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && this.isDragging) {
                this.drag(e.touches[0]);
            } else if (e.touches.length === 2) {
                // Pinch zoom
                const currentDistance = this.getTouchDistance(e.touches);
                const scale = (currentDistance / touchStartDistance) * touchStartScale;
                this.setScale(scale);
            }
        });
        
        this.container.addEventListener('touchend', () => this.endDrag());
        
        // Wheel zoom
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.wheelZoom(e);
        });
        
        // Button controls
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        
        // Coordinate tracking
        this.container.addEventListener('mousemove', (e) => this.updateCoordinates(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    startDrag(e) {
        this.isDragging = true;
        this.container.classList.add('grabbing');
        this.startX = e.clientX - this.x;
        this.startY = e.clientY - this.y;
    }
    
    drag(e) {
        if (!this.isDragging) return;
        
        this.x = e.clientX - this.startX;
        this.y = e.clientY - this.startY;
        
        this.constrainPosition();
        this.updateTransform();
    }
    
    endDrag() {
        this.isDragging = false;
        this.container.classList.remove('grabbing');
    }
    
    wheelZoom(e) {
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calculate zoom
        const delta = e.deltaY > 0 ? -MAP_CONFIG.wheelZoomStep : MAP_CONFIG.wheelZoomStep;
        const newScale = this.scale * (1 + delta);
        
        // Apply zoom centered on mouse position
        this.zoomToPoint(newScale, mouseX, mouseY);
    }
    
    zoomIn() {
        const newScale = this.scale * (1 + MAP_CONFIG.zoomStep);
        this.zoomToCenter(newScale);
    }
    
    zoomOut() {
        const newScale = this.scale * (1 - MAP_CONFIG.zoomStep);
        this.zoomToCenter(newScale);
    }
    
    zoomToCenter(newScale) {
        const centerX = this.container.clientWidth / 2;
        const centerY = this.container.clientHeight / 2;
        this.zoomToPoint(newScale, centerX, centerY);
    }
    
    zoomToPoint(newScale, pointX, pointY) {
        // Clamp scale
        newScale = Math.max(MAP_CONFIG.minZoom, Math.min(MAP_CONFIG.maxZoom, newScale));
        
        if (newScale !== this.scale) {
            // Calculate new position to keep point stationary
            const scaleRatio = newScale / this.scale;
            this.x = pointX - (pointX - this.x) * scaleRatio;
            this.y = pointY - (pointY - this.y) * scaleRatio;
            this.scale = newScale;
            
            this.constrainPosition();
            this.updateTransform();
        }
    }
    
    setScale(scale) {
        this.scale = Math.max(MAP_CONFIG.minZoom, Math.min(MAP_CONFIG.maxZoom, scale));
        this.constrainPosition();
        this.updateTransform();
    }
    
    constrainPosition() {
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;
        const scaledWidth = MAP_CONFIG.mapWidth * this.scale;
        const scaledHeight = MAP_CONFIG.mapHeight * this.scale;
        
        if (scaledWidth <= containerWidth) {
            // Center horizontally if map is smaller than container
            this.x = (containerWidth - scaledWidth) / 2;
        } else {
            // Don't allow map to go too far outside viewport
            const maxX = containerWidth * MAP_CONFIG.boundaryPadding;
            const minX = containerWidth * (1 - MAP_CONFIG.boundaryPadding) - scaledWidth;
            this.x = Math.max(minX, Math.min(maxX, this.x));
        }
        
        if (scaledHeight <= containerHeight) {
            // Center vertically if map is smaller than container
            this.y = (containerHeight - scaledHeight) / 2;
        } else {
            // Don't allow map to go too far outside viewport
            const maxY = containerHeight * MAP_CONFIG.boundaryPadding;
            const minY = containerHeight * (1 - MAP_CONFIG.boundaryPadding) - scaledHeight;
            this.y = Math.max(minY, Math.min(maxY, this.y));
        }
    }
    
    updateTransform() {
        this.viewport.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.scale})`;
        
        // Update marker scale
        if (this.markerManager) {
            this.markerManager.updateMarkerScale(this.scale);
        }
        
        if (DEBUG) {
            console.log(`Transform: x=${this.x.toFixed(1)}, y=${this.y.toFixed(1)}, scale=${this.scale.toFixed(2)}`);
        }
    }
    
    updateCoordinates(e) {
        const rect = this.container.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.x) / this.scale;
        const y = (e.clientY - rect.top - this.y) / this.scale;
        
        if (x >= 0 && x <= MAP_CONFIG.mapWidth && y >= 0 && y <= MAP_CONFIG.mapHeight) {
            this.coordDisplay.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
        } else {
            this.coordDisplay.textContent = 'Outside map';
        }
    }
    
    handleResize() {
        // Recalculate constraints
        this.constrainPosition();
        this.updateTransform();
    }
    
    handleKeyboard(e) {
        switch(e.key) {
            case '+':
            case '=':
                this.zoomIn();
                break;
            case '-':
            case '_':
                this.zoomOut();
                break;
            case '0':
                this.resetView();
                break;
            case 'h':
            case 'H':
                this.showHelp();
                break;
        }
    }
    
    resetView() {
        this.setupMap();
    }
    
    showHelp() {
        alert(`Keyboard Shortcuts:
        + / - : Zoom in/out
        0 : Reset view
        H : Show this help
        
Mouse Controls:
        Scroll : Zoom
        Drag : Pan
        Click marker : Show details`);
    }
    
    // Public API
    getMapState() {
        return {
            scale: this.scale,
            x: this.x,
            y: this.y,
            width: MAP_CONFIG.mapWidth,
            height: MAP_CONFIG.mapHeight
        };
    }
    
    panTo(x, y, scale = null) {
        if (scale !== null) {
            this.scale = Math.max(MAP_CONFIG.minZoom, Math.min(MAP_CONFIG.maxZoom, scale));
        }
        
        // Convert map coordinates to viewport coordinates
        const centerX = this.container.clientWidth / 2;
        const centerY = this.container.clientHeight / 2;
        
        this.x = centerX - x * this.scale;
        this.y = centerY - y * this.scale;
        
        this.constrainPosition();
        this.updateTransform();
    }
}
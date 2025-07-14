// Main Application
class MapApplication {
    constructor() {
        this.map = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        console.log('Starting MapApplication...');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        console.log('Initializing application...');
        
        // Validate DOM elements
        if (!this.validateDOM()) {
            console.error('Required DOM elements missing!');
            return;
        }
        
        // Initialize map
        this.map = new InteractiveMap();
        
        // Setup additional features
        this.setupKeyboardShortcuts();
        this.setupLegendInteractions();
        
        this.isInitialized = true;
        console.log('Application initialized successfully!');
        
        // Debug info after initialization
        setTimeout(() => {
            if (this.map && this.map.markerManager) {
                console.log(`Map ready with ${this.map.markerManager.markers.length} markers`);
            }
        }, 500);
    }

    validateDOM() {
        const required = [
            'mapContainer',
            'mapImage', 
            'zoomIn',
            'zoomOut',
            'coordinates'
        ];
        
        const missing = required.filter(id => !document.getElementById(id));
        
        if (missing.length > 0) {
            console.error('Missing required elements:', missing);
            return false;
        }
        
        return true;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't handle if user is typing
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Don't interfere with map's built-in shortcuts
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', '=', '0'].includes(e.key)) {
                return;
            }

            switch(e.key.toLowerCase()) {
                case 'h':
                    e.preventDefault();
                    this.showHelp();
                    break;
                case 'r':
                    e.preventDefault();
                    if (this.map) this.map.resetView();
                    break;
                case 'd':
                    e.preventDefault();
                    if (this.map) this.map.debugInfo();
                    break;
                case 'escape':
                    if (this.map && this.map.markerManager) {
                        this.map.markerManager.closePopup();
                    }
                    break;
            }
        });
    }

    setupLegendInteractions() {
        // This can be enhanced later
        console.log('Legend interactions ready');
    }

    showHelp() {
        const helpText = `
ICEWIND DALE MAP CONTROLS:

MOUSE/TOUCH:
• Drag: Pan the map
• Scroll wheel: Zoom in/out
• Double-click: Smart zoom
• Click markers: Show details

KEYBOARD:
• Arrow keys: Pan map
• + / - : Zoom in/out
• 0: Reset to initial view
• H: Show this help
• R: Reset view
• D: Debug info
• Escape: Close popups

BUTTONS:
• + button: Zoom in
• - button: Zoom out

MAP FEATURES:
• Green markers: Towns
• Blue markers: Points of interest
• Purple markers: Dungeons
• Orange markers: Camps
• Red markers: Custom locations
        `;
        
        alert(helpText.trim());
    }

    // Public API
    getMap() {
        return this.map;
    }

    addCustomMarker(x, y, name, description, type = 'custom') {
        if (!this.map || !this.map.markerManager) {
            console.error('Map not ready yet');
            return null;
        }

        const marker = {
            id: `custom-${Date.now()}`,
            x: x,
            y: y,
            type: type,
            name: name,
            description: description,
            notable: 'User added marker'
        };

        return this.map.markerManager.addMarker(marker);
    }

    searchLocations(query) {
        if (!this.map || !this.map.markerManager) return [];
        return this.map.markerManager.searchMarkers(query);
    }

    goToLocation(locationId) {
        if (!this.map) return false;
        this.map.zoomToMarker(locationId);
        return true;
    }

    debugInfo() {
        if (!this.isInitialized) {
            console.log('Application not yet initialized');
            return;
        }
        
        console.log('=== APPLICATION DEBUG ===');
        console.log('App initialized:', this.isInitialized);
        console.log('Map available:', !!this.map);
        
        if (this.map) {
            this.map.debugInfo();
        }
    }
}

// Global variables
let mapApp;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, starting application...');
    mapApp = new MapApplication();
    
    // Make globally accessible
    window.mapApp = mapApp;
});

// Global utility functions
window.addMarker = function(x, y, name, description, type = 'custom') {
    if (!mapApp || !mapApp.isInitialized) {
        console.error('Map not ready. Please wait for initialization.');
        return null;
    }
    return mapApp.addCustomMarker(x, y, name, description, type);
};

window.searchMap = function(query) {
    return mapApp ? mapApp.searchLocations(query) : [];
};

window.goTo = function(locationId) {
    return mapApp ? mapApp.goToLocation(locationId) : false;
};

window.debugMap = function() {
    if (mapApp) {
        mapApp.debugInfo();
    } else {
        console.log('Map application not available');
    }
};

window.resetMap = function() {
    if (mapApp && mapApp.map) {
        mapApp.map.resetView();
    }
};

// Error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});

// Console welcome message
console.log('Icewind Dale Interactive Map');
console.log('Available functions: addMarker(), searchMap(), goTo(), debugMap(), resetMap()');
console.log('Press H for help once loaded');

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapApplication;
}
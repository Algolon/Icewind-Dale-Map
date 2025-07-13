// Main application initialization
class MapApplication {
    constructor() {
        this.map = null;
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        console.log('Initializing Icewind Dale Interactive Map...');
        
        // Check if required elements exist
        if (!this.validateRequiredElements()) {
            console.error('Required DOM elements not found!');
            return;
        }
        
        // Initialize the main map
        this.map = new InteractiveMap();
        
        // Setup additional UI components
        this.setupLegendInteractions();
        this.setupKeyboardShortcuts();
        this.setupAccessibility();
        
        // Add custom event listeners
        this.setupCustomEvents();
        
        this.isInitialized = true;
        console.log('Icewind Dale Interactive Map initialized successfully');
        
        // Debug info
        setTimeout(() => {
            if (this.map && this.map.markerManager) {
                console.log(`Map loaded with ${this.map.markerManager.markers.length} markers`);
                console.log(`Marker elements created: ${this.map.markerManager.markerElements.length}`);
            }
        }, 1000);
    }

    validateRequiredElements() {
        const required = ['mapContainer', 'mapImage', 'zoomSlider', 'zoomIn', 'zoomOut'];
        const missing = required.filter(id => !document.getElementById(id));
        
        if (missing.length > 0) {
            console.error('Missing required elements:', missing);
            return false;
        }
        
        return true;
    }

    setupLegendInteractions() {
        const legend = document.querySelector('.legend');
        if (!legend) {
            console.warn('Legend element not found');
            return;
        }

        // Make legend items clickable to toggle marker types
        const legendItems = legend.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            const markerElement = item.querySelector('.legend-marker');
            if (!markerElement) return;

            // Determine marker type from background color
            const backgroundColor = window.getComputedStyle(markerElement).backgroundColor;
            let markerType = this.getMarkerTypeFromColor(backgroundColor);

            if (markerType) {
                item.style.cursor = 'pointer';
                item.setAttribute('title', `Click to toggle ${MARKER_TYPES[markerType].label}`);
                
                item.addEventListener('click', () => {
                    this.toggleMarkerType(markerType, item);
                });
            }
        });
    }

    getMarkerTypeFromColor(color) {
        // Convert RGB to hex or match against known colors
        const colorMap = {
            'rgb(76, 175, 80)': 'town',      // #4CAF50
            'rgb(33, 150, 243)': 'poi',      // #2196F3
            'rgb(156, 39, 176)': 'dungeon',  // #9C27B0
            'rgb(255, 152, 0)': 'camp',      // #FF9800
            'rgb(255, 68, 68)': 'custom'     // #ff4444
        };
        
        return colorMap[color] || null;
    }

    toggleMarkerType(markerType, legendItem) {
        if (!this.map || !this.map.markerManager) {
            console.warn('Map or marker manager not available');
            return;
        }

        // Toggle markers
        this.map.markerManager.toggleMarkersByType(markerType);
        
        // Update legend item appearance
        const isHidden = legendItem.style.opacity === '0.5';
        legendItem.style.opacity = isHidden ? '1' : '0.5';
        
        // Update title
        const action = isHidden ? 'Hide' : 'Show';
        legendItem.setAttribute('title', `Click to ${action.toLowerCase()} ${MARKER_TYPES[markerType].label}`);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Don't interfere with map's own keyboard handling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '+', '-', '=', '0'].includes(e.key)) {
                return;
            }

            switch(e.key) {
                case 'h':
                case 'H':
                    e.preventDefault();
                    this.showHelp();
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    if (this.map) this.map.resetView();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'l':
                case 'L':
                    e.preventDefault();
                    this.toggleLegend();
                    break;
                case 'c':
                case 'C':
                    e.preventDefault();
                    this.toggleCoordinates();
                    break;
                case 'Escape':
                    // Close any open popups
                    if (this.map && this.map.markerManager) {
                        this.map.markerManager.closePopup();
                    }
                    break;
            }
        });
    }

    setupAccessibility() {
        // Add skip link for screen readers
        const skipLink = document.createElement('a');
        skipLink.href = '#mapContainer';
        skipLink.textContent = 'Skip to map';
        skipLink.className = 'sr-only';
        skipLink.style.cssText = `
            position: absolute;
            left: -10000px;
            top: auto;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.cssText = `
                position: absolute;
                left: 6px;
                top: 7px;
                z-index: 999999;
                padding: 8px 16px;
                background: #000;
                color: #fff;
                text-decoration: none;
                border-radius: 3px;
            `;
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.cssText = `
                position: absolute;
                left: -10000px;
                top: auto;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `;
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add ARIA labels to main components
        const mapContainer = document.getElementById('mapContainer');
        if (mapContainer) {
            mapContainer.setAttribute('role', 'application');
            mapContainer.setAttribute('aria-label', 'Interactive map of Icewind Dale');
        }
    }

    setupCustomEvents() {
        // Custom event for when markers are loaded
        document.addEventListener('markersLoaded', (e) => {
            console.log(`Loaded ${e.detail.count} markers`);
        });

        // Custom event for marker clicks
        document.addEventListener('markerClicked', (e) => {
            console.log(`Marker clicked: ${e.detail.marker.name}`);
        });
    }

    // Utility methods
    showHelp() {
        const helpText = `
Icewind Dale Interactive Map - Controls:

MOUSE/TOUCH:
• Drag: Pan the map
• Scroll wheel: Zoom in/out
• Pinch gesture: Zoom (mobile)
• Double-click: Zoom to location
• Click markers: Show details

KEYBOARD:
• Arrow keys: Pan the map
• + / - : Zoom in/out
• 0: Reset view to center
• H: Show this help
• R: Reset to center view
• F: Toggle fullscreen
• L: Toggle legend visibility
• C: Toggle coordinates display
• Escape: Close popups

LEGEND:
• Click legend items to toggle marker types
• Green: Towns and settlements
• Blue: Points of interest
• Purple: Dungeons (custom)
• Orange: Camps (custom)
• Red: Custom markers

COORDINATES:
• Hover over map to see X,Y coordinates
• Use these coordinates to add new markers
        `;
        
        alert(helpText.trim());
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen not supported or denied:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    toggleLegend() {
        const legend = document.querySelector('.legend');
        if (legend) {
            const isHidden = legend.style.display === 'none';
            legend.style.display = isHidden ? 'block' : 'none';
            console.log(`Legend ${isHidden ? 'shown' : 'hidden'}`);
        }
    }

    toggleCoordinates() {
        const coordinates = document.querySelector('.coordinates');
        if (coordinates) {
            const isHidden = coordinates.style.display === 'none';
            coordinates.style.display = isHidden ? 'block' : 'none';
            console.log(`Coordinates ${isHidden ? 'shown' : 'hidden'}`);
        }
    }

    // Public API for external usage
    getMap() {
        return this.map;
    }

    addCustomMarker(x, y, name, description, type = 'custom') {
        if (!this.map || !this.map.markerManager) {
            console.error('Map not initialized yet');
            return null;
        }

        const marker = {
            id: `custom-${Date.now()}`,
            x: x,
            y: y,
            type: type,
            name: name,
            description: description,
            notable: 'Custom marker added by user'
        };

        console.log('Adding custom marker:', marker);
        return this.map.markerManager.addMarker(marker);
    }

    exportMapData() {
        if (!this.map || !this.map.markerManager) return null;
        
        return {
            markers: this.map.markerManager.exportMarkers(),
            mapState: {
                zoom: this.map.scale,
                center: {
                    x: -this.map.translateX / this.map.scale + window.innerWidth / 2 / this.map.scale,
                    y: -this.map.translateY / this.map.scale + window.innerHeight / 2 / this.map.scale
                }
            },
            timestamp: new Date().toISOString()
        };
    }

    importMapData(data) {
        if (!this.map || !this.map.markerManager) return false;
        
        try {
            if (data.markers) {
                this.map.markerManager.importMarkers(data.markers);
            }
            
            if (data.mapState) {
                if (data.mapState.zoom) {
                    this.map.scale = data.mapState.zoom;
                    this.map.zoomSlider.value = this.map.scale;
                    this.map.updateZoomLevel();
                }
                
                if (data.mapState.center) {
                    this.map.panTo(data.mapState.center.x, data.mapState.center.y);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Failed to import map data:', error);
            return false;
        }
    }

    // Search functionality
    searchLocations(query) {
        if (!this.map || !this.map.markerManager) return [];
        
        return this.map.markerManager.searchMarkers(query);
    }

    // Navigate to a specific location
    goToLocation(locationId) {
        if (!this.map || !this.map.markerManager) return false;
        
        const marker = this.map.markerManager.getMarkerById(locationId);
        if (marker) {
            this.map.zoomToMarker(locationId);
            return true;
        }
        return false;
    }

    // Debug methods
    debugInfo() {
        if (!this.isInitialized) {
            console.log('Map not yet initialized');
            return;
        }
        
        console.log('=== MAP DEBUG INFO ===');
        console.log('Map scale:', this.map.scale);
        console.log('Map translation:', { x: this.map.translateX, y: this.map.translateY });
        console.log('Map dimensions:', { width: this.map.mapWidth, height: this.map.mapHeight });
        console.log('Markers loaded:', this.map.markerManager.markers.length);
        console.log('Marker elements:', this.map.markerManager.markerElements.length);
        console.log('Current bounds:', this.map.getCurrentBounds());
        
        // List all markers
        console.log('Markers:');
        this.map.markerManager.markers.forEach(marker => {
            console.log(`  - ${marker.name} (${marker.type}) at (${marker.x}, ${marker.y})`);
        });
    }
}

// Global app instance
let mapApp;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing map application...');
    mapApp = new MapApplication();
    
    // Make mapApp globally accessible for debugging and external scripts
    window.mapApp = mapApp;
    
    // Add debug function to window
    window.debugMap = () => mapApp.debugInfo();
});

// Global utility functions for easy access
window.addMarker = function(x, y, name, description, type = 'custom') {
    if (!mapApp || !mapApp.isInitialized) {
        console.error('Map not initialized yet. Please wait a moment and try again.');
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

window.exportMap = function() {
    return mapApp ? mapApp.exportMapData() : null;
};

window.importMap = function(data) {
    return mapApp ? mapApp.importMapData(data) : false;
};

// Add helpful console messages
console.log('Icewind Dale Interactive Map - Available global functions:');
console.log('- addMarker(x, y, name, description, type)');
console.log('- searchMap(query)');
console.log('- goTo(locationId)');
console.log('- exportMap()');
console.log('- importMap(data)');
console.log('- debugMap()');
console.log('Press H key for help once the map loads.');

// Error handling for unhandled errors
window.addEventListener('error', (e) => {
    console.error('Unhandled error in map application:', e.error);
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
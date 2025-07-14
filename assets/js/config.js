// Map Configuration
const MAP_CONFIG = {
    // Map dimensions (should match your actual image dimensions)
    width: 6000,
    height: 4215,
    
    // Zoom settings
    minZoom: 0.25,
    maxZoom: 3,
    initialZoom: 1,
    zoomStep: 0.25,
    wheelZoomSensitivity: 0.1,
    
    // Touch settings
    touchZoomSensitivity: 0.001,
    
    // Animation settings
    transitionDuration: 0.1,
    
    // Marker settings
    markerSize: 20,
    markerHoverScale: 1.2,
    
    // Popup settings
    popupMaxWidth: 300,
    popupMinWidth: 250,
    popupOffset: 10,
    
    // UI settings
    showCoordinates: true,
    showLegend: true,
    showZoomControls: true,
    
    // File paths
    paths: {
        markerData: 'assets/data/markers.json',
        locationData: 'assets/data/locations.json',
        images: 'assets/images/',
        icons: 'assets/images/icons/'
    }
};

// Marker Type Configuration
const MARKER_TYPES = {
    town: {
        color: '#4CAF50',
        hoverColor: '#66bb6a',
        label: 'Towns',
        icon: null // Use default circle or specify icon path
    },
    poi: {
        color: '#2196F3',
        hoverColor: '#42a5f5',
        label: 'Points of Interest',
        icon: null
    },
    dungeon: {
        color: '#9C27B0',
        hoverColor: '#BA68C8',
        label: 'Dungeons',
        icon: null
    },
    camp: {
        color: '#FF9800',
        hoverColor: '#FFB74D',
        label: 'Camps',
        icon: null
    },
    custom: {
        color: '#ff4444',
        hoverColor: '#ff6666',
        label: 'Custom Markers',
        icon: null
    }
};

// UI Messages
const UI_MESSAGES = {
    loadingMarkers: 'Loading markers...',
    errorLoadingMarkers: 'Failed to load markers',
    noMarkersFound: 'No markers found',
    coordinatesLabel: 'X: {x}, Y: {y}',
    zoomLabel: '{zoom}%'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MAP_CONFIG, MARKER_TYPES, UI_MESSAGES };
}
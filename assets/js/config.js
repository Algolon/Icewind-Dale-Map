// Map Configuration
const MAP_CONFIG = {
    // Map dimensions (should match your actual image dimensions)
    width: 6000,
    height: 4215,
    
    // Zoom settings
    minZoom: 0.1,
    maxZoom: 3,
    initialZoom: 'auto', // Will be calculated to fit screen
    zoomStep: 0.25,
    wheelZoomSensitivity: 0.1,
    
    // UI settings
    showCoordinates: true,
    showLegend: true,
    showZoomControls: true,
    
    // File paths
    paths: {
        markerData: 'assets/data/markers.json',
        images: 'assets/images/',
        icons: 'assets/images/icons/'
    },
    
    // Popup settings
    popupOffset: 10
};

// Marker Type Configuration
const MARKER_TYPES = {
    town: {
        color: '#4CAF50',
        hoverColor: '#66bb6a',
        label: 'Towns'
    },
    poi: {
        color: '#2196F3',
        hoverColor: '#42a5f5',
        label: 'Points of Interest'
    },
    dungeon: {
        color: '#9C27B0',
        hoverColor: '#BA68C8',
        label: 'Dungeons'
    },
    camp: {
        color: '#FF9800',
        hoverColor: '#FFB74D',
        label: 'Camps'
    },
    custom: {
        color: '#ff4444',
        hoverColor: '#ff6666',
        label: 'Custom Markers'
    }
};

console.log('Config loaded successfully');
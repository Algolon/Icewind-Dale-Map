// Map Configuration
const MAP_CONFIG = {
    // Map dimensions (your actual map size)
    mapWidth: 6000,
    mapHeight: 4215,
    
    // Zoom settings
    minZoom: 0.1,
    maxZoom: 4,
    zoomStep: 0.25,
    wheelZoomStep: 0.1,
    
    // Initial view padding
    initialPadding: 0.9,
    
    // Boundary constraints
    boundaryPadding: 0.1
};

// Marker Types Configuration
const MARKER_TYPES = {
    town: {
        name: 'Town',
        color: '#4ade80',
        icon: '🏘️'
    },
    poi: {
        name: 'Point of Interest',
        color: '#60a5fa',
        icon: '📍'
    },
    dungeon: {
        name: 'Dungeon',
        color: '#c084fc',
        icon: '⚔️'
    },
    camp: {
        name: 'Camp',
        color: '#fb923c',
        icon: '🏕️'
    },
    custom: {
        name: 'Custom',
        color: '#ef4444',
        icon: '⭐'
    }
};

// Debug mode
const DEBUG = false;
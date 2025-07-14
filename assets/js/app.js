// Global map instance
let mapInstance = null;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing D&D Interactive Map...');
    
    // Create map instance
    mapInstance = new InteractiveMap();
    
    // Expose useful functions globally for console access
    window.mapApp = {
        map: mapInstance,
        
        // Utility functions
        addMarker: (x, y, name, description, type = 'custom') => {
            const id = `custom-${Date.now()}`;
            const markerData = {
                id,
                x,
                y,
                type,
                name,
                description
            };
            mapInstance.markerManager.addMarker(markerData);
            return id;
        },
        
        removeMarker: (id) => {
            mapInstance.markerManager.removeMarker(id);
        },
        
        searchMarkers: (query) => {
            const results = mapInstance.markerManager.searchMarkers(query);
            console.table(results);
            return results;
        },
        
        panToMarker: (id) => {
            const marker = mapInstance.markerManager.getMarker(id);
            if (marker) {
                mapInstance.panTo(marker.x, marker.y, 2);
            } else {
                console.error('Marker not found:', id);
            }
        },
        
        exportMarkers: () => {
            const json = mapInstance.markerManager.exportMarkers();
            console.log('Markers exported. Copy the following JSON:');
            console.log(json);
            return json;
        },
        
        importMarkers: (json) => {
            const success = mapInstance.markerManager.importMarkers(json);
            if (success) {
                console.log('Markers imported successfully');
            } else {
                console.error('Failed to import markers');
            }
            return success;
        },
        
        getStats: () => {
            const stats = mapInstance.markerManager.getStats();
            console.log('Map Statistics:');
            console.log(`Total markers: ${stats.total}`);
            console.log('By type:');
            Object.entries(stats.byType).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
            return stats;
        },
        
        resetView: () => {
            mapInstance.resetView();
            console.log('View reset to initial state');
        },
        
        toggleMarkerType: (type, visible = null) => {
            if (visible === null) {
                // Toggle current state
                const marker = mapInstance.markerManager.markerElements.values().next().value;
                visible = marker && marker.style.display === 'none';
            }
            mapInstance.markerManager.toggleMarkerType(type, visible);
            console.log(`${type} markers ${visible ? 'shown' : 'hidden'}`);
        },
        
        debugInfo: () => {
            const state = mapInstance.getMapState();
            console.log('Map Debug Information:');
            console.log(`Scale: ${state.scale.toFixed(2)}`);
            console.log(`Position: (${state.x.toFixed(0)}, ${state.y.toFixed(0)})`);
            console.log(`Map size: ${state.width} x ${state.height}`);
            console.log(`Viewport: ${window.innerWidth} x ${window.innerHeight}`);
            return state;
        }
    };
    
    // Add console helpers
    window.addMarker = window.mapApp.addMarker;
    window.searchMap = window.mapApp.searchMarkers;
    window.exportMap = window.mapApp.exportMarkers;
    window.debugMap = window.mapApp.debugInfo;
    
    console.log('Map initialized! Available commands:');
    console.log('- addMarker(x, y, name, description)');
    console.log('- searchMap(query)');
    console.log('- exportMap()');
    console.log('- debugMap()');
    console.log('- mapApp.[various methods]');
    
    // Show initial stats
    setTimeout(() => {
        const stats = window.mapApp.getStats();
        console.log(`Loaded ${stats.total} markers`);
    }, 1000);
});
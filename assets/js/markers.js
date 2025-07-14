class MarkerManager {
    constructor(mapInstance) {
        this.map = mapInstance;
        this.markers = [];
        this.markerElements = [];
        this.activePopup = null;
        
        // Load markers with proper error handling
        this.loadMarkers();
    }

    async loadMarkers() {
        try {
            console.log('Loading markers from JSON file...');
            const response = await fetch(MAP_CONFIG.paths.markerData);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.markers || !Array.isArray(data.markers)) {
                throw new Error('Invalid JSON structure - missing markers array');
            }
            
            this.markers = data.markers;
            console.log(`Successfully loaded ${this.markers.length} markers from JSON file`);
            
        } catch (error) {
            console.warn('Failed to load external markers:', error.message);
            console.log('Using minimal fallback markers...');
            
            // Minimal fallback - just a few key locations
            this.markers = this.getMinimalFallback();
        }
        
        // Create marker elements
        this.createMarkerElements();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('markersLoaded', {
            detail: { count: this.markers.length }
        }));
    }

    createMarkerElements() {
        // Clear existing markers
        this.clearMarkers();

        if (!this.markers || this.markers.length === 0) {
            console.warn('No markers to create');
            return;
        }

        console.log(`Creating ${this.markers.length} marker elements...`);
        
        this.markers.forEach((markerData, index) => {
            try {
                this.createMarker(markerData);
            } catch (error) {
                console.error(`Failed to create marker ${index}:`, error, markerData);
            }
        });
        
        console.log(`Successfully created ${this.markerElements.length} marker elements`);
    }

    createMarker(markerData) {
        // Validate marker data
        if (!markerData || typeof markerData.x !== 'number' || typeof markerData.y !== 'number') {
            console.error('Invalid marker data:', markerData);
            return;
        }

        const marker = document.createElement('div');
        marker.className = `marker ${markerData.type || 'custom'}`;
        marker.style.left = `${markerData.x}px`;
        marker.style.top = `${markerData.y}px`;
        marker.dataset.markerId = markerData.id || `marker-${Date.now()}`;
        marker.setAttribute('aria-label', `${markerData.name || 'Unnamed location'} - Click for details`);
        marker.setAttribute('role', 'button');
        marker.setAttribute('tabindex', '0');

        // Apply custom styling based on marker type
        const markerType = MARKER_TYPES[markerData.type];
        if (markerType) {
            marker.style.backgroundColor = markerType.color;
            if (markerType.icon) {
                marker.style.backgroundImage = `url(${MAP_CONFIG.paths.icons}${markerType.icon})`;
                marker.style.backgroundSize = 'contain';
                marker.style.backgroundRepeat = 'no-repeat';
                marker.style.backgroundPosition = 'center';
            }
        }

        // Event listeners
        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPopup(markerData, e.clientX, e.clientY);
        });

        marker.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                const rect = marker.getBoundingClientRect();
                this.showPopup(markerData, rect.left + rect.width / 2, rect.top);
            }
        });

        // Add to map container
        this.map.mapContainer.appendChild(marker);
        this.markerElements.push({ element: marker, data: markerData });
        
        console.log(`Created marker: ${markerData.name} at (${markerData.x}, ${markerData.y})`);
    }

    showPopup(markerData, x, y) {
        // Close existing popup
        this.closePopup();

        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-labelledby', 'popup-title');

        let content = `
            <button class="close-btn" aria-label="Close popup">&times;</button>
            <h3 id="popup-title">${markerData.name || 'Unnamed Location'}</h3>
            <p>${markerData.description || 'No description available.'}</p>
        `;

        // Add population if available
        if (markerData.population) {
            content += `<p><strong>Population:</strong> ${markerData.population}</p>`;
        }

        // Add notable features
        if (markerData.notable) {
            content += `<p><strong>Notable:</strong> ${markerData.notable}</p>`;
        }

        // Add custom fields
        if (markerData.customFields) {
            Object.entries(markerData.customFields).forEach(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                content += `<p><strong>${label}:</strong> ${value}</p>`;
            });
        }

        // Add image if available
        if (markerData.image) {
            content += `<img src="${markerData.image}" alt="${markerData.name}" loading="lazy" />`;
        }

        popup.innerHTML = content;
        document.body.appendChild(popup);

        // Position popup
        this.positionPopup(popup, x, y);

        // Show popup with animation
        setTimeout(() => popup.classList.add('show'), 10);

        // Store reference
        this.activePopup = popup;

        // Event listeners
        const closeBtn = popup.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => this.closePopup());

        // Close on outside click
        const outsideClickHandler = (e) => {
            if (!popup.contains(e.target)) {
                this.closePopup();
                document.removeEventListener('click', outsideClickHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', outsideClickHandler), 10);

        // Close on escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closePopup();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('markerClicked', {
            detail: { marker: markerData }
        }));
    }

    positionPopup(popup, x, y) {
        const rect = popup.getBoundingClientRect();
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        let popupX = x + (MAP_CONFIG.popupOffset || 10);
        let popupY = y - rect.height / 2;

        // Keep popup in viewport
        if (popupX + rect.width > viewWidth) {
            popupX = x - rect.width - (MAP_CONFIG.popupOffset || 10);
        }
        if (popupY < 10) {
            popupY = 10;
        }
        if (popupY + rect.height > viewHeight - 10) {
            popupY = viewHeight - rect.height - 10;
        }

        popup.style.left = `${popupX}px`;
        popup.style.top = `${popupY}px`;
    }

    closePopup() {
        if (this.activePopup) {
            this.activePopup.remove();
            this.activePopup = null;
        }
    }

    clearMarkers() {
        this.markerElements.forEach(marker => {
            marker.element.remove();
        });
        this.markerElements = [];
    }

    addMarker(markerData) {
        // Validate and set defaults
        const marker = {
            id: markerData.id || `custom-${Date.now()}`,
            x: markerData.x,
            y: markerData.y,
            type: markerData.type || 'custom',
            name: markerData.name || 'Unnamed Location',
            description: markerData.description || 'No description provided.',
            ...markerData
        };
        
        // Add to data array
        this.markers.push(marker);
        
        // Create visual element
        this.createMarker(marker);
        
        console.log('Added custom marker:', marker.name);
        return marker;
    }

    removeMarker(markerId) {
        // Remove from data array
        this.markers = this.markers.filter(marker => marker.id !== markerId);
        
        // Remove visual element
        const markerElement = this.markerElements.find(marker => marker.data.id === markerId);
        if (markerElement) {
            markerElement.element.remove();
            this.markerElements = this.markerElements.filter(marker => marker.data.id !== markerId);
            console.log('Removed marker:', markerId);
        }
    }

    updateMarker(markerId, newData) {
        // Update data array
        const markerIndex = this.markers.findIndex(marker => marker.id === markerId);
        if (markerIndex !== -1) {
            this.markers[markerIndex] = { ...this.markers[markerIndex], ...newData };
            
            // Remove old element and create new one
            this.removeMarker(markerId);
            this.createMarker(this.markers[markerIndex]);
            console.log('Updated marker:', markerId);
        }
    }

    getMarkersByType(type) {
        return this.markers.filter(marker => marker.type === type);
    }

    getMarkerById(id) {
        return this.markers.find(marker => marker.id === id);
    }

    hideMarkersByType(type) {
        this.markerElements.forEach(markerElement => {
            if (markerElement.data.type === type) {
                markerElement.element.style.display = 'none';
            }
        });
    }

    showMarkersByType(type) {
        this.markerElements.forEach(markerElement => {
            if (markerElement.data.type === type) {
                markerElement.element.style.display = 'block';
            }
        });
    }

    toggleMarkersByType(type) {
        const firstMarker = this.markerElements.find(m => m.data.type === type);
        if (firstMarker) {
            const isVisible = firstMarker.element.style.display !== 'none';
            if (isVisible) {
                this.hideMarkersByType(type);
            } else {
                this.showMarkersByType(type);
            }
        }
    }

    // Search functionality
    searchMarkers(query) {
        const searchTerm = query.toLowerCase();
        return this.markers.filter(marker => 
            marker.name.toLowerCase().includes(searchTerm) ||
            marker.description.toLowerCase().includes(searchTerm) ||
            marker.type.toLowerCase().includes(searchTerm) ||
            (marker.notable && marker.notable.toLowerCase().includes(searchTerm))
        );
    }

    // Export markers to JSON
    exportMarkers() {
        return JSON.stringify({ markers: this.markers }, null, 2);
    }

    // Import markers from JSON
    async importMarkers(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            if (data.markers && Array.isArray(data.markers)) {
                this.markers = data.markers;
                this.createMarkerElements();
                console.log(`Imported ${this.markers.length} markers`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import markers:', error);
            return false;
        }
    }

    // Reload markers from JSON file
    async reloadMarkers() {
        console.log('Reloading markers...');
        await this.loadMarkers();
    }

    // Get statistics
    getStats() {
        const stats = {
            total: this.markers.length,
            byType: {}
        };

        this.markers.forEach(marker => {
            stats.byType[marker.type] = (stats.byType[marker.type] || 0) + 1;
        });

        return stats;
    }

    // MINIMAL fallback - only essential locations if JSON fails
    getMinimalFallback() {
        return [
            {
                id: 'bryn-shander',
                x: 2100, y: 1900,
                type: 'town',
                name: 'Bryn Shander',
                description: 'The largest settlement in Icewind Dale.',
                population: '1,200',
                notable: 'Trade hub, Town walls'
            },
            {
                id: 'targos',
                x: 1850, y: 1950,
                type: 'town',
                name: 'Targos',
                description: 'A fishing town on Maer Dualdon.',
                population: '1,000',
                notable: 'Fishing fleet'
            },
            {
                id: 'kelvins-cairn',
                x: 2400, y: 1400,
                type: 'poi',
                name: 'Kelvin\'s Cairn',
                description: 'The only mountain in Icewind Dale.',
                notable: 'Mountain peak, Caves'
            }
        ];
    }
}
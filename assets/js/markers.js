class MarkerManager {
    constructor(mapInstance) {
        console.log('Initializing MarkerManager...');
        this.map = mapInstance;
        this.markers = [];
        this.markerElements = [];
        this.activePopup = null;
        
        // Load markers
        this.loadMarkers();
    }

    async loadMarkers() {
        try {
            console.log('Attempting to load markers from JSON...');
            const response = await fetch(MAP_CONFIG.paths.markerData);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.markers || !Array.isArray(data.markers)) {
                throw new Error('Invalid JSON structure');
            }
            
            this.markers = data.markers;
            console.log(`Loaded ${this.markers.length} markers from JSON`);
            
        } catch (error) {
            console.warn('Failed to load JSON markers:', error.message);
            console.log('Using fallback markers...');
            this.markers = this.getFallbackMarkers();
        }
        
        this.createMarkerElements();
    }

    createMarkerElements() {
        console.log(`Creating ${this.markers.length} marker elements...`);
        
        // Clear existing markers
        this.clearMarkers();

        let created = 0;
        this.markers.forEach((markerData, index) => {
            try {
                if (this.createMarker(markerData)) {
                    created++;
                }
            } catch (error) {
                console.error(`Failed to create marker ${index}:`, error);
            }
        });
        
        console.log(`Successfully created ${created} marker elements`);
    }

    createMarker(markerData) {
        // Validate marker data
        if (!markerData || typeof markerData.x !== 'number' || typeof markerData.y !== 'number') {
            console.error('Invalid marker data:', markerData);
            return false;
        }

        const marker = document.createElement('div');
        marker.className = `marker ${markerData.type || 'custom'}`;
        marker.style.left = `${markerData.x}px`;
        marker.style.top = `${markerData.y}px`;
        marker.dataset.markerId = markerData.id || `marker-${Date.now()}-${Math.random()}`;
        
        // Accessibility
        marker.setAttribute('aria-label', `${markerData.name || 'Marker'} - Click for details`);
        marker.setAttribute('role', 'button');
        marker.setAttribute('tabindex', '0');
        marker.setAttribute('title', markerData.name || 'Marker');

        // Apply styling based on marker type
        const markerType = MARKER_TYPES[markerData.type];
        if (markerType) {
            marker.style.backgroundColor = markerType.color;
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

        // Add to map
        this.map.mapContainer.appendChild(marker);
        this.markerElements.push({ element: marker, data: markerData });
        
        return true;
    }

    showPopup(markerData, x, y) {
        // Close existing popup
        this.closePopup();

        const popup = document.createElement('div');
        popup.className = 'popup';
        
        let content = `
            <button class="close-btn" aria-label="Close">&times;</button>
            <h3>${markerData.name || 'Unnamed Location'}</h3>
            <p>${markerData.description || 'No description available.'}</p>
        `;

        if (markerData.population) {
            content += `<p><strong>Population:</strong> ${markerData.population}</p>`;
        }

        if (markerData.notable) {
            content += `<p><strong>Notable:</strong> ${markerData.notable}</p>`;
        }

        if (markerData.customFields) {
            Object.entries(markerData.customFields).forEach(([key, value]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                content += `<p><strong>${label}:</strong> ${value}</p>`;
            });
        }

        popup.innerHTML = content;
        document.body.appendChild(popup);

        // Position popup
        this.positionPopup(popup, x, y);

        // Show with animation
        setTimeout(() => popup.classList.add('show'), 10);

        // Store reference
        this.activePopup = popup;

        // Close button
        popup.querySelector('.close-btn').addEventListener('click', () => this.closePopup());

        // Close on outside click
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!popup.contains(e.target)) {
                    this.closePopup();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);

        // Close on escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closePopup();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    positionPopup(popup, x, y) {
        const rect = popup.getBoundingClientRect();
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        let popupX = x + 10;
        let popupY = y - rect.height / 2;

        // Keep in viewport
        if (popupX + rect.width > viewWidth) {
            popupX = x - rect.width - 10;
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
        const marker = {
            id: markerData.id || `custom-${Date.now()}`,
            x: markerData.x,
            y: markerData.y,
            type: markerData.type || 'custom',
            name: markerData.name || 'Custom Marker',
            description: markerData.description || 'User added marker',
            ...markerData
        };
        
        this.markers.push(marker);
        this.createMarker(marker);
        
        console.log('Added marker:', marker.name);
        return marker;
    }

    getMarkerById(id) {
        return this.markers.find(marker => marker.id === id);
    }

    searchMarkers(query) {
        const searchTerm = query.toLowerCase();
        return this.markers.filter(marker => 
            marker.name.toLowerCase().includes(searchTerm) ||
            (marker.description && marker.description.toLowerCase().includes(searchTerm)) ||
            marker.type.toLowerCase().includes(searchTerm)
        );
    }

    getFallbackMarkers() {
        return [
            {
                id: 'bryn-shander',
                x: 2100, y: 1900,
                type: 'town',
                name: 'Bryn Shander',
                description: 'The largest settlement in Icewind Dale.',
                population: '1,200'
            },
            {
                id: 'targos',
                x: 1850, y: 1950,
                type: 'town',
                name: 'Targos',
                description: 'A fishing town on Maer Dualdon.',
                population: '1,000'
            },
            {
                id: 'kelvins-cairn',
                x: 2400, y: 1400,
                type: 'poi',
                name: 'Kelvin\'s Cairn',
                description: 'The only mountain in Icewind Dale.',
                notable: 'Mountain peak, Caves'
            },
            {
                id: 'maer-dualdon',
                x: 2000, y: 1850,
                type: 'poi',
                name: 'Maer Dualdon',
                description: 'The largest lake in Icewind Dale.',
                notable: 'Fishing, Knucklehead trout'
            }
        ];
    }

    getStats() {
        const stats = { total: this.markers.length, byType: {} };
        this.markers.forEach(marker => {
            stats.byType[marker.type] = (stats.byType[marker.type] || 0) + 1;
        });
        return stats;
    }
}
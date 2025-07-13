class MarkerManager {
    constructor(mapInstance) {
        this.map = mapInstance;
        this.markers = [];
        this.markerElements = [];
        this.activePopup = null;
        this.loadMarkers();
    }

    async loadMarkers() {
        try {
            const response = await fetch(MAP_CONFIG.paths.markerData);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.markers = data.markers;
            this.createMarkerElements();
        } catch (error) {
            console.error('Failed to load markers:', error);
            // Fallback to embedded markers if external file fails
            this.createMarkerElements();
        }
    }

    createMarkerElements() {
        // Clear existing markers
        this.clearMarkers();

        // Use embedded markers if no external data loaded
        if (this.markers.length === 0) {
            this.markers = this.getEmbeddedMarkers();
        }

        this.markers.forEach(markerData => {
            this.createMarker(markerData);
        });
    }

    createMarker(markerData) {
        const marker = document.createElement('div');
        marker.className = `marker ${markerData.type}`;
        marker.style.left = `${markerData.x}px`;
        marker.style.top = `${markerData.y}px`;
        marker.dataset.markerId = markerData.id;
        marker.setAttribute('aria-label', `${markerData.name} - Click for details`);
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

        this.map.mapContainer.appendChild(marker);
        this.markerElements.push({ element: marker, data: markerData });
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
            <h3 id="popup-title">${markerData.name}</h3>
            <p>${markerData.description}</p>
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
            content += `<img src="${markerData.image}" alt="${markerData.name}" />`;
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
    }

    positionPopup(popup, x, y) {
        const rect = popup.getBoundingClientRect();
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        let popupX = x + MAP_CONFIG.popupOffset;
        let popupY = y - rect.height / 2;

        // Keep popup in viewport
        if (popupX + rect.width > viewWidth) {
            popupX = x - rect.width - MAP_CONFIG.popupOffset;
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
        // Add to data array
        this.markers.push(markerData);
        
        // Create visual element
        this.createMarker(markerData);
        
        // Return marker data for further manipulation
        return markerData;
    }

    removeMarker(markerId) {
        // Remove from data array
        this.markers = this.markers.filter(marker => marker.id !== markerId);
        
        // Remove visual element
        const markerElement = this.markerElements.find(marker => marker.data.id === markerId);
        if (markerElement) {
            markerElement.element.remove();
            this.markerElements = this.markerElements.filter(marker => marker.data.id !== markerId);
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

    // Fallback embedded markers (same as original)
    getEmbeddedMarkers() {
        return [
            {
                id: 'bryn-shander',
                x: 2100, y: 1900,
                type: 'town',
                name: 'Bryn Shander',
                description: 'The largest settlement in Icewind Dale, a walled town that serves as the region\'s hub of trade and commerce.',
                population: '1,200',
                notable: 'Market square, Town walls, Speaker Duvessa Shane'
            },
            {
                id: 'targos',
                x: 1850, y: 1950,
                type: 'town',
                name: 'Targos',
                description: 'A fishing town on the shores of Maer Dualdon, known for its hardy fishermen and knucklehead trout.',
                population: '1,000',
                notable: 'Fishing fleet, The Luskan Arms tavern'
            },
            {
                id: 'caer-konig',
                x: 2800, y: 1650,
                type: 'town',
                name: 'Caer-Konig',
                description: 'A small town on the southern shore of Lac Dinneshere, known for its castle ruins.',
                population: '150',
                notable: 'Castle ruins, Northern Light inn'
            },
            {
                id: 'kelvins-cairn',
                x: 2400, y: 1400,
                type: 'poi',
                name: 'Kelvin\'s Cairn',
                description: 'The only mountain in Icewind Dale, rising 1,800 feet above the tundra. Home to various creatures and ancient secrets.',
                notable: 'Mountain peak, Caves, Verbeeg lair'
            },
            {
                id: 'reghed-glacier',
                x: 4500, y: 800,
                type: 'poi',
                name: 'Reghed Glacier',
                description: 'A massive glacier that dominates the eastern part of Icewind Dale, constantly moving and reshaping the land.',
                notable: 'Glacier caves, Ancient ice, Tribal burial grounds'
            }
        ];
    }

    // Search functionality
    searchMarkers(query) {
        const searchTerm = query.toLowerCase();
        return this.markers.filter(marker => 
            marker.name.toLowerCase().includes(searchTerm) ||
            marker.description.toLowerCase().includes(searchTerm) ||
            marker.type.toLowerCase().includes(searchTerm)
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
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to import markers:', error);
            return false;
        }
    }
}
class MarkerManager {
    constructor(map) {
        this.map = map;
        this.markers = [];
        this.markerElements = new Map();
        this.activePopup = null;
    }
    
    async loadMarkers() {
        try {
            // Try to load from JSON file
            const response = await fetch('assets/data/markers.json');
            if (response.ok) {
                const data = await response.json();
                this.createMarkers(data);
                console.log(`Loaded ${data.length} markers from JSON`);
            } else {
                throw new Error('Failed to load markers.json');
            }
        } catch (error) {
            console.warn('Loading default markers:', error.message);
            // Fall back to default markers
            this.createMarkers(this.getDefaultMarkers());
        }
    }
    
    getDefaultMarkers() {
        return [
            // Ten-Towns
            { id: 'bryn-shander', x: 3000, y: 2100, type: 'town', name: 'Bryn Shander', 
              description: 'The largest of the Ten-Towns and unofficial capital. Population: 1,200.',
              details: { speaker: 'Duvessa Shane', population: 1200 } },
            
            { id: 'targos', x: 3300, y: 1900, type: 'town', name: 'Targos', 
              description: 'Second largest town, known for fishing and rivalry with Bryn Shander. Population: 1,000.',
              details: { speaker: 'Naerth Maxildanarr', population: 1000 } },
            
            { id: 'easthaven', x: 3500, y: 2300, type: 'town', name: 'Easthaven', 
              description: 'Eastern town on Lac Dinneshere, starting point for many expeditions. Population: 750.',
              details: { speaker: 'Danneth Waylen', population: 750 } },
            
            { id: 'caer-dineval', x: 2700, y: 2000, type: 'town', name: 'Caer-Dineval', 
              description: 'Isolated town ruled by the mysterious Kadroth. Population: 100.',
              details: { speaker: 'Crannoc Siever', population: 100 } },
            
            { id: 'caer-konig', x: 2500, y: 1800, type: 'town', name: 'Caer-Konig', 
              description: 'Northern town near Kelvin\'s Cairn. Population: 150.',
              details: { speaker: 'Trovus', population: 150 } },
            
            { id: 'termalaine', x: 3200, y: 2500, type: 'town', name: 'Termalaine', 
              description: 'Mining town famous for its gem mines. Population: 600.',
              details: { speaker: 'Oarus Masthew', population: 600 } },
            
            { id: 'lonelywood', x: 2300, y: 2400, type: 'town', name: 'Lonelywood', 
              description: 'Westernmost town, gateway to the Lonelywood forest. Population: 100.',
              details: { speaker: 'Nimsy Huddle', population: 100 } },
            
            { id: 'bremen', x: 3100, y: 1700, type: 'town', name: 'Bremen', 
              description: 'Small fishing town on the western shore. Population: 150.',
              details: { speaker: 'Dorbulgruf Shalescar', population: 150 } },
            
            { id: 'dougan-hole', x: 2900, y: 2600, type: 'town', name: 'Dougan\'s Hole', 
              description: 'Smallest of the Ten-Towns. Population: 50.',
              details: { speaker: 'Edgra Durmoot', population: 50 } },
            
            { id: 'good-mead', x: 3400, y: 2100, type: 'town', name: 'Good Mead', 
              description: 'Known for its honey mead brewery. Population: 100.',
              details: { speaker: 'Kendrick Rielsbarrow', population: 100 } },
            
            // Points of Interest
            { id: 'kelvin-cairn', x: 2600, y: 1600, type: 'poi', name: 'Kelvin\'s Cairn', 
              description: 'Tallest mountain in Icewind Dale, home to dwarven valley.' },
            
            { id: 'reghed-glacier', x: 4000, y: 1200, type: 'poi', name: 'Reghed Glacier', 
              description: 'Massive glacier, beneath lies the lost city of Ythryn.' },
            
            { id: 'maer-dualdon', x: 2800, y: 2200, type: 'poi', name: 'Maer Dualdon', 
              description: 'Largest of the three lakes, deepest and most dangerous.' },
            
            // Dungeons
            { id: 'ythryn', x: 4200, y: 1000, type: 'dungeon', name: 'Ythryn', 
              description: 'Lost Netherese city buried in the Reghed Glacier.' },
            
            { id: 'id-ascendant', x: 1800, y: 2800, type: 'dungeon', name: 'Id Ascendant', 
              description: 'Crashed nautiloid ship, now a mind flayer outpost.' },
            
            // Reghed Camps
            { id: 'elk-tribe', x: 3800, y: 1500, type: 'camp', name: 'Tribe of the Elk', 
              description: 'Nomadic Reghed tribe, friendly to outsiders.' }
        ];
    }
    
    createMarkers(markersData) {
        markersData.forEach(data => this.addMarker(data));
    }
    
    addMarker(data) {
        // Create marker element
        const marker = document.createElement('div');
        marker.className = `marker ${data.type}`;
        marker.style.left = `${data.x}px`;
        marker.style.top = `${data.y}px`;
        marker.dataset.id = data.id;
        marker.setAttribute('role', 'button');
        marker.setAttribute('aria-label', `${data.name} - ${MARKER_TYPES[data.type].name}`);
        
        // Add click handler
        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showPopup(data, marker);
        });
        
        // Add to DOM and tracking
        this.map.markerLayer.appendChild(marker);
        this.markers.push(data);
        this.markerElements.set(data.id, marker);
        
        // Set initial scale
        this.updateMarkerScale(this.map.scale);
        
        return marker;
    }
    
    removeMarker(id) {
        const marker = this.markerElements.get(id);
        if (marker) {
            marker.remove();
            this.markerElements.delete(id);
            this.markers = this.markers.filter(m => m.id !== id);
        }
    }
    
    updateMarkerScale(mapScale) {
        // Keep markers same visual size regardless of zoom
        const markerScale = Math.max(0.5, Math.min(2, 1 / mapScale));
        this.markerElements.forEach(marker => {
            marker.style.transform = `translate(-50%, -50%) scale(${markerScale})`;
        });
    }
    
    showPopup(data, marker) {
        // Close existing popup
        if (this.activePopup) {
            this.map.popup.classList.remove('active');
        }
        
        // Build popup content
        let content = `<h3>${data.name}</h3><p>${data.description}</p>`;
        
        // Add details if available
        if (data.details) {
            content += '<div class="details">';
            if (data.details.population) {
                content += `<p>Population: ${data.details.population}</p>`;
            }
            if (data.details.speaker) {
                content += `<p>Speaker: ${data.details.speaker}</p>`;
            }
            content += '</div>';
        }
        
        this.map.popup.innerHTML = content;
        
        // Position popup
        const rect = marker.getBoundingClientRect();
        const popupRect = this.map.popup.getBoundingClientRect();
        
        let left = rect.left + rect.width / 2;
        let top = rect.top - 10;
        
        // Adjust if popup would go off screen
        if (left - popupRect.width / 2 < 10) {
            left = popupRect.width / 2 + 10;
        } else if (left + popupRect.width / 2 > window.innerWidth - 10) {
            left = window.innerWidth - popupRect.width / 2 - 10;
        }
        
        if (top - popupRect.height < 10) {
            top = rect.bottom + 10;
            this.map.popup.style.transform = 'translate(-50%, 0)';
        } else {
            this.map.popup.style.transform = 'translate(-50%, -100%)';
        }
        
        this.map.popup.style.left = `${left}px`;
        this.map.popup.style.top = `${top}px`;
        
        // Show popup
        requestAnimationFrame(() => {
            this.map.popup.classList.add('active');
        });
        
        this.activePopup = data.id;
        
        // Close popup when clicking elsewhere
        const closePopup = (e) => {
            if (!marker.contains(e.target) && !this.map.popup.contains(e.target)) {
                this.map.popup.classList.remove('active');
                this.activePopup = null;
                document.removeEventListener('click', closePopup);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closePopup);
        }, 0);
    }
    
    // Search functionality
    searchMarkers(query) {
        const searchTerm = query.toLowerCase();
        return this.markers.filter(marker => 
            marker.name.toLowerCase().includes(searchTerm) ||
            marker.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by type
    filterByType(type) {
        return this.markers.filter(marker => marker.type === type);
    }
    
    // Get marker by ID
    getMarker(id) {
        return this.markers.find(marker => marker.id === id);
    }
    
    // Show/hide markers by type
    toggleMarkerType(type, visible) {
        this.markerElements.forEach((element, id) => {
            const marker = this.getMarker(id);
            if (marker && marker.type === type) {
                element.style.display = visible ? 'block' : 'none';
            }
        });
    }
    
    // Export markers as JSON
    exportMarkers() {
        return JSON.stringify(this.markers, null, 2);
    }
    
    // Import markers from JSON
    importMarkers(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            // Clear existing markers
            this.clearAllMarkers();
            // Add new markers
            this.createMarkers(data);
            return true;
        } catch (error) {
            console.error('Failed to import markers:', error);
            return false;
        }
    }
    
    // Clear all markers
    clearAllMarkers() {
        this.markerElements.forEach(marker => marker.remove());
        this.markerElements.clear();
        this.markers = [];
    }
    
    // Get statistics
    getStats() {
        const stats = {
            total: this.markers.length,
            byType: {}
        };
        
        Object.keys(MARKER_TYPES).forEach(type => {
            stats.byType[type] = this.filterByType(type).length;
        });
        
        return stats;
    }
}
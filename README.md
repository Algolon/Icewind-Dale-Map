# Icewind Dale Interactive Map

An interactive web-based map for exploring the Icewind Dale region from Dungeons & Dragons. Navigate through towns, points of interest, and add your own custom markers for campaign tracking.

## 🌟 Features

- **🗺️ Full Interactive Map**: Zoom, pan, and explore the entire Icewind Dale region
- **📍 Interactive Markers**: Click on towns and locations for detailed information
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **⌨️ Keyboard Navigation**: Full keyboard support for accessibility
- **🔍 Search & Filter**: Find locations quickly and filter by type
- **💾 Save & Export**: Export your custom markers and map state
- **🎯 Coordinate System**: Real-time coordinate display for precise positioning

## 🚀 Quick Start

### Option 1: Use the Artifact Directly
1. Save the HTML artifact as `index.html`
2. Replace the placeholder image with your actual map
3. Open in any modern web browser

### Option 2: Full Project Structure (Recommended)
1. Clone or download this repository
2. Follow the [GitHub Setup Guide](#github-setup) below
3. Deploy to GitHub Pages or any web server

## 📁 Project Structure

```
icewind-dale-map/
├── index.html                 # Main application
├── assets/
│   ├── images/
│   │   └── map.jpg           # Your 6000x4215 map image
│   ├── css/
│   │   └── styles.css        # All styling
│   ├── js/
│   │   ├── config.js         # Configuration settings
│   │   ├── markers.js        # Marker management
│   │   ├── map.js           # Core map functionality
│   │   └── app.js           # Application initialization
│   └── data/
│       └── markers.json     # Marker data
├── README.md
└── docs/
    ├── CUSTOMIZATION.md
    └── CONTRIBUTING.md
```

## 🛠️ GitHub Setup

### 1. Create Repository
```bash
# Create new repository on GitHub
# Clone locally
git clone https://github.com/yourusername/icewind-dale-map.git
cd icewind-dale-map
```

### 2. Add Your Map Image
1. Place your 6000x4215 Icewind Dale map in `assets/images/map.jpg`
2. Update the image path in `index.html`:
```html
<img src="assets/images/map.jpg" alt="Icewind Dale Map" class="map-image" id="mapImage">
```

### 3. Configure Markers
Edit `assets/data/markers.json` to add your locations:
```json
{
  "markers": [
    {
      "id": "unique-id",
      "x": 2100,
      "y": 1900,
      "type": "town",
      "name": "Location Name",
      "description": "Detailed description...",
      "population": "1,200",
      "notable": "Key features"
    }
  ]
}
```

### 4. Deploy to GitHub Pages
1. Go to repository Settings
2. Navigate to Pages section
3. Select "Deploy from a branch"
4. Choose "main" branch, "/ (root)" folder
5. Save

Your map will be live at: `https://yourusername.github.io/icewind-dale-map/`

## 🎮 Controls

### Mouse/Touch
- **Drag**: Pan around the map
- **Scroll/Pinch**: Zoom in and out
- **Double-click/tap**: Zoom to location
- **Click markers**: Show location details

### Keyboard
- **Arrow keys**: Pan the map
- **+/-**: Zoom in/out
- **0**: Reset to center view
- **H**: Show help
- **R**: Reset view
- **F**: Toggle fullscreen
- **L**: Toggle legend
- **C**: Toggle coordinates
- **Escape**: Close popups

## 📍 Adding Markers

### Finding Coordinates
1. Open the map and hover over your desired location
2. Note the X, Y coordinates in the top-right corner
3. Use these coordinates in your marker data

### Method 1: JSON File (Recommended)
Add to `assets/data/markers.json`:
```json
{
  "id": "new-location",
  "x": 1500,
  "y": 2000,
  "type": "poi",
  "name": "Dragon's Lair",
  "description": "Ancient lair of a white dragon...",
  "notable": "Treasure hoard, Ice caves"
}
```

### Method 2: JavaScript (Runtime)
```javascript
// Add marker programmatically
mapApp.addCustomMarker(1500, 2000, "My Location", "Description");

// Or using the global function
addMarker(1500, 2000, "My Location", "Description", "poi");
```

## 🎨 Marker Types

- **town** (Green): Settlements and cities
- **poi** (Blue): Points of interest
- **dungeon** (Purple): Dungeons and dangerous locations
- **camp** (Orange): Camps and temporary settlements
- **custom** (Red): User-added markers

## 🔧 Customization

### Adding New Marker Types
1. Update `MARKER_TYPES` in `assets/js/config.js`
2. Add CSS styles in `assets/css/styles.css`
3. Update legend in `index.html`

### Custom Styling
Edit `assets/css/styles.css` to modify:
- Colors and themes
- UI component positions
- Responsive breakpoints
- Animation effects

## 📊 API Reference

### Global Functions
```javascript
// Search locations
searchMap("bryn shander");

// Navigate to location
goTo("bryn-shander");

// Add custom marker
addMarker(x, y, name, description, type);

// Export/Import map data
const data = exportMap();
importMap(data);
```

### Map Instance
```javascript
// Access the map instance
const map = mapApp.getMap();

// Zoom to specific coordinates
map.panTo(2100, 1900);

// Get current view bounds
const bounds = map.getCurrentBounds();
```

## 🌐 Browser Support

- **Modern browsers**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Mobile**: iOS Safari 12+, Chrome Mobile 60+
- **Features**: ES6+, CSS Grid, Flexbox, Touch Events

## 🔄 Performance Optimization

- **Image compression**: Keep map image under 2MB
- **Marker culling**: Only render visible markers at high zoom levels
- **Touch handling**: Optimized for smooth mobile interaction
- **Memory management**: Efficient DOM manipulation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for detailed guidelines.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎲 D&D Integration

Perfect for:
- **Campaign tracking**: Mark visited locations and discoveries
- **Session planning**: Prepare locations and encounters
- **Player handouts**: Share the interactive map with your party
- **World building**: Add custom locations and lore

## 🔮 Roadmap

- [ ] Layer system for different map overlays
- [ ] Distance measurement tools
- [ ] Route planning and pathfinding
- [ ] Campaign session integration
- [ ] User accounts and cloud save
- [ ] Community marker sharing
- [ ] Mobile app version

## 🐛 Troubleshooting

### Map doesn't load
- Check image path in `index.html`
- Verify image file exists and is accessible
- Check browser console for errors

### Markers not appearing
- Verify coordinates are within map bounds (0-6000, 0-4215)
- Check marker data format in JSON
- Ensure JavaScript files are loading correctly

### Poor performance on mobile
- Reduce map image size
- Enable marker culling for large datasets
- Check for memory leaks in browser tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/algolon/icewind-dale-map/issues)
- **Discussions**: [GitHub Discussions](https://github.com/algolon/icewind-dale-map/discussions)
- **Wiki**: [Project Wiki](https://github.com/algolon/icewind-dale-map/wiki)

---

**Happy exploring the frozen lands of Icewind Dale!** ❄️🏔️
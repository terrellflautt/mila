# Constellation MCP Server

A custom MCP (Model Context Protocol) server providing astronomical data, star catalogs, and celestial rendering services for "Mila's World" constellation experience.

## Features

### Star Catalog Services
- **Realistic Star Generation**: Magnitude-based sizing with spectral color classification (O, B, A, F, G, K, M types)
- **Background Starfield**: Generate atmospheric stars with proper distribution
- **Constellation Stars**: Create specific constellation patterns with precise positioning

### Constellation Geometry
Pre-defined meaningful constellations:
- ❤️ **Heart** - Symbol of love
- 📝 **Letter M** - For Mila
- 📝 **Letter T** - For Tyler
- 🦩 **Flamingo** - Grace and elegance
- 🎭 **Theater Masks** - Full spectrum of emotion
- 🩰 **Ballerina** - Poetry in motion
- ∞ **Infinity** - Eternal love

### Astronomical Projections
- **Stereographic**: All-sky maps, polar regions
- **Aitoff**: Balanced area/shape distortion
- **Equirectangular**: Simple cylindrical projection

### Animation Support
- Star twinkle parameters with realistic atmospheric shimmer
- Magnitude-based brightness calculations
- Spectral color mapping for visual realism

## Installation

```bash
cd mcp-constellation-server
npm install
npm run build
```

## Usage

### As MCP Server

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "constellation": {
      "command": "node",
      "args": ["/path/to/mcp-constellation-server/dist/index.js"]
    }
  }
}
```

### Available Tools

1. **generate_background_stars** - Create realistic starfield
2. **get_constellation** - Retrieve constellation definitions
3. **generate_constellation_stars** - Generate stars for specific constellation
4. **calculate_constellation_bounds** - Get bounding box and optimal zoom
5. **apply_projection** - Convert celestial coordinates to screen space
6. **get_star_twinkle_params** - Get animation parameters
7. **list_all_constellations** - List all available constellations

## Technical Details

### Star Spectral Types
Stars are classified by temperature and color:
- **O-type** (Blue): Hottest, rarest (0.5% of stars)
- **B-type** (Blue-white): Hot stars (0.5%)
- **A-type** (White): 2%
- **F-type** (Yellow-white): 3%
- **G-type** (Yellow): Like our Sun (6%)
- **K-type** (Orange): Cooler stars (12%)
- **M-type** (Red): Coolest, most common (76%)

### Magnitude System
Apparent magnitude determines visual brightness:
- Magnitude 0: Very bright (size 1.0)
- Magnitude 3: Medium brightness
- Magnitude 6: Faintest naked-eye visible (size 0.1)

### Coordinate Systems
- **Celestial**: Right Ascension (hours) + Declination (degrees)
- **Cartesian**: 3D space (x, y, z)
- **Screen**: 2D projection for rendering

## Architecture

```
src/
├── index.ts                    # MCP server entry point
├── star-catalog.ts             # Star generation and spectral types
├── constellation-geometry.ts   # Constellation definitions
└── coordinate-transforms.ts    # Projection mathematics
```

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build

# Run the server
npm start
```

## Integration with Lambda/API Gateway

This MCP server can also be adapted to run as AWS Lambda functions. See the constellation data can be served via REST API for the web application.

## License

MIT - Created for "Mila's World" by Tyler

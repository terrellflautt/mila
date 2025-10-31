/**
 * Astronomical Coordinate Transformations
 * Projection systems and coordinate conversions for realistic sky mapping
 */

export interface CartesianCoord {
  x: number;
  y: number;
  z: number;
}

export interface CelestialCoord {
  rightAscension: number; // Hours (0-24)
  declination: number;     // Degrees (-90 to 90)
  distance?: number;
}

export interface ScreenCoord {
  x: number;
  y: number;
}

/**
 * Convert celestial coordinates (RA/Dec) to Cartesian
 * Uses equirectangular projection for simplicity
 */
export function celestialToCartesian(
  coord: CelestialCoord,
  scale: number = 10
): CartesianCoord {
  // Convert RA from hours to radians
  const raRad = (coord.rightAscension / 24) * 2 * Math.PI;

  // Convert Dec from degrees to radians
  const decRad = (coord.declination * Math.PI) / 180;

  const distance = coord.distance || 1;

  return {
    x: distance * Math.cos(decRad) * Math.cos(raRad) * scale,
    y: distance * Math.cos(decRad) * Math.sin(raRad) * scale,
    z: distance * Math.sin(decRad) * scale
  };
}

/**
 * Convert Cartesian to screen coordinates using orthographic projection
 */
export function cartesianToScreen(
  coord: CartesianCoord,
  viewWidth: number,
  viewHeight: number,
  scale: number = 1,
  offsetX: number = 0,
  offsetY: number = 0
): ScreenCoord {
  return {
    x: coord.x * scale + viewWidth / 2 + offsetX,
    y: -coord.y * scale + viewHeight / 2 + offsetY  // Invert Y for screen coords
  };
}

/**
 * Apply stereographic projection
 * Used for all-sky maps, especially useful for polar regions
 */
export function stereographicProjection(
  coord: CelestialCoord,
  centerRA: number = 0,
  centerDec: number = 90,
  scale: number = 10
): ScreenCoord {
  const raRad = (coord.rightAscension / 24) * 2 * Math.PI;
  const decRad = (coord.declination * Math.PI) / 180;
  const centerRARad = (centerRA / 24) * 2 * Math.PI;
  const centerDecRad = (centerDec * Math.PI) / 180;

  const cosDec = Math.cos(decRad);
  const cosCenter = Math.cos(centerDecRad);
  const sinCenter = Math.sin(centerDecRad);

  const k = 2 / (1 + sinCenter * Math.sin(decRad) +
    cosCenter * cosDec * Math.cos(raRad - centerRARad));

  return {
    x: k * cosDec * Math.sin(raRad - centerRARad) * scale,
    y: k * (cosCenter * Math.sin(decRad) -
      sinCenter * cosDec * Math.cos(raRad - centerRARad)) * scale
  };
}

/**
 * Apply Aitoff projection
 * Good compromise between area and shape distortion
 * Popular in professional star maps
 */
export function aitoffProjection(
  coord: CelestialCoord,
  scale: number = 10
): ScreenCoord {
  const lambda = (coord.rightAscension / 24) * 2 * Math.PI - Math.PI; // Longitude
  const phi = (coord.declination * Math.PI) / 180; // Latitude

  const alpha = Math.acos(Math.cos(phi) * Math.cos(lambda / 2));
  const sinAlpha = Math.sin(alpha);

  const x = 2 * Math.cos(phi) * Math.sin(lambda / 2) / (sinAlpha || 1) * scale;
  const y = Math.sin(phi) / (sinAlpha || 1) * scale;

  return { x, y };
}

/**
 * Calculate angular separation between two celestial coordinates
 * Returns separation in degrees
 */
export function angularSeparation(
  coord1: CelestialCoord,
  coord2: CelestialCoord
): number {
  const ra1 = (coord1.rightAscension / 24) * 2 * Math.PI;
  const dec1 = (coord1.declination * Math.PI) / 180;
  const ra2 = (coord2.rightAscension / 24) * 2 * Math.PI;
  const dec2 = (coord2.declination * Math.PI) / 180;

  const cosTheta = Math.sin(dec1) * Math.sin(dec2) +
    Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);

  return Math.acos(Math.max(-1, Math.min(1, cosTheta))) * 180 / Math.PI;
}

/**
 * Apply viewport transformation with zoom and pan
 */
export function applyViewportTransform(
  coord: ScreenCoord,
  viewport: {
    width: number;
    height: number;
    zoom: number;
    panX: number;
    panY: number;
  }
): ScreenCoord {
  return {
    x: (coord.x * viewport.zoom) + viewport.panX + viewport.width / 2,
    y: (coord.y * viewport.zoom) + viewport.panY + viewport.height / 2
  };
}

/**
 * Convert screen coordinates back to world coordinates
 * Useful for interaction (click detection)
 */
export function screenToWorld(
  screenCoord: ScreenCoord,
  viewport: {
    width: number;
    height: number;
    zoom: number;
    panX: number;
    panY: number;
  }
): ScreenCoord {
  return {
    x: (screenCoord.x - viewport.width / 2 - viewport.panX) / viewport.zoom,
    y: (screenCoord.y - viewport.height / 2 - viewport.panY) / viewport.zoom
  };
}

/**
 * Calculate optimal zoom level to fit constellation in view
 */
export function calculateOptimalZoom(
  boundingBox: { width: number; height: number },
  viewportSize: { width: number; height: number },
  padding: number = 50
): number {
  const availableWidth = viewportSize.width - padding * 2;
  const availableHeight = viewportSize.height - padding * 2;

  const zoomX = availableWidth / boundingBox.width;
  const zoomY = availableHeight / boundingBox.height;

  return Math.min(zoomX, zoomY);
}

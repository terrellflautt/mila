/**
 * Star Catalog Generator
 * Creates realistic star data with magnitude-based sizing and spectral colors
 */

export interface Star {
  id: string;
  x: number;
  y: number;
  z: number;
  magnitude: number; // Apparent magnitude (lower = brighter)
  spectralType: string; // O, B, A, F, G, K, M
  color: string; // Hex color based on spectral type
  size: number; // Visual size (0.1 - 1.0)
  brightness: number; // Opacity/intensity (0.0 - 1.0)
  name?: string;
}

export interface ConstellationStar extends Star {
  order: number; // Connection order in constellation
  constellationId: string;
}

/**
 * Spectral type to color mapping
 * Based on actual stellar temperature colors
 */
const SPECTRAL_COLORS: Record<string, string> = {
  'O': '#9BB0FF', // Blue-white (hottest)
  'B': '#AABFFF', // Blue-white
  'A': '#CAD7FF', // White
  'F': '#F8F7FF', // Yellow-white
  'G': '#FFF4EA', // Yellow (like our Sun)
  'K': '#FFD2A1', // Orange
  'M': '#FFCC6F'  // Red-orange (coolest)
};

/**
 * Convert apparent magnitude to visual size
 * Brighter stars (lower magnitude) = larger size
 */
export function magnitudeToSize(magnitude: number): number {
  // Magnitude 0 = size 1.0, magnitude 6 = size 0.1
  // Using inverse exponential scale
  const normalized = Math.max(0, Math.min(6, magnitude));
  return Math.pow(2, -(normalized / 2)) * 0.8 + 0.2;
}

/**
 * Convert magnitude to brightness/opacity
 */
export function magnitudeToBrightness(magnitude: number): number {
  const normalized = Math.max(0, Math.min(6, magnitude));
  return 1.0 - (normalized / 7);
}

/**
 * Generate a random spectral type with realistic distribution
 * M stars are most common, O stars are rarest
 */
export function generateSpectralType(): string {
  const rand = Math.random();
  if (rand < 0.76) return 'M'; // 76% M-type (red dwarfs)
  if (rand < 0.88) return 'K'; // 12% K-type (orange)
  if (rand < 0.94) return 'G'; // 6% G-type (yellow, like Sun)
  if (rand < 0.97) return 'F'; // 3% F-type
  if (rand < 0.99) return 'A'; // 2% A-type
  if (rand < 0.995) return 'B'; // 0.5% B-type
  return 'O'; // 0.5% O-type (blue giants)
}

/**
 * Generate background starfield
 * Creates atmospheric stars that aren't part of constellations
 */
export function generateBackgroundStars(count: number = 200, bounds: { width: number; height: number; depth: number }): Star[] {
  const stars: Star[] = [];

  for (let i = 0; i < count; i++) {
    const magnitude = 4 + Math.random() * 2; // Magnitude 4-6 (dimmer background stars)
    const spectralType = generateSpectralType();

    stars.push({
      id: `bg-star-${i}`,
      x: (Math.random() - 0.5) * bounds.width,
      y: (Math.random() - 0.5) * bounds.height,
      z: (Math.random() - 0.5) * bounds.depth - 20, // Further back
      magnitude,
      spectralType,
      color: SPECTRAL_COLORS[spectralType],
      size: magnitudeToSize(magnitude),
      brightness: magnitudeToBrightness(magnitude) * 0.6 // Dimmer than constellation stars
    });
  }

  return stars;
}

/**
 * Generate constellation stars with specific positions and characteristics
 */
export function generateConstellationStars(
  constellationId: string,
  positions: Array<{ x: number; y: number; z?: number }>,
  baseMagnitude: number = 2
): ConstellationStar[] {
  return positions.map((pos, index) => {
    // Vary magnitude slightly for visual interest
    const magnitude = baseMagnitude + (Math.random() - 0.5) * 0.5;
    const spectralType = index === 0 ? 'A' : generateSpectralType(); // First star often brightest/whitest

    return {
      id: `${constellationId}-star-${index}`,
      x: pos.x,
      y: pos.y,
      z: pos.z || 0,
      magnitude,
      spectralType,
      color: SPECTRAL_COLORS[spectralType],
      size: magnitudeToSize(magnitude),
      brightness: magnitudeToBrightness(magnitude),
      order: index + 1,
      constellationId
    };
  });
}

/**
 * Calculate star twinkle parameters
 * Returns animation parameters for realistic atmospheric shimmer
 */
export function getStarTwinkleParams(star: Star) {
  return {
    duration: 0.5 + Math.random() * 1.5,
    minOpacity: Math.max(0.3, star.brightness - 0.3),
    maxOpacity: Math.min(1.0, star.brightness + 0.1),
    delay: Math.random() * 2,
    scaleVariation: 1 + (Math.random() - 0.5) * 0.1
  };
}

/**
 * Dynamic color palette system
 * Colors shift based on time of day in Houston and user progress
 */

// Base palettes for different times and moods
const palettes = {
  morning: {
    primary: '#FFF8F0',    // cream
    secondary: '#FFE4E1',  // misty rose
    accent: '#E8D5C4',     // beige
    dark: '#2C2C2C',       // charcoal
    highlight: '#FFB6C1'   // light pink
  },
  afternoon: {
    primary: '#FFF5EE',    // seashell
    secondary: '#F5E6D3',  // champagne
    accent: '#DEB887',     // burlywood
    dark: '#3C3C3C',       // darker gray
    highlight: '#FFC0CB'   // pink
  },
  evening: {
    primary: '#F5E6D3',    // champagne
    secondary: '#FFB6C1',  // light pink
    accent: '#E8D5C4',     // beige
    dark: '#1a1a1a',       // near black
    highlight: '#FF69B4'   // hot pink
  },
  night: {
    primary: '#2C2C2C',    // charcoal
    secondary: '#E8D5C4',  // beige
    accent: '#FFE4E1',     // misty rose
    dark: '#0a0a0a',       // black
    highlight: '#FFB6C1'   // light pink
  }
};

// Act-specific color influences
const actColors = {
  act1: {
    warmth: 1.0,      // full warmth - welcoming
    saturation: 0.8,  // soft, inviting
    lightness: 0.9    // bright and open
  },
  act2: {
    warmth: 0.85,     // slightly cooler - more intimate
    saturation: 0.9,  // richer colors
    lightness: 0.75   // more depth
  },
  act3: {
    warmth: 0.9,      // warm but deep
    saturation: 1.0,  // full saturation - emotionally rich
    lightness: 0.6    // intimate, evening-like
  }
};

/**
 * Get current time period in Houston
 */
export function getHoustonTimePeriod() {
  // Create date object in Houston timezone (CST/CDT)
  const now = new Date();
  const houstonTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const hour = houstonTime.getHours();

  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Get color palette based on time and progress
 */
export function getCurrentPalette(currentAct = 'act1', seed = 0) {
  const timePeriod = getHoustonTimePeriod();
  const basePalette = palettes[timePeriod];
  const actInfluence = actColors[currentAct];

  // Use seed to slightly vary the palette each day
  const seedVariation = (seed % 100) / 100;

  return {
    ...basePalette,
    actInfluence,
    seedVariation,
    timePeriod
  };
}

/**
 * Interpolate between two colors
 */
export function lerpColor(color1, color2, amount) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * amount);
  const g = Math.round(c1.g + (c2.g - c1.g) * amount);
  const b = Math.round(c1.b + (c2.b - c1.b) * amount);

  return rgbToHex(r, g, b);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Apply palette to document
 */
export function applyPalette(palette) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', palette.primary);
  root.style.setProperty('--color-secondary', palette.secondary);
  root.style.setProperty('--color-accent', palette.accent);
  root.style.setProperty('--color-dark', palette.dark);
  root.style.setProperty('--color-highlight', palette.highlight);
}

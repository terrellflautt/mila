/**
 * Constellation Geometry Generator
 * Defines meaningful constellation patterns with emotional significance
 */

export interface ConstellationDefinition {
  id: string;
  name: string;
  message: string;
  symbol: string;
  hint: string;
  positions: Array<{ x: number; y: number; z?: number }>;
  connections: Array<[number, number]>; // Pairs of indices to connect
  theme: 'love' | 'identity' | 'connection' | 'grace' | 'eternal';
  color?: string;
}

/**
 * Heart constellation - Symbol of love
 * Classic heart shape formed by 5 stars
 */
export const HEART_CONSTELLATION: ConstellationDefinition = {
  id: 'heart',
  name: 'The Heart',
  message: 'In the vastness of space, countless stars—\nbut when I connect the dots, I only see you.',
  symbol: '♥',
  hint: 'Find the pattern that beats eternal',
  positions: [
    { x: -3, y: 2, z: 0 },  // Top left
    { x: 3, y: 2, z: 0 },   // Top right
    { x: 4, y: -1, z: 0 },  // Right curve
    { x: 0, y: -4, z: 0 },  // Bottom point
    { x: -4, y: -1, z: 0 }  // Left curve
  ],
  connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]], // Forms heart outline
  theme: 'love',
  color: '#ff88bb'
};

/**
 * Letter M - For Mila
 * Clean, elegant M shape
 */
export const LETTER_M_CONSTELLATION: ConstellationDefinition = {
  id: 'letterM',
  name: 'Letter M',
  message: 'Your name written in stars—\nso even when we\'re apart, I see you in the sky.',
  symbol: 'M',
  hint: 'Her initial, etched in light',
  positions: [
    { x: -4, y: -2, z: 0 },  // Bottom left
    { x: -4, y: 2, z: 0 },   // Top left
    { x: 0, y: -1, z: 0 },   // Middle peak
    { x: 4, y: 2, z: 0 },    // Top right
    { x: 4, y: -2, z: 0 }    // Bottom right
  ],
  connections: [[0, 1], [1, 2], [2, 3], [3, 4]],
  theme: 'identity',
  color: '#6699ff'
};

/**
 * Letter T - For Tyler
 * Simple T formation
 */
export const LETTER_T_CONSTELLATION: ConstellationDefinition = {
  id: 'letterT',
  name: 'Letter T',
  message: 'Two letters, two souls,\none constellation of us.',
  symbol: 'T',
  hint: 'His mark upon the heavens',
  positions: [
    { x: -4, y: 2, z: 0 },   // Left of horizontal
    { x: -2, y: 2, z: 0 },   // Left-center
    { x: 0, y: 2, z: 0 },    // Center top
    { x: 2, y: 2, z: 0 },    // Right-center
    { x: 4, y: 2, z: 0 },    // Right of horizontal
    { x: 0, y: -2, z: 0 }    // Bottom of vertical
  ],
  connections: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]], // T shape
  theme: 'identity',
  color: '#ff9966'
};

/**
 * Flamingo - Symbol of grace and elegance
 * Graceful curved neck and body
 */
export const FLAMINGO_CONSTELLATION: ConstellationDefinition = {
  id: 'flamingo',
  name: 'The Flamingo',
  message: 'Grace in motion, beauty in stillness—\nlike you, standing in perfect balance.',
  symbol: '🦩',
  hint: 'A creature of elegance takes flight',
  positions: [
    { x: -3, y: 3, z: 0 },   // Head
    { x: -2, y: 2, z: 0 },   // Neck curve 1
    { x: -1, y: 0, z: 0 },   // Neck curve 2
    { x: 0, y: -1, z: 0 },   // Body center
    { x: 2, y: -1, z: 0 },   // Body back
    { x: 1, y: -3, z: 0 },   // Leg 1
    { x: 3, y: -3, z: 0 }    // Leg 2
  ],
  connections: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [3, 6]],
  theme: 'grace',
  color: '#ff6b9d'
};

/**
 * Theater Masks - Comedy and Tragedy
 * Two masks side by side representing the full spectrum of emotion
 */
export const THEATER_MASKS_CONSTELLATION: ConstellationDefinition = {
  id: 'theaterMasks',
  name: 'Theater Masks',
  message: 'Joy and sorrow, laughter and tears—\nI want to share every scene of life with you.',
  symbol: '🎭',
  hint: 'Two faces, countless emotions',
  positions: [
    // Comedy mask (left, smiling)
    { x: -5, y: 2, z: 0 },   // Left eye
    { x: -3, y: 2, z: 0 },   // Right eye
    { x: -4, y: 0, z: 0 },   // Smile center
    { x: -5.5, y: -1, z: 0 }, // Smile left
    { x: -2.5, y: -1, z: 0 }, // Smile right

    // Tragedy mask (right, frowning)
    { x: 3, y: 2, z: 0 },    // Left eye
    { x: 5, y: 2, z: 0 },    // Right eye
    { x: 4, y: 0, z: 0 },    // Frown center
    { x: 2.5, y: 1, z: 0 },  // Frown left
    { x: 5.5, y: 1, z: 0 }   // Frown right
  ],
  connections: [
    // Comedy mask
    [0, 1], [3, 2], [2, 4],
    // Tragedy mask
    [5, 6], [8, 7], [7, 9]
  ],
  theme: 'connection',
  color: '#daa520'
};

/**
 * Ballerina - Symbol of dance and movement
 * Graceful dancer in arabesque position
 */
export const BALLERINA_CONSTELLATION: ConstellationDefinition = {
  id: 'ballerina',
  name: 'The Dancer',
  message: 'Every step you take is poetry—\nthe universe itself wants to waltz with you.',
  symbol: '🩰',
  hint: 'She moves and the stars follow',
  positions: [
    { x: 0, y: 3, z: 0 },     // Head
    { x: 0, y: 1.5, z: 0 },   // Neck
    { x: -2, y: 1, z: 0 },    // Left arm extended
    { x: 2, y: 1, z: 0 },     // Right arm raised
    { x: 0, y: 0, z: 0 },     // Torso center
    { x: -1, y: -1.5, z: 0 }, // Left leg planted
    { x: 3, y: 0.5, z: 0 },   // Right leg extended (arabesque)
    { x: -1, y: -3, z: 0 }    // Left foot
  ],
  connections: [[0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [4, 6], [5, 7]],
  theme: 'grace',
  color: '#ffb6c1'
};

/**
 * Infinity symbol - Eternal love
 * Figure-8 pattern representing forever
 */
export const INFINITY_CONSTELLATION: ConstellationDefinition = {
  id: 'infinity',
  name: 'Infinity',
  message: 'Some things don\'t have endings.\nThis is one of them.',
  symbol: '∞',
  hint: 'The loop that never breaks',
  positions: [
    { x: -3, y: 1, z: 0 },
    { x: -4, y: 0, z: 0 },
    { x: -3, y: -1, z: 0 },
    { x: 0, y: 0, z: 0 },    // Center crossing
    { x: 3, y: -1, z: 0 },
    { x: 4, y: 0, z: 0 },
    { x: 3, y: 1, z: 0 }
  ],
  connections: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  theme: 'eternal',
  color: '#ccaaff'
};

/**
 * All constellation definitions
 */
export const ALL_CONSTELLATIONS: ConstellationDefinition[] = [
  HEART_CONSTELLATION,
  LETTER_M_CONSTELLATION,
  LETTER_T_CONSTELLATION,
  FLAMINGO_CONSTELLATION,
  THEATER_MASKS_CONSTELLATION,
  BALLERINA_CONSTELLATION,
  INFINITY_CONSTELLATION
];

/**
 * Get constellation by ID
 */
export function getConstellationById(id: string): ConstellationDefinition | undefined {
  return ALL_CONSTELLATIONS.find(c => c.id === id);
}

/**
 * Get random constellation excluding specified IDs
 */
export function getRandomConstellation(excludeIds: string[] = []): ConstellationDefinition | null {
  const available = ALL_CONSTELLATIONS.filter(c => !excludeIds.includes(c.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Calculate bounding box for constellation
 */
export function getConstellationBounds(constellation: ConstellationDefinition) {
  const xs = constellation.positions.map(p => p.x);
  const ys = constellation.positions.map(p => p.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
    centerX: (Math.max(...xs) + Math.min(...xs)) / 2,
    centerY: (Math.max(...ys) + Math.min(...ys)) / 2
  };
}

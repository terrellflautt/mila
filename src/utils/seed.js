/**
 * Seed system for deterministic daily variations
 * Creates unique but consistent experiences based on date + visitor
 */

/**
 * Get or create visitor ID
 * Stored in localStorage to maintain identity across visits
 */
export function getOrCreateVisitorId() {
  const key = 'mila:visitorId';
  let id = localStorage.getItem(key);

  if (!id) {
    // Generate unique visitor ID
    id = generateId();
    localStorage.setItem(key, id);
  }

  return id;
}

/**
 * Generate unique ID
 */
function generateId() {
  return Math.random().toString(36).slice(2, 12) +
         Date.now().toString(36);
}

/**
 * Generate deterministic seed from date and visitor ID
 * Same visitor + same date = same seed = same experience
 */
export function generateDailySeed(visitorId, date = new Date()) {
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const combined = `${dateStr}|${visitorId}`;

  return hashString(combined);
}

/**
 * Simple hash function for strings
 * FNV-1a hash algorithm
 */
function hashString(str) {
  let hash = 2166136261 >>> 0;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  return hash;
}

/**
 * Create seeded random number generator
 * Returns consistent random numbers for same seed
 */
export function createSeededRandom(seed) {
  let state = seed;

  return function() {
    state = Math.imul(state, 1664525) + 1013904223 | 0;
    return (state >>> 0) / 0xffffffff;
  };
}

/**
 * Get daily variation index (0-n based on seed)
 */
export function getDailyVariation(seed, maxVariations) {
  return seed % maxVariations;
}

/**
 * Shuffle array using seed (Fisher-Yates)
 */
export function seedShuffle(array, seed) {
  const rng = createSeededRandom(seed);
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * Pick random item from array using seed
 */
export function seedPick(array, seed) {
  const index = seed % array.length;
  return array[index];
}

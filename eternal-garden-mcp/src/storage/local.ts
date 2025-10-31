/**
 * localStorage adapter for eternal garden
 * Everything persists on her device only
 */

import type { GardenState, Garden, Memory, Seed } from '../types.js';

// Use different storage key for test mode (so we don't affect her garden)
const getStorageKey = () => {
  // Check for ?test= in URL
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test')) {
      return `eternal-garden-state-test-${params.get('test')}`;
    }
  }
  return 'eternal-garden-state';
};

export class LocalStorage {
  private static get STORAGE_KEY() {
    return getStorageKey();
  }
  /**
   * Load garden state from localStorage
   */
  static load(): GardenState | null {
    try {
      const data = localStorage.getItem(LocalStorage.STORAGE_KEY);
      if (!data) return null;

      const state = JSON.parse(data);

      // Convert date strings back to Date objects
      return this.hydrateDates(state);
    } catch (error) {
      console.error('Failed to load garden state:', error);
      return null;
    }
  }

  /**
   * Save garden state to localStorage
   */
  static save(state: GardenState): void {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(LocalStorage.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save garden state:', error);
    }
  }

  /**
   * Create a new garden (first time)
   */
  static createNew(): GardenState {
    const now = new Date();

    const garden: Garden = {
      id: `garden-${Date.now()}`,
      name: "Mila's Garden",
      created: now,
      season: 'spring', // Start in spring
      seasonStart: now,
      plants: [],
      layout: {
        width: 20,
        height: 20,
        occupiedPositions: []
      },
      resources: {
        water: 100,
        fertilizer: 10,
        seeds: []
      },
      achievements: [
        { id: 'first-seed', name: 'First Seed', description: 'Plant your first seed', unlocked: false },
        { id: 'first-bloom', name: 'First Bloom', description: 'Witness your first flower bloom', unlocked: false },
        { id: 'geneticist', name: 'Geneticist', description: 'Cross-breed two plants', unlocked: false },
        { id: 'full-cycle', name: 'Full Cycle', description: 'Experience all four seasons', unlocked: false },
        { id: 'garden-keeper', name: 'Garden Keeper', description: 'Maintain garden for 30 days', unlocked: false }
      ],
      skill: {
        level: 1,
        experience: 0,
        totalActions: 0
      },
      lastUpdate: now
    };

    const state: GardenState = {
      garden,
      memories: [],
      seeds: this.generateStarterSeeds()
    };

    this.save(state);
    return state;
  }

  /**
   * Generate starter seeds for new garden
   */
  private static generateStarterSeeds(): Seed[] {
    const now = new Date();

    return [
      {
        id: `seed-${Date.now()}-1`,
        species: 'Morning Star Rose',
        genetics: {
          color: { dominant: 'pink', recessive: 'white', expressed: 'pink' },
          bloomSize: { dominant: 'medium', recessive: 'small', expressed: 'medium' },
          height: { dominant: 'medium', recessive: 'short', expressed: 'medium' },
          bloomPattern: { dominant: 'star', recessive: 'cup', expressed: 'star' },
          fragrance: { dominant: 'sweet', recessive: 'subtle', expressed: 'sweet' }
        },
        created: now,
        rarity: 'common'
      }
    ];
  }

  /**
   * Hydrate date strings back into Date objects
   */
  private static hydrateDates(state: any): GardenState {
    // Garden dates
    state.garden.created = new Date(state.garden.created);
    state.garden.seasonStart = new Date(state.garden.seasonStart);
    state.garden.lastUpdate = new Date(state.garden.lastUpdate);

    // Plant dates
    state.garden.plants = state.garden.plants.map((plant: any) => ({
      ...plant,
      plantedDate: new Date(plant.plantedDate),
      lastWatered: new Date(plant.lastWatered),
      lastUpdate: new Date(plant.lastUpdate)
    }));

    // Achievement dates
    state.garden.achievements = state.garden.achievements.map((achievement: any) => ({
      ...achievement,
      unlockedDate: achievement.unlockedDate ? new Date(achievement.unlockedDate) : undefined
    }));

    // Memory dates
    state.memories = state.memories.map((memory: any) => ({
      ...memory,
      date: new Date(memory.date)
    }));

    // Seed dates
    state.seeds = state.seeds.map((seed: any) => ({
      ...seed,
      created: new Date(seed.created)
    }));

    return state;
  }

  /**
   * Clear all garden data (reset)
   */
  static clear(): void {
    localStorage.removeItem(LocalStorage.STORAGE_KEY);
  }

  /**
   * Export garden data as JSON (for backup)
   */
  static export(): string {
    const state = this.load();
    return JSON.stringify(state, null, 2);
  }

  /**
   * Import garden data from JSON
   */
  static import(jsonData: string): void {
    try {
      const state = JSON.parse(jsonData);
      const hydrated = this.hydrateDates(state);
      this.save(hydrated);
    } catch (error) {
      console.error('Failed to import garden data:', error);
      throw new Error('Invalid garden data');
    }
  }
}

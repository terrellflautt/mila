/**
 * Garden Simulator - Simple skill progression system
 * No penalties, no stress - just rewarding curiosity and exploration
 */

export const GrowthStages = {
  SEED: 0,
  SPROUT: 1,
  SMALL: 2,
  MEDIUM: 3,
  MATURE: 4
};

export const PlantTypes = {
  // Basic plants (Level 1-3)
  DAISY: { name: 'Daisy', hue: 0.15, size: 1, requiredLevel: 1, xpValue: 5 },
  TULIP: { name: 'Tulip', hue: 0.95, size: 1.2, requiredLevel: 1, xpValue: 5 },

  // Intermediate plants (Level 4-6)
  ROSE: { name: 'Rose', hue: 0, size: 1.4, requiredLevel: 4, xpValue: 10 },
  LILY: { name: 'Lily', hue: 0.58, size: 1.5, requiredLevel: 5, xpValue: 12 },
  ORCHID: { name: 'Orchid', hue: 0.8, size: 1.6, requiredLevel: 6, xpValue: 15 },

  // Advanced plants (Level 7-10)
  LOTUS: { name: 'Lotus', hue: 0.92, size: 2, requiredLevel: 7, xpValue: 20 },
  SUNFLOWER: { name: 'Sunflower', hue: 0.14, size: 2.5, requiredLevel: 8, xpValue: 25 },
  PEONY: { name: 'Peony', hue: 0.97, size: 2, requiredLevel: 9, xpValue: 30 },

  // Master plants (Level 10+)
  MOON_FLOWER: { name: 'Moon Flower', hue: 0.65, size: 3, requiredLevel: 10, xpValue: 50 }
};

export class GardenSimulator {
  constructor() {
    this.plants = [];
    this.skill = {
      level: 1,
      experience: 0,
      totalActions: 0
    };

    // Load saved state
    this.loadState();
  }

  /**
   * Get available plants for current skill level
   */
  getAvailablePlants() {
    return Object.entries(PlantTypes)
      .filter(([_, plant]) => plant.requiredLevel <= this.skill.level)
      .map(([key, plant]) => ({ key, ...plant }));
  }

  /**
   * Get random plant type appropriate for skill level
   */
  getRandomPlantType() {
    const available = this.getAvailablePlants();
    return available[Math.floor(Math.random() * available.length)];
  }

  /**
   * Plant a seed at position
   */
  plantSeed(position) {
    const plantType = this.getRandomPlantType();

    const plant = {
      id: `plant-${Date.now()}-${Math.random()}`,
      position: { ...position },
      type: plantType,
      stage: GrowthStages.SEED,
      plantedAt: Date.now(),
      lastGrowth: Date.now()
    };

    this.plants.push(plant);
    this.grantExperience('plant', plantType.xpValue);
    this.saveState();

    return { success: true, plant };
  }

  /**
   * Grow plant to next stage
   */
  growPlant(plantId) {
    const plant = this.plants.find(p => p.id === plantId);
    if (!plant) return { success: false, message: 'Plant not found' };

    if (plant.stage >= GrowthStages.MATURE) {
      return { success: false, message: 'Plant is fully grown' };
    }

    plant.stage++;
    plant.lastGrowth = Date.now();

    if (plant.stage === GrowthStages.MATURE) {
      this.grantExperience('mature', plant.type.xpValue * 2);
    }

    this.saveState();
    return { success: true, plant };
  }

  /**
   * Grant experience points and handle level ups
   */
  grantExperience(action, amount) {
    this.skill.experience += amount;
    this.skill.totalActions++;

    // Check for level up (100 XP per level)
    const xpForNextLevel = this.skill.level * 100;
    if (this.skill.experience >= xpForNextLevel) {
      this.skill.level++;
      this.skill.experience = this.skill.experience - xpForNextLevel;
      this.saveState();
      return { levelUp: true, newLevel: this.skill.level };
    }

    this.saveState();
    return { levelUp: false };
  }

  /**
   * Get progress to next level (0-1)
   */
  getProgressToNextLevel() {
    const xpForNextLevel = this.skill.level * 100;
    return this.skill.experience / xpForNextLevel;
  }

  /**
   * Get all plants
   */
  getPlants() {
    return this.plants;
  }

  /**
   * Get skill info
   */
  getSkillInfo() {
    return {
      ...this.skill,
      progressToNext: this.getProgressToNextLevel(),
      xpNeeded: this.skill.level * 100
    };
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    const state = {
      plants: this.plants,
      skill: this.skill
    };
    localStorage.setItem('milas-world-garden-state', JSON.stringify(state));
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem('milas-world-garden-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.plants = state.plants || [];
        this.skill = state.skill || { level: 1, experience: 0, totalActions: 0 };
      }
    } catch (e) {
      console.warn('Failed to load garden state:', e);
    }
  }

  /**
   * Reset garden (for testing)
   */
  reset() {
    this.plants = [];
    this.skill = { level: 1, experience: 0, totalActions: 0 };
    this.saveState();
  }
}

/**
 * Garden Simulator - Persistent garden with growth, genetics, and skill progression
 * Based on grow-your-garden mechanics and flower-game genetics
 */

// Plant growth stages
export const GrowthStages = {
  SEED: 0,
  SPROUT: 1,
  SMALL: 2,
  MEDIUM: 3,
  MATURE: 4
};

// Plant genetics (dominant/recessive traits)
export const PlantGenetics = {
  colors: {
    dominant: ['pink', 'red', 'purple'],
    recessive: ['white', 'yellow', 'blue']
  },
  shapes: {
    dominant: ['star', 'round', 'bell'],
    recessive: ['cup', 'tube', 'flat']
  },
  sizes: {
    dominant: ['large', 'medium'],
    recessive: ['small', 'tiny']
  }
};

/**
 * Garden Simulator Class
 */
export class GardenSimulator {
  constructor() {
    this.plants = [];
    this.skill = {
      level: 1,
      experience: 0,
      totalActions: 0
    };
    this.resources = {
      seeds: 3,
      water: 10,
      fertilizer: 5
    };
    this.season = 'spring';
    this.lastUpdate = Date.now();

    this.loadState();
  }

  /**
   * Load garden state from localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem('mila:eternal-garden-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.plants = state.plants || [];
        this.skill = state.skill || this.skill;
        this.resources = state.resources || this.resources;
        this.season = state.season || 'spring';
        this.lastUpdate = state.lastUpdate || Date.now();

        // Process time-based growth for plants that were offline
        this.processOfflineGrowth();
      }
    } catch (error) {
      console.error('Failed to load garden state:', error);
    }
  }

  /**
   * Save garden state to localStorage
   */
  saveState() {
    try {
      const state = {
        plants: this.plants,
        skill: this.skill,
        resources: this.resources,
        season: this.season,
        lastUpdate: Date.now()
      };
      localStorage.setItem('mila:eternal-garden-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save garden state:', error);
    }
  }

  /**
   * Process growth that happened while player was away
   */
  processOfflineGrowth() {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastUpdate) / 1000;

    this.plants.forEach(plant => {
      if (plant.stage < GrowthStages.MATURE) {
        // Calculate how many growth ticks happened
        const growthRate = this.getGrowthRate(plant);
        const ticksPassed = Math.floor(elapsedSeconds / growthRate);

        if (ticksPassed > 0) {
          plant.stage = Math.min(GrowthStages.MATURE, plant.stage + ticksPassed);
          plant.lastWatered = now; // Reset water timer
        }
      }
    });
  }

  /**
   * Get growth rate based on season and skill
   */
  getGrowthRate(plant) {
    let baseRate = 30; // 30 seconds per stage

    // Seasonal modifiers (from grow-your-garden)
    const seasonalMultipliers = {
      spring: 1.2,  // 20% faster
      summer: 1.0,  // Normal
      fall: 0.8,    // 20% slower
      winter: 0.6   // 40% slower
    };

    const seasonMod = seasonalMultipliers[this.season] || 1.0;

    // Skill bonus: higher skill = faster growth
    const skillMod = 1 + (this.skill.level * 0.01); // 1% per level

    return baseRate / (seasonMod * skillMod);
  }

  /**
   * Plant a seed at position
   */
  plantSeed(position, genetics = null) {
    // ALWAYS ALLOW PLANTING - infinite seeds, no stress
    // Check if position is occupied
    const occupied = this.plants.some(p =>
      Math.abs(p.position.x - position.x) < 2 &&
      Math.abs(p.position.z - position.z) < 2
    );

    if (occupied) {
      return { success: false, message: 'Space is occupied!' };
    }

    // Generate genetics if not provided
    if (!genetics) {
      genetics = this.generateRandomGenetics();
    }

    const plant = {
      id: `plant-${Date.now()}-${Math.random()}`,
      position: { ...position },
      stage: GrowthStages.SEED,
      genetics: genetics,
      plantedAt: Date.now(),
      lastWatered: Date.now(),
      watered: true
    };

    this.plants.push(plant);
    // Don't decrease seeds - infinite seeds for chill vibes

    // Grant XP
    this.grantExperience('plant', 5);

    this.saveState();

    return { success: true, plant };
  }

  /**
   * Water a plant
   */
  waterPlant(plantId) {
    // INFINITE WATER - just enjoy the animations!
    const plant = this.plants.find(p => p.id === plantId);
    if (!plant) {
      return { success: false, message: 'Plant not found!' };
    }

    if (plant.stage >= GrowthStages.MATURE) {
      return { success: true, message: '✨ Already beautiful!' }; // No penalty, just a nice message
    }

    plant.watered = true;
    plant.lastWatered = Date.now();
    plant.growthBoost = 2; // 2 seconds per stage for 8 seconds
    plant.growthBoostEnd = Date.now() + 8000;

    // Don't decrease water - infinite for chill vibes
    this.grantExperience('water', 2);

    this.saveState();

    return { success: true, message: '💧 Plant watered!' };
  }

  /**
   * Fertilize a plant
   */
  fertilizePlant(plantId) {
    // INFINITE FERTILIZER - just enjoy!
    const plant = this.plants.find(p => p.id === plantId);
    if (!plant) {
      return { success: false, message: 'Plant not found!' };
    }

    if (plant.stage >= GrowthStages.MATURE) {
      return { success: true, message: '✨ Looking perfect!' }; // No penalty
    }

    plant.fertilized = true;
    plant.growthBoost = 1.5; // 1.5 seconds per stage for 12 seconds
    plant.growthBoostEnd = Date.now() + 12000;

    // Don't decrease fertilizer - infinite for chill vibes
    this.grantExperience('fertilize', 3);

    this.saveState();

    return { success: true, message: '✨ Plant fertilized!' };
  }

  /**
   * Harvest a mature plant - ALWAYS REWARDING!
   */
  harvestPlant(plantId) {
    const plantIndex = this.plants.findIndex(p => p.id === plantId);
    if (plantIndex === -1) {
      return { success: false, message: 'Plant not found!' };
    }

    const plant = this.plants[plantIndex];

    // GENEROUS rewards - always feel good about harvesting!
    const rewards = {
      [GrowthStages.SEED]: { seeds: 2, xp: 5 },     // Even seeds give rewards!
      [GrowthStages.SPROUT]: { seeds: 3, xp: 7 },
      [GrowthStages.SMALL]: { seeds: 4, xp: 10 },
      [GrowthStages.MEDIUM]: { seeds: 5, xp: 15 },
      [GrowthStages.MATURE]: { seeds: 7, xp: 25 }   // Big reward for patience
    };

    const reward = rewards[plant.stage];

    // Resources are just for display now (infinite), but we still track for satisfaction
    this.resources.seeds += reward.seeds;
    this.grantExperience('harvest', reward.xp);

    // Remove plant
    this.plants.splice(plantIndex, 1);

    this.saveState();

    const messages = [
      `✨ Beautiful! +${reward.seeds} seeds`,
      `🌸 Lovely! +${reward.seeds} seeds`,
      `💕 Perfect! +${reward.seeds} seeds`,
      `🌺 Gorgeous! +${reward.seeds} seeds`
    ];

    return {
      success: true,
      message: messages[Math.floor(Math.random() * messages.length)],
      rewards: reward,
      genetics: plant.genetics // Save genetics for breeding
    };
  }

  /**
   * Cross-breed two mature plants (Punnett Square genetics) - DISCOVERY AND WONDER!
   */
  crossBreed(plant1Id, plant2Id) {
    const plant1 = this.plants.find(p => p.id === plant1Id);
    const plant2 = this.plants.find(p => p.id === plant2Id);

    if (!plant1 || !plant2) {
      return { success: false, message: 'Plants not found!' };
    }

    if (plant1.stage < GrowthStages.MATURE || plant2.stage < GrowthStages.MATURE) {
      // Gentle message, not an error - encourages patience
      return { success: true, message: '🌱 Plants need to grow a bit more...' };
    }

    // Generate offspring genetics using Punnett Square
    const offspring = this.breedGenetics(plant1.genetics, plant2.genetics);

    // GENEROUS REWARDS - discovering new genetics is exciting!
    this.resources.seeds += 5; // More seeds for experimentation!
    this.grantExperience('breed', 30); // Big XP boost for curiosity!

    this.saveState();

    const messages = [
      '💕 Magic! Created something new! +5 seeds',
      '✨ Beautiful combination! +5 seeds',
      '🌸 A new flower is born! +5 seeds',
      '🌺 Love creates wonder! +5 seeds'
    ];

    return {
      success: true,
      message: messages[Math.floor(Math.random() * messages.length)],
      genetics: offspring
    };
  }

  /**
   * Generate random genetics
   */
  generateRandomGenetics() {
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Random trait selection with dominant/recessive
    const genetics = {};

    ['colors', 'shapes', 'sizes'].forEach(trait => {
      const dominant = pickRandom(PlantGenetics[trait].dominant);
      const recessive = pickRandom(PlantGenetics[trait].recessive);

      // Expressed trait based on dominance
      genetics[trait] = {
        dominant,
        recessive,
        expressed: dominant // Dominant always shows
      };
    });

    return genetics;
  }

  /**
   * Breed genetics using Punnett Square (simplified)
   */
  breedGenetics(parent1, parent2) {
    const offspring = {};

    ['colors', 'shapes', 'sizes'].forEach(trait => {
      // Each parent can pass either dominant or recessive
      const alleles = [
        Math.random() < 0.5 ? parent1[trait].dominant : parent1[trait].recessive,
        Math.random() < 0.5 ? parent2[trait].dominant : parent2[trait].recessive
      ];

      // Determine dominance
      const isDominant1 = PlantGenetics[trait].dominant.includes(alleles[0]);
      const isDominant2 = PlantGenetics[trait].dominant.includes(alleles[1]);

      let expressed;
      if (isDominant1 && isDominant2) {
        expressed = alleles[0]; // Both dominant, pick first
      } else if (isDominant1) {
        expressed = alleles[0]; // First is dominant
      } else if (isDominant2) {
        expressed = alleles[1]; // Second is dominant
      } else {
        expressed = alleles[0]; // Both recessive, pick first
      }

      offspring[trait] = {
        dominant: alleles[0],
        recessive: alleles[1],
        expressed
      };
    });

    return offspring;
  }

  /**
   * Grant experience and level up
   */
  grantExperience(action, xp) {
    this.skill.experience += xp;
    this.skill.totalActions++;

    // Level up check
    const xpForNextLevel = 100 + (this.skill.level - 1) * 10;
    if (this.skill.experience >= xpForNextLevel && this.skill.level < 100) {
      this.skill.experience -= xpForNextLevel;
      this.skill.level++;
      return { leveledUp: true, newLevel: this.skill.level };
    }

    return { leveledUp: false };
  }

  /**
   * Update plants (called each frame)
   */
  update(deltaTime) {
    const now = Date.now();

    this.plants.forEach(plant => {
      if (plant.stage >= GrowthStages.MATURE) return;

      // Check if plant has growth boost
      let growthRate = this.getGrowthRate(plant);

      if (plant.growthBoostEnd && now < plant.growthBoostEnd) {
        growthRate = plant.growthBoost;
      }

      // Check if enough time has passed for growth
      if (!plant.nextGrowthTime) {
        plant.nextGrowthTime = now + (growthRate * 1000);
      }

      if (now >= plant.nextGrowthTime) {
        plant.stage = Math.min(GrowthStages.MATURE, plant.stage + 1);
        plant.nextGrowthTime = now + (growthRate * 1000);

        // Save state when plant grows
        this.saveState();
      }
    });
  }

  /**
   * Get plant color based on genetics
   */
  getPlantColor(plant) {
    const colorMap = {
      pink: 0xFF6B9D,
      red: 0xFF4444,
      purple: 0xDA70D6,
      white: 0xFFFFFF,
      yellow: 0xFFEB3B,
      blue: 0x87CEEB
    };

    return colorMap[plant.genetics.colors.expressed] || 0xFF6B9D;
  }

  /**
   * Get plant size scale based on genetics and stage
   */
  getPlantScale(plant) {
    const stageScales = [0.3, 0.5, 0.7, 0.9, 1.0];
    const baseScale = stageScales[plant.stage];

    const sizeMultipliers = {
      tiny: 0.6,
      small: 0.8,
      medium: 1.0,
      large: 1.3
    };

    const sizeMultiplier = sizeMultipliers[plant.genetics.sizes.expressed] || 1.0;

    return baseScale * sizeMultiplier;
  }
}

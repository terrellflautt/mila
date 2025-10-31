/**
 * Plant growth algorithms
 * Calculates growth progression based on multiple factors
 */

import type { Plant, Garden, Season, GrowthStage, Memory } from '../types.js';
import { getSkillMultiplier } from './skill.js';

/**
 * Growth stages in order
 */
const GROWTH_STAGES: GrowthStage[] = ['seed', 'sprout', 'small', 'medium', 'mature'];

/**
 * Seasonal growth modifiers
 */
const SEASONAL_MODIFIERS: Record<Season, number> = {
  spring: 1.3,  // Best growth season
  summer: 1.0,  // Normal growth
  fall: 0.8,    // Slower growth
  winter: 0.5   // Significantly slower
};

/**
 * Calculate growth rate based on all factors
 */
export function calculateGrowthRate(plant: Plant, garden: Garden): number {
  // Base rate: 0.5 stages per day = 2 days per stage
  let rate = 0.5;

  // Seasonal modifier
  rate *= SEASONAL_MODIFIERS[garden.season];

  // Water level impact (optimal at 60-80%)
  const waterMod = calculateWaterModifier(plant.waterLevel);
  rate *= waterMod;

  // Health impact (linear)
  const healthMod = plant.health / 100;
  rate *= healthMod;

  // Gardening skill multiplier (higher skill = better growth)
  const skillMod = getSkillMultiplier(garden.skill);
  rate *= skillMod;

  return Math.max(0, rate); // Never negative
}

/**
 * Calculate water modifier for growth
 * Plants grow best when water is 60-80%
 */
function calculateWaterModifier(waterLevel: number): number {
  if (waterLevel >= 60 && waterLevel <= 80) {
    return 1.2; // Optimal range
  } else if (waterLevel >= 40 && waterLevel < 60) {
    return 1.0; // Good
  } else if (waterLevel >= 80 && waterLevel < 90) {
    return 1.0; // Good
  } else if (waterLevel >= 20 && waterLevel < 40) {
    return 0.7; // Needs water
  } else if (waterLevel >= 90) {
    return 0.8; // Overwatered
  } else {
    return 0.4; // Critically low
  }
}

/**
 * Advance plant growth by elapsed time
 */
export function advancePlantGrowth(plant: Plant, garden: Garden, deltaTimeMs: number): {
  stagesAdvanced: number;
  newStage?: GrowthStage;
  shouldCreateMemory: boolean;
} {
  const deltaDays = deltaTimeMs / (24 * 60 * 60 * 1000);
  const growthRate = calculateGrowthRate(plant, garden);
  const stagesAdvanced = growthRate * deltaDays;

  const oldProgress = plant.growthProgress;
  const oldStage = plant.growthStage;

  plant.growthProgress += stagesAdvanced;

  // Check for stage advancement
  const currentStageIndex = GROWTH_STAGES.indexOf(plant.growthStage);
  const newStageIndex = Math.min(Math.floor(plant.growthProgress), GROWTH_STAGES.length - 1);

  let newStage: GrowthStage | undefined;
  let shouldCreateMemory = false;

  if (newStageIndex > currentStageIndex) {
    newStage = GROWTH_STAGES[newStageIndex];
    plant.growthStage = newStage;

    // Create memory for significant milestones
    if (newStage === 'mature') {
      shouldCreateMemory = true;
    }
  }

  plant.lastUpdate = new Date();

  return { stagesAdvanced, newStage, shouldCreateMemory };
}

/**
 * Deplete water over time
 * Water decreases faster in summer, slower in winter
 */
export function depleteWater(plant: Plant, garden: Garden, deltaTimeMs: number): void {
  const deltaDays = deltaTimeMs / (24 * 60 * 60 * 1000);

  // Base depletion: 15% per day
  let depletionRate = 15;

  // Seasonal impact
  const seasonalDepletionMods: Record<Season, number> = {
    spring: 1.0,
    summer: 1.5,  // Plants need more water in summer
    fall: 0.8,
    winter: 0.5   // Less water needed in winter
  };

  depletionRate *= seasonalDepletionMods[garden.season];

  // Larger plants need more water
  const stageMods: Record<GrowthStage, number> = {
    seed: 0.5,
    sprout: 0.7,
    small: 0.9,
    medium: 1.1,
    mature: 1.3
  };

  depletionRate *= stageMods[plant.growthStage];

  const waterLost = depletionRate * deltaDays;
  plant.waterLevel = Math.max(0, plant.waterLevel - waterLost);

  plant.lastUpdate = new Date();
}

/**
 * Calculate health based on water level and care
 */
export function updateHealth(plant: Plant): void {
  // Health slowly recovers or degrades based on water level
  const targetHealth = calculateTargetHealth(plant.waterLevel);
  const healthDiff = targetHealth - plant.health;

  // Adjust health by 10% of the difference (slow changes)
  plant.health += healthDiff * 0.1;
  plant.health = Math.max(0, Math.min(100, plant.health));
}

/**
 * Calculate target health based on water level
 */
function calculateTargetHealth(waterLevel: number): number {
  if (waterLevel >= 50) {
    return 100; // Healthy
  } else if (waterLevel >= 30) {
    return 80; // Good
  } else if (waterLevel >= 15) {
    return 60; // Stressed
  } else if (waterLevel >= 5) {
    return 40; // Poor
  } else {
    return 20; // Critical
  }
}

/**
 * Water a plant
 */
export function waterPlant(plant: Plant, amount: number = 30): void {
  plant.waterLevel = Math.min(100, plant.waterLevel + amount);
  plant.lastWatered = new Date();
  plant.lastUpdate = new Date();
}

/**
 * Apply fertilizer to a plant (boosts growth temporarily)
 */
export function fertilizePlant(plant: Plant): void {
  // Fertilizer gives a temporary health boost
  plant.health = Math.min(100, plant.health + 20);
  plant.lastUpdate = new Date();
}

/**
 * Update entire garden (all plants)
 */
export function updateGarden(garden: Garden): Memory[] {
  const now = new Date();
  const deltaTime = now.getTime() - garden.lastUpdate.getTime();

  const memories: Memory[] = [];

  // Update each plant
  for (const plant of garden.plants) {
    const plantDelta = now.getTime() - plant.lastUpdate.getTime();

    // Advance growth
    const { shouldCreateMemory, newStage } = advancePlantGrowth(plant, garden, plantDelta);

    if (shouldCreateMemory && newStage === 'mature') {
      memories.push({
        id: `memory-${Date.now()}-${Math.random()}`,
        date: now,
        type: 'bloom',
        description: `${plant.name} bloomed.`,
        plantId: plant.id,
        metadata: { stage: newStage }
      });
    }

    // Deplete water
    depleteWater(plant, garden, plantDelta);

    // Update health
    updateHealth(plant);
  }

  garden.lastUpdate = now;

  return memories;
}

/**
 * Check if season should advance (5 real-world days = 1 season)
 */
export function checkSeasonAdvance(garden: Garden): boolean {
  const now = new Date();
  const daysSinceSeasonStart = (now.getTime() - garden.seasonStart.getTime()) / (24 * 60 * 60 * 1000);

  if (daysSinceSeasonStart >= 5) {
    // Advance season
    const seasons: Season[] = ['spring', 'summer', 'fall', 'winter'];
    const currentIndex = seasons.indexOf(garden.season);
    const nextIndex = (currentIndex + 1) % seasons.length;

    garden.season = seasons[nextIndex];
    garden.seasonStart = now;
    garden.lastUpdate = now;

    return true;
  }

  return false;
}

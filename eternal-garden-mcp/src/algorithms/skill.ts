/**
 * Gardening skill progression system
 * Skill increases naturally through gardening actions
 * Higher skill = cooler plants, better outcomes
 */

import type { GardeningSkill, Garden } from '../types.js';

/**
 * Action types that grant experience
 */
export type GardeningAction = 'plant' | 'water' | 'cross-breed' | 'harvest' | 'fertilize';

/**
 * Experience gained per action (randomized slightly)
 */
const ACTION_XP: Record<GardeningAction, { min: number; max: number }> = {
  plant: { min: 3, max: 6 },
  water: { min: 1, max: 2 },
  'cross-breed': { min: 8, max: 15 }, // More XP for complex actions
  harvest: { min: 4, max: 7 },
  fertilize: { min: 2, max: 4 }
};

/**
 * Calculate XP needed for next level
 * Gets progressively harder but not exponential
 */
function xpForNextLevel(currentLevel: number): number {
  // Level 1->2 needs 100 XP
  // Level 2->3 needs 110 XP
  // Level 3->4 needs 120 XP
  // Etc.
  return 100 + (currentLevel - 1) * 10;
}

/**
 * Grant experience for a gardening action
 * Returns true if leveled up
 */
export function grantExperience(
  garden: Garden,
  action: GardeningAction
): { leveledUp: boolean; xpGained: number } {
  const { min, max } = ACTION_XP[action];
  const xpGained = Math.floor(Math.random() * (max - min + 1)) + min;

  garden.skill.experience += xpGained;
  garden.skill.totalActions += 1;

  // Check for level up
  const xpNeeded = xpForNextLevel(garden.skill.level);

  if (garden.skill.experience >= xpNeeded && garden.skill.level < 100) {
    garden.skill.experience -= xpNeeded;
    garden.skill.level += 1;
    return { leveledUp: true, xpGained };
  }

  return { leveledUp: false, xpGained };
}

/**
 * Get skill multiplier for plant quality
 * Higher skill = better growth rates, health, etc.
 */
export function getSkillMultiplier(skill: GardeningSkill): number {
  // Level 1 = 1.0x
  // Level 50 = 1.25x
  // Level 100 = 1.5x
  return 1.0 + (skill.level - 1) * 0.005;
}

/**
 * Calculate chance of rare plant traits based on skill
 * Higher skill = more interesting plants
 */
export function getRarePlantChance(skill: GardeningSkill): {
  uncommon: number;
  rare: number;
  legendary: number;
} {
  // Base chances are very low
  // Skill dramatically improves them
  const skillBonus = skill.level / 100;

  return {
    uncommon: 0.15 + skillBonus * 0.15, // 15% → 30%
    rare: 0.05 + skillBonus * 0.10,     // 5% → 15%
    legendary: 0.01 + skillBonus * 0.05 // 1% → 6%
  };
}

/**
 * Determine plant rarity based on skill and RNG
 */
export function determineRarity(skill: GardeningSkill): 'common' | 'uncommon' | 'rare' | 'legendary' {
  const chances = getRarePlantChance(skill);
  const roll = Math.random();

  if (roll < chances.legendary) return 'legendary';
  if (roll < chances.legendary + chances.rare) return 'rare';
  if (roll < chances.legendary + chances.rare + chances.uncommon) return 'uncommon';
  return 'common';
}

/**
 * Get skill tier name (for poetic feedback)
 */
export function getSkillTier(skill: GardeningSkill): string {
  if (skill.level >= 90) return 'master gardener';
  if (skill.level >= 75) return 'expert gardener';
  if (skill.level >= 50) return 'skilled gardener';
  if (skill.level >= 25) return 'apprentice gardener';
  return 'novice gardener';
}

/**
 * Check if skill level unlocks special features
 */
export function checkSkillUnlocks(skill: GardeningSkill): string[] {
  const unlocks: string[] = [];

  // Milestone unlocks
  if (skill.level === 10) unlocks.push('New colors available');
  if (skill.level === 25) unlocks.push('Rare bloom patterns');
  if (skill.level === 50) unlocks.push('Exotic fragrances');
  if (skill.level === 75) unlocks.push('Legendary genetics');
  if (skill.level === 100) unlocks.push('Perfect harmony');

  return unlocks;
}

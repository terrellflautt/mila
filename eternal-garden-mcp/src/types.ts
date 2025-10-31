/**
 * Type definitions for Eternal Garden MCP Server
 */

export interface GeneticTrait {
  dominant: string;
  recessive: string;
  expressed: string;
}

export interface PlantGenetics {
  color: GeneticTrait;
  bloomSize: GeneticTrait;
  height: GeneticTrait;
  bloomPattern: GeneticTrait;
  fragrance: GeneticTrait;
}

export type GrowthStage = 'seed' | 'sprout' | 'small' | 'medium' | 'mature';
export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  plantedDate: Date;
  growthStage: GrowthStage;
  growthProgress: number; // 0-4, fractional
  genetics: PlantGenetics;
  health: number; // 0-100
  waterLevel: number; // 0-100
  lastWatered: Date;
  lastUpdate: Date;
  seasonalModifier: number;
  position: Position;
  metadata: Record<string, any>;
}

export interface Resources {
  water: number;
  fertilizer: number;
  seeds: Seed[];
}

export interface GardenLayout {
  width: number;
  height: number;
  occupiedPositions: Position[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedDate?: Date;
}

export interface GardeningSkill {
  level: number; // 1-100
  experience: number; // 0-100 for current level
  totalActions: number; // Total gardening actions performed
}

export interface Garden {
  id: string;
  name: string;
  created: Date;
  season: Season;
  seasonStart: Date;
  plants: Plant[];
  layout: GardenLayout;
  resources: Resources;
  achievements: Achievement[];
  skill: GardeningSkill;
  lastUpdate: Date;
}

export type MemoryType = 'planting' | 'bloom' | 'harvest' | 'milestone' | 'discovery' | 'cross-breed' | 'growth';

export interface Memory {
  id: string;
  date: Date;
  type: MemoryType;
  description: string;
  plantId?: string;
  metadata: Record<string, any>;
}

export interface Seed {
  id: string;
  species: string;
  genetics: PlantGenetics;
  from?: [string, string]; // Parent plant IDs if cross-bred
  created: Date;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
}

export interface GardenState {
  garden: Garden;
  memories: Memory[];
  seeds: Seed[];
}

// Growth calculation parameters
export interface GrowthFactors {
  baseRate: number;
  seasonalModifier: number;
  waterModifier: number;
  healthModifier: number;
}

// Achievement conditions
export type AchievementCondition = (garden: Garden, memories: Memory[]) => boolean;

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  condition: AchievementCondition;
}

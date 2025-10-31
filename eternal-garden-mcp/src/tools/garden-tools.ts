/**
 * MCP tools for eternal garden management
 */

import type { Garden, Plant, Seed, Position, Memory } from '../types.js';
import { LocalStorage } from '../storage/local.js';
import {
  updateGarden,
  waterPlant as waterPlantAlgo,
  fertilizePlant as fertilizePlantAlgo,
  checkSeasonAdvance
} from '../algorithms/growth.js';
import { crossBreed, describeGenetics } from '../algorithms/genetics.js';
import { grantExperience, getSkillTier } from '../algorithms/skill.js';

/**
 * Get current garden state
 */
export async function getGardenStatus(): Promise<{
  garden: Garden;
  plantCount: number;
  season: string;
  skillLevel: number;
  skillTier: string;
}> {
  const state = LocalStorage.load();

  if (!state) {
    throw new Error('No garden found. Create a new garden first.');
  }

  // Update garden before returning status
  const memories = updateGarden(state.garden);
  if (memories.length > 0) {
    state.memories.push(...memories);
  }

  // Check for season change
  const seasonChanged = checkSeasonAdvance(state.garden);

  // Save updated state
  LocalStorage.save(state);

  return {
    garden: state.garden,
    plantCount: state.garden.plants.length,
    season: state.garden.season,
    skillLevel: state.garden.skill.level,
    skillTier: getSkillTier(state.garden.skill)
  };
}

/**
 * Plant a seed in the garden
 */
export async function plantSeed(args: {
  seedId: string;
  position: Position;
  name?: string;
}): Promise<{
  plant: Plant;
  skillGained: { leveledUp: boolean; xpGained: number };
}> {
  const state = LocalStorage.load();

  if (!state) {
    throw new Error('No garden found.');
  }

  // Find seed
  const seedIndex = state.seeds.findIndex(s => s.id === args.seedId);
  if (seedIndex === -1) {
    throw new Error(`Seed ${args.seedId} not found.`);
  }

  const seed = state.seeds[seedIndex];

  // Check if position is available
  const occupied = state.garden.layout.occupiedPositions.some(
    pos => pos.x === args.position.x && pos.y === args.position.y
  );

  if (occupied) {
    throw new Error('Position already occupied.');
  }

  // Create plant from seed
  const now = new Date();
  const plant: Plant = {
    id: `plant-${Date.now()}-${Math.random()}`,
    name: args.name || seed.species,
    species: seed.species,
    plantedDate: now,
    growthStage: 'seed',
    growthProgress: 0,
    genetics: seed.genetics,
    health: 100,
    waterLevel: 80, // Start well-watered
    lastWatered: now,
    lastUpdate: now,
    seasonalModifier: 1.0,
    position: args.position,
    metadata: { rarity: seed.rarity }
  };

  // Add plant to garden
  state.garden.plants.push(plant);
  state.garden.layout.occupiedPositions.push(args.position);

  // Remove seed from inventory
  state.seeds.splice(seedIndex, 1);

  // Grant experience
  const skillGained = grantExperience(state.garden, 'plant');

  // Create memory
  const memory: Memory = {
    id: `memory-${Date.now()}-${Math.random()}`,
    date: now,
    type: 'planting',
    description: `Planted ${plant.name}.`,
    plantId: plant.id,
    metadata: { season: state.garden.season }
  };
  state.memories.push(memory);

  // Save
  LocalStorage.save(state);

  return { plant, skillGained };
}

/**
 * Water a plant
 */
export async function waterPlant(args: {
  plantId: string;
  amount?: number;
}): Promise<{
  plant: Plant;
  skillGained: { leveledUp: boolean; xpGained: number };
}> {
  const state = LocalStorage.load();

  if (!state) {
    throw new Error('No garden found.');
  }

  const plant = state.garden.plants.find(p => p.id === args.plantId);
  if (!plant) {
    throw new Error(`Plant ${args.plantId} not found.`);
  }

  // Water the plant
  waterPlantAlgo(plant, args.amount);

  // Grant experience
  const skillGained = grantExperience(state.garden, 'water');

  // Save
  LocalStorage.save(state);

  return { plant, skillGained };
}

/**
 * Cross-breed two plants to create a new seed
 */
export async function crossBreedPlants(args: {
  parent1Id: string;
  parent2Id: string;
}): Promise<{
  seed: Seed;
  description: string;
  skillGained: { leveledUp: boolean; xpGained: number };
}> {
  const state = LocalStorage.load();

  if (!state) {
    throw new Error('No garden found.');
  }

  const parent1 = state.garden.plants.find(p => p.id === args.parent1Id);
  const parent2 = state.garden.plants.find(p => p.id === args.parent2Id);

  if (!parent1 || !parent2) {
    throw new Error('One or both parent plants not found.');
  }

  // Both plants must be mature to cross-breed
  if (parent1.growthStage !== 'mature' || parent2.growthStage !== 'mature') {
    throw new Error('Both plants must be mature to cross-breed.');
  }

  // Cross-breed
  const seed = crossBreed(parent1, parent2, state.garden.skill);

  // Add seed to inventory
  state.seeds.push(seed);

  // Grant experience
  const skillGained = grantExperience(state.garden, 'cross-breed');

  // Create memory
  const memory: Memory = {
    id: `memory-${Date.now()}-${Math.random()}`,
    date: new Date(),
    type: 'cross-breed',
    description: `Created ${seed.species}.`,
    metadata: {
      parents: [parent1.name, parent2.name],
      rarity: seed.rarity
    }
  };
  state.memories.push(memory);

  // Save
  LocalStorage.save(state);

  const description = describeGenetics(seed.genetics);

  return { seed, description, skillGained };
}

/**
 * Get detailed information about a plant
 */
export async function getPlantDetails(args: {
  plantId: string;
}): Promise<{
  plant: Plant;
  age: number;
  geneticDescription: string;
  needsWater: boolean;
  health: string;
}> {
  const state = LocalStorage.load();

  if (!state) {
    throw new Error('No garden found.');
  }

  const plant = state.garden.plants.find(p => p.id === args.plantId);
  if (!plant) {
    throw new Error(`Plant ${args.plantId} not found.`);
  }

  const now = new Date();
  const age = Math.floor((now.getTime() - plant.plantedDate.getTime()) / (24 * 60 * 60 * 1000));

  const geneticDescription = describeGenetics(plant.genetics);

  const needsWater = plant.waterLevel < 40;

  let health: string;
  if (plant.health >= 80) health = 'thriving';
  else if (plant.health >= 60) health = 'healthy';
  else if (plant.health >= 40) health = 'stressed';
  else health = 'struggling';

  return {
    plant,
    age,
    geneticDescription,
    needsWater,
    health
  };
}

/**
 * Fertilize a plant
 */
export async function fertilizePlant(args: {
  plantId: string;
}): Promise<{
  plant: Plant;
  skillGained: { leveledUp: boolean; xpGained: number };
}> {
  const state = LocalStorage.load();

  if (!state) {
    throw new Error('No garden found.');
  }

  const plant = state.garden.plants.find(p => p.id === args.plantId);
  if (!plant) {
    throw new Error(`Plant ${args.plantId} not found.`);
  }

  // Check resources
  if (state.garden.resources.fertilizer < 1) {
    throw new Error('Not enough fertilizer.');
  }

  // Fertilize
  fertilizePlantAlgo(plant);
  state.garden.resources.fertilizer -= 1;

  // Grant experience
  const skillGained = grantExperience(state.garden, 'fertilize');

  // Save
  LocalStorage.save(state);

  return { plant, skillGained };
}

/**
 * Get all memories
 */
export async function getMemories(args?: {
  type?: string;
  limit?: number;
}): Promise<Memory[]> {
  const state = LocalStorage.load();

  if (!state) {
    throw new Error('No garden found.');
  }

  let memories = state.memories;

  // Filter by type if specified
  if (args?.type) {
    memories = memories.filter(m => m.type === args.type);
  }

  // Sort by date (newest first)
  memories.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Limit if specified
  if (args?.limit) {
    memories = memories.slice(0, args.limit);
  }

  return memories;
}

/**
 * Get all available seeds
 */
export async function getSeeds(): Promise<Seed[]> {
  const state = LocalStorage.load();

  if (!state) {
    throw new Error('No garden found.');
  }

  return state.seeds;
}

/**
 * Initialize a new garden (if none exists)
 */
export async function initializeGarden(): Promise<Garden> {
  let state = LocalStorage.load();

  if (state) {
    return state.garden;
  }

  // Create new garden
  state = LocalStorage.createNew();
  return state.garden;
}

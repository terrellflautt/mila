/**
 * Plant genetics and cross-breeding system
 * Uses Mendelian inheritance with dominant/recessive traits
 */

import type { PlantGenetics, GeneticTrait, Seed, Plant, GardeningSkill } from '../types.js';
import { determineRarity } from './skill.js';

/**
 * Available trait values for each genetic trait
 */
const TRAIT_VALUES = {
  color: {
    options: ['red', 'pink', 'white', 'yellow', 'orange', 'purple', 'blue', 'lavender'],
    dominance: {
      red: 4,
      pink: 3,
      purple: 3,
      orange: 3,
      yellow: 2,
      lavender: 2,
      white: 1,
      blue: 1
    }
  },
  bloomSize: {
    options: ['tiny', 'small', 'medium', 'large', 'huge'],
    dominance: {
      huge: 4,
      large: 3,
      medium: 2,
      small: 1,
      tiny: 1
    }
  },
  height: {
    options: ['dwarf', 'short', 'medium', 'tall', 'towering'],
    dominance: {
      towering: 4,
      tall: 3,
      medium: 2,
      short: 1,
      dwarf: 1
    }
  },
  bloomPattern: {
    options: ['single', 'double', 'star', 'cup', 'ruffled', 'spiral', 'fractal'],
    dominance: {
      fractal: 4,
      spiral: 4,
      ruffled: 3,
      star: 3,
      double: 2,
      cup: 2,
      single: 1
    }
  },
  fragrance: {
    options: ['none', 'subtle', 'sweet', 'spicy', 'citrus', 'floral', 'exotic'],
    dominance: {
      exotic: 4,
      spicy: 3,
      citrus: 3,
      floral: 3,
      sweet: 2,
      subtle: 1,
      none: 1
    }
  }
};

/**
 * Perform Punnett square cross for a single trait
 */
function crossTrait(
  parent1Trait: GeneticTrait,
  parent2Trait: GeneticTrait,
  traitType: keyof typeof TRAIT_VALUES,
  skill: GardeningSkill
): GeneticTrait {
  // Get all possible allele combinations
  const alleles = [
    [parent1Trait.dominant, parent2Trait.dominant],
    [parent1Trait.dominant, parent2Trait.recessive],
    [parent1Trait.recessive, parent2Trait.dominant],
    [parent1Trait.recessive, parent2Trait.recessive]
  ];

  // Randomly select one combination (25% chance each)
  const chosenAlleles = alleles[Math.floor(Math.random() * 4)];

  // Determine which is dominant
  const dominance = TRAIT_VALUES[traitType].dominance as Record<string, number>;
  const [allele1, allele2] = chosenAlleles;

  const dom1 = dominance[allele1] || 1;
  const dom2 = dominance[allele2] || 1;

  let dominant: string;
  let recessive: string;
  let expressed: string;

  if (dom1 > dom2) {
    dominant = allele1;
    recessive = allele2;
    expressed = allele1;
  } else if (dom2 > dom1) {
    dominant = allele2;
    recessive = allele1;
    expressed = allele2;
  } else {
    // Equal dominance - randomly choose which is expressed
    dominant = allele1;
    recessive = allele2;
    expressed = Math.random() < 0.5 ? allele1 : allele2;
  }

  // Chance of mutation based on skill (rare, cool traits)
  const mutationChance = 0.02 + (skill.level / 100) * 0.08; // 2% to 10%

  if (Math.random() < mutationChance) {
    // Mutate to a random trait
    const options = TRAIT_VALUES[traitType].options;
    const newTrait = options[Math.floor(Math.random() * options.length)];

    // Mutation becomes dominant and expressed
    return {
      dominant: newTrait,
      recessive,
      expressed: newTrait
    };
  }

  return { dominant, recessive, expressed };
}

/**
 * Cross-breed two plants to create a new seed
 */
export function crossBreed(parent1: Plant, parent2: Plant, skill: GardeningSkill): Seed {
  const now = new Date();

  // Cross each trait
  const genetics: PlantGenetics = {
    color: crossTrait(parent1.genetics.color, parent2.genetics.color, 'color', skill),
    bloomSize: crossTrait(parent1.genetics.bloomSize, parent2.genetics.bloomSize, 'bloomSize', skill),
    height: crossTrait(parent1.genetics.height, parent2.genetics.height, 'height', skill),
    bloomPattern: crossTrait(parent1.genetics.bloomPattern, parent2.genetics.bloomPattern, 'bloomPattern', skill),
    fragrance: crossTrait(parent1.genetics.fragrance, parent2.genetics.fragrance, 'fragrance', skill)
  };

  // Generate hybrid name
  const species = generateHybridName(parent1.species, parent2.species, genetics);

  // Determine rarity based on skill and genetic uniqueness
  const rarity = determineRarity(skill);

  const seed: Seed = {
    id: `seed-${Date.now()}-${Math.random()}`,
    species,
    genetics,
    from: [parent1.id, parent2.id],
    created: now,
    rarity
  };

  return seed;
}

/**
 * Generate a hybrid name for cross-bred plants
 */
function generateHybridName(species1: string, species2: string, genetics: PlantGenetics): string {
  // Extract base names (remove everything after first space)
  const base1 = species1.split(' ')[0];
  const base2 = species2.split(' ')[0];

  // Use expressed traits to create poetic name
  const color = genetics.color.expressed;
  const pattern = genetics.bloomPattern.expressed;

  // Generate combinations
  const prefixes = [
    color.charAt(0).toUpperCase() + color.slice(1),
    pattern.charAt(0).toUpperCase() + pattern.slice(1)
  ];

  const suffixes = [
    base1,
    base2,
    `${base1}-${base2}`,
    'Hybrid',
    'Cross',
    'Beauty',
    'Dream',
    'Whisper',
    'Star'
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix} ${suffix}`;
}

/**
 * Generate random genetics for a new plant species
 */
export function generateRandomGenetics(skill: GardeningSkill): PlantGenetics {
  const genetics: PlantGenetics = {
    color: generateRandomTrait('color'),
    bloomSize: generateRandomTrait('bloomSize'),
    height: generateRandomTrait('height'),
    bloomPattern: generateRandomTrait('bloomPattern'),
    fragrance: generateRandomTrait('fragrance')
  };

  return genetics;
}

/**
 * Generate a random genetic trait
 */
function generateRandomTrait(traitType: keyof typeof TRAIT_VALUES): GeneticTrait {
  const options = TRAIT_VALUES[traitType].options;
  const dominance = TRAIT_VALUES[traitType].dominance as Record<string, number>;

  // Pick two random alleles
  const allele1 = options[Math.floor(Math.random() * options.length)];
  const allele2 = options[Math.floor(Math.random() * options.length)];

  const dom1 = dominance[allele1] || 1;
  const dom2 = dominance[allele2] || 1;

  if (dom1 > dom2) {
    return {
      dominant: allele1,
      recessive: allele2,
      expressed: allele1
    };
  } else if (dom2 > dom1) {
    return {
      dominant: allele2,
      recessive: allele1,
      expressed: allele2
    };
  } else {
    return {
      dominant: allele1,
      recessive: allele2,
      expressed: Math.random() < 0.5 ? allele1 : allele2
    };
  }
}

/**
 * Get a poetic description of a plant's genetics
 */
export function describeGenetics(genetics: PlantGenetics): string {
  const traits = [
    `${genetics.color.expressed} blooms`,
    `${genetics.bloomSize.expressed} flowers`,
    `${genetics.height.expressed} stems`,
    `${genetics.bloomPattern.expressed} pattern`,
    `${genetics.fragrance.expressed} fragrance`
  ];

  return traits.join(', ');
}

/**
 * Calculate genetic similarity between two plants (0-1)
 */
export function calculateGeneticSimilarity(genetics1: PlantGenetics, genetics2: PlantGenetics): number {
  let matches = 0;
  let total = 0;

  // Compare each trait
  const traits: (keyof PlantGenetics)[] = ['color', 'bloomSize', 'height', 'bloomPattern', 'fragrance'];

  for (const trait of traits) {
    const g1 = genetics1[trait];
    const g2 = genetics2[trait];

    // Compare dominant alleles
    if (g1.dominant === g2.dominant) matches++;
    total++;

    // Compare recessive alleles
    if (g1.recessive === g2.recessive) matches++;
    total++;
  }

  return matches / total;
}

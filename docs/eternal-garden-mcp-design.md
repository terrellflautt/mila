# Eternal Garden MCP Server Design

## Overview
Local MCP server for managing Mila's eternal garden - a living, evolving digital space that grows and changes over time.

## Key Learnings from Open Source Garden Games

### 1. **Grow Your Garden** - Core Mechanics
- **Growth Stages**: 5 stages (seed → sprout → small → medium → mature)
- **Seasonal System**: 4 seasons with growth modifiers
  - Spring: 1.2x growth
  - Summer: 1.0x growth
  - Fall: 0.8x growth
  - Winter: 0.6x growth
- **Resource System**: Water, fertilizer, money
- **Time-based Growth**: Real-time progression with accelerators
- **Achievement System**: Track milestones
- **30+ Plant Varieties**: Different types, rarities

### 2. **Flower Game (Phaser3)** - Genetics
- **Mendelian Inheritance**: Recessive/dominant traits
- **Punnett Square Breeding**: Intentional cross-breeding
- **Multiple Trait Axes**: Color, shape, stem
- **Random Generation**: Procedural variety
- **localStorage Persistence**: Save gardens locally

### 3. **ThreeD Garden** - Technical Stack
- **Three.js + React + Physics**: 3D interactive environment
- **Realistic Systems**: Soil, amendments, planting plans
- **AI Integration**: Garden planning and design
- **Type-safe Architecture**: Interfaces for all entities

## MCP Server Architecture

### Core Resources

```typescript
// Plant Resource
interface Plant {
  id: string;
  name: string;
  species: string;
  plantedDate: Date;
  growthStage: 'seed' | 'sprout' | 'small' | 'medium' | 'mature';
  genetics: PlantGenetics;
  health: number;
  waterLevel: number;
  lastWatered: Date;
  seasonalModifier: number;
  position: { x: number, y: number, z: number };
  metadata: Record<string, any>;
}

interface PlantGenetics {
  color: GeneticTrait;
  bloomSize: GeneticTrait;
  height: GeneticTrait;
  bloomPattern: GeneticTrait;
  fragrance: GeneticTrait;
}

interface GeneticTrait {
  dominant: string;
  recessive: string;
  expressed: string;
}

// Garden Resource
interface Garden {
  id: string;
  name: string;
  created: Date;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  seasonStart: Date;
  plants: Plant[];
  layout: GardenLayout;
  resources: Resources;
  achievements: Achievement[];
}

interface Resources {
  water: number;
  fertilizer: number;
  seeds: Seed[];
}

// Memory Resource (for context)
interface Memory {
  id: string;
  date: Date;
  type: 'planting' | 'bloom' | 'harvest' | 'milestone' | 'discovery';
  description: string;
  plantId?: string;
  metadata: Record<string, any>;
}
```

### MCP Tools

#### 1. Garden Management
- `plant_seed(species, position, genetics?)` - Plant new flower/plant
- `water_plant(plantId, amount)` - Water a specific plant
- `fertilize_plant(plantId)` - Apply fertilizer
- `harvest_plant(plantId)` - Harvest mature plant
- `cross_breed(parent1Id, parent2Id)` - Create hybrid seed

#### 2. Garden State
- `get_garden_status()` - Current garden state
- `get_plant(plantId)` - Detailed plant info
- `list_plants(filter?)` - All plants with optional filter
- `advance_time(days)` - Fast-forward growth
- `change_season(season)` - Trigger seasonal change

#### 3. Genetics & Breeding
- `analyze_genetics(plantId)` - Show genetic makeup
- `predict_offspring(parent1Id, parent2Id)` - Punnett square
- `discover_variant()` - Random mutation/discovery
- `save_cultivar(plantId, name)` - Save favorite genetics

#### 4. Memories & Achievements
- `record_memory(type, description, plantId?)` - Save moment
- `get_memories(dateRange?, type?)` - Retrieve memories
- `check_achievements()` - Track progress
- `unlock_achievement(achievementId)` - Complete milestone

#### 5. AI Garden Assistant
- `suggest_planting()` - AI-powered planting recommendations
- `diagnose_plant(plantId)` - Health analysis
- `design_layout(preferences)` - AI garden design
- `generate_plant_description(plantId)` - Poetic description

### MCP Prompts

#### 1. Garden Curator
```
You are the eternal garden's curator. Help Mila understand her garden's
current state, what needs attention, and suggest meaningful next steps.
Be poetic but practical.
```

#### 2. Botanist
```
You are a digital botanist specializing in genetics and plant breeding.
Explain plant genetics, help plan cross-breeding, and predict outcomes.
Use Mendelian principles but make it accessible.
```

#### 3. Memory Keeper
```
You help create beautiful memories from garden moments. Transform
technical events (plantings, blooms, harvests) into meaningful stories
that capture the emotional significance.
```

#### 4. Seasonal Guide
```
You guide Mila through the seasons, explaining how each season affects
the garden and suggesting seasonal activities. Make the cycles feel
meaningful and connected to real-world rhythms.
```

## Data Storage

### Local Storage (Browser)
```typescript
// localStorage keys
'eternal-garden:state' // Current garden state
'eternal-garden:plants' // All plants
'eternal-garden:memories' // Garden memories
'eternal-garden:achievements' // Progress
'eternal-garden:seeds' // Seed collection
```

### AWS Lambda Functions (Optional Cloud Sync)
```typescript
// Lambda functions for enhanced features
POST /api/garden/sync - Sync garden state to cloud
POST /api/garden/generate-plant - AI plant generation
POST /api/garden/analyze-genetics - Complex genetic analysis
GET /api/garden/global-cultivars - Community shared genetics
POST /api/garden/share-cultivar - Share your discovery
```

## Growth Algorithm

```typescript
function calculateGrowth(plant: Plant, deltaTime: number): number {
  // Base growth rate (stages per day)
  let growthRate = 0.5; // 2 days per stage

  // Seasonal modifier
  const seasonMods = {
    spring: 1.2,
    summer: 1.0,
    fall: 0.8,
    winter: 0.6
  };
  growthRate *= seasonMods[garden.season];

  // Water level impact
  const waterMod = Math.max(0.5, Math.min(1.2, plant.waterLevel / 100));
  growthRate *= waterMod;

  // Health impact
  const healthMod = plant.health / 100;
  growthRate *= healthMod;

  // Calculate stage progress
  const stagesAdvanced = growthRate * (deltaTime / (24 * 60 * 60 * 1000));

  return stagesAdvanced;
}

function advancePlantGrowth(plant: Plant): void {
  const now = new Date();
  const deltaTime = now.getTime() - plant.lastUpdate.getTime();

  const growth = calculateGrowth(plant, deltaTime);
  plant.growthProgress += growth;

  // Check for stage advancement
  const stages = ['seed', 'sprout', 'small', 'medium', 'mature'];
  const currentStageIndex = stages.indexOf(plant.growthStage);
  const newStageIndex = Math.min(4, Math.floor(plant.growthProgress));

  if (newStageIndex > currentStageIndex) {
    plant.growthStage = stages[newStageIndex];
    recordMemory({
      type: 'growth',
      description: `${plant.name} grew to ${plant.growthStage} stage`,
      plantId: plant.id
    });
  }

  // Water depletion
  plant.waterLevel = Math.max(0, plant.waterLevel - (deltaTime / (24 * 60 * 60 * 1000)) * 20);

  plant.lastUpdate = now;
}
```

## Genetics System

```typescript
function crossBreed(parent1: Plant, parent2: Plant): Seed {
  const offspring: PlantGenetics = {
    color: inheritTrait(parent1.genetics.color, parent2.genetics.color),
    bloomSize: inheritTrait(parent1.genetics.bloomSize, parent2.genetics.bloomSize),
    height: inheritTrait(parent1.genetics.height, parent2.genetics.height),
    bloomPattern: inheritTrait(parent1.genetics.bloomPattern, parent2.genetics.bloomPattern),
    fragrance: inheritTrait(parent1.genetics.fragrance, parent2.genetics.fragrance)
  };

  // 5% chance of beneficial mutation
  if (Math.random() < 0.05) {
    offspring.color = mutate(offspring.color);
  }

  return {
    id: generateId(),
    species: `${parent1.species} × ${parent2.species}`,
    genetics: offspring,
    from: [parent1.id, parent2.id],
    created: new Date()
  };
}

function inheritTrait(trait1: GeneticTrait, trait2: GeneticTrait): GeneticTrait {
  // Punnett square logic
  const alleles = [
    Math.random() < 0.5 ? trait1.dominant : trait1.recessive,
    Math.random() < 0.5 ? trait2.dominant : trait2.recessive
  ];

  // Determine expression (dominant if at least one dominant allele)
  const expressed = alleles.includes(alleles[0]) && alleles[0] !== alleles[1]
    ? alleles[0] // Heterozygous - dominant expresses
    : alleles[0]; // Homozygous

  return {
    dominant: alleles[0],
    recessive: alleles[1],
    expressed
  };
}
```

## Seasonal Cycle

```typescript
function advanceSeason(): void {
  const seasons = ['spring', 'summer', 'fall', 'winter'];
  const currentIndex = seasons.indexOf(garden.season);
  const nextSeason = seasons[(currentIndex + 1) % 4];

  garden.season = nextSeason;
  garden.seasonStart = new Date();

  // Seasonal events
  switch (nextSeason) {
    case 'spring':
      recordMemory({
        type: 'milestone',
        description: 'Spring has arrived. New growth begins.'
      });
      // Accelerate growth
      garden.plants.forEach(p => p.seasonalModifier = 1.2);
      break;

    case 'summer':
      recordMemory({
        type: 'milestone',
        description: 'Summer blooms fill the garden.'
      });
      garden.plants.forEach(p => p.seasonalModifier = 1.0);
      break;

    case 'fall':
      recordMemory({
        type: 'milestone',
        description: 'Autumn colors paint the garden.'
      });
      garden.plants.forEach(p => p.seasonalModifier = 0.8);
      break;

    case 'winter':
      recordMemory({
        type: 'milestone',
        description: 'Winter rest. The garden dreams.'
      });
      garden.plants.forEach(p => p.seasonalModifier = 0.6);
      break;
  }
}

// Auto-advance seasons every 5 real-world days
setInterval(() => {
  const daysSinceSeasonStart = (Date.now() - garden.seasonStart.getTime()) / (24 * 60 * 60 * 1000);
  if (daysSinceSeasonStart >= 5) {
    advanceSeason();
  }
}, 60 * 60 * 1000); // Check every hour
```

## Achievement System

```typescript
const achievements = [
  {
    id: 'first-bloom',
    name: 'First Bloom',
    description: 'Witness your first flower bloom',
    condition: (garden) => garden.plants.some(p => p.growthStage === 'mature')
  },
  {
    id: 'geneticist',
    name: 'Geneticist',
    description: 'Successfully cross-breed two plants',
    condition: (garden) => garden.memories.some(m => m.type === 'cross-breed')
  },
  {
    id: 'full-cycle',
    name: 'Full Cycle',
    description: 'Experience all four seasons',
    condition: (garden) => garden.memories.filter(m => m.type === 'milestone').length >= 4
  },
  {
    id: 'rare-bloom',
    name: 'Rare Discovery',
    description: 'Discover a rare genetic variant',
    condition: (garden) => garden.plants.some(p => p.genetics.color.expressed === 'rainbow')
  },
  {
    id: 'garden-keeper',
    name: 'Garden Keeper',
    description: 'Maintain your garden for 30 days',
    condition: (garden) => {
      const daysSinceCreation = (Date.now() - garden.created.getTime()) / (24 * 60 * 60 * 1000);
      return daysSinceCreation >= 30;
    }
  }
];
```

## Implementation Plan

### Phase 1: Core MCP Server (Local)
1. Set up TypeScript MCP server project
2. Implement basic resources (Garden, Plant, Memory)
3. Create core tools (plant, water, get_status)
4. Add localStorage persistence
5. Implement growth algorithm
6. Test locally with Claude Desktop

### Phase 2: Genetics & Breeding
1. Implement genetic traits system
2. Add cross-breeding tool
3. Create Punnett square prediction
4. Add mutation system
5. Implement cultivar saving

### Phase 3: Seasonal System
1. Implement season tracking
2. Add seasonal modifiers to growth
3. Create seasonal events
4. Add seasonal prompts/memories

### Phase 4: AWS Integration
1. Create Lambda functions for AI features
2. Implement cloud sync
3. Add community cultivar sharing
4. Create AI garden assistant endpoints

### Phase 5: Three.js Integration
1. Connect MCP server to React app
2. Render 3D garden from MCP state
3. Add interactive plant placement
4. Implement visual growth animations
5. Create seasonal visual themes

## File Structure

```
eternal-garden-mcp/
├── src/
│   ├── index.ts              # MCP server entry
│   ├── resources/
│   │   ├── garden.ts         # Garden resource
│   │   ├── plant.ts          # Plant resource
│   │   └── memory.ts         # Memory resource
│   ├── tools/
│   │   ├── gardening.ts      # Plant, water, harvest tools
│   │   ├── genetics.ts       # Breeding, genetics tools
│   │   ├── time.ts           # Season, time advancement
│   │   └── ai.ts             # AI assistant tools
│   ├── prompts/
│   │   ├── curator.ts
│   │   ├── botanist.ts
│   │   ├── memory-keeper.ts
│   │   └── seasonal.ts
│   ├── algorithms/
│   │   ├── growth.ts         # Growth calculation
│   │   ├── genetics.ts       # Genetic inheritance
│   │   └── seasons.ts        # Seasonal cycles
│   └── storage/
│       ├── local.ts          # localStorage adapter
│       └── aws.ts            # AWS Lambda integration
├── lambda/                   # AWS Lambda functions
│   ├── sync-garden/
│   ├── generate-plant/
│   └── analyze-genetics/
├── package.json
├── tsconfig.json
└── README.md
```

## Next Steps

1. Initialize TypeScript project with MCP SDK
2. Implement core resources and basic tools
3. Create localStorage persistence layer
4. Build growth algorithm
5. Test with Claude Desktop
6. Integrate with React Three.js app
7. Deploy Lambda functions to AWS
8. Add community features

## Notes

- Keep it simple initially - localStorage only
- Growth should feel rewarding but not instant
- Genetics should be discoverable through experimentation
- Seasons create natural rhythm and anticipation
- Memories make the experience personal and meaningful
- AI assistant adds depth without overwhelming

#!/usr/bin/env node

/**
 * Eternal Garden MCP Server
 * Manages Mila's persistent garden with genetics, seasons, and memories
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  getGardenStatus,
  plantSeed,
  waterPlant,
  crossBreedPlants,
  getPlantDetails,
  fertilizePlant,
  getMemories,
  getSeeds,
  initializeGarden
} from './tools/garden-tools.js';

// Create MCP server
const server = new Server(
  {
    name: 'eternal-garden',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'initialize_garden',
        description: 'Initialize a new garden if one does not exist. Returns the garden state.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_garden_status',
        description: 'Get the current state of the garden including plants, season, skill level, and resources. This also advances time and updates all plants.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'plant_seed',
        description: 'Plant a seed at a specific position in the garden. Grants gardening experience.',
        inputSchema: {
          type: 'object',
          properties: {
            seedId: {
              type: 'string',
              description: 'ID of the seed to plant',
            },
            position: {
              type: 'object',
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' },
              },
              required: ['x', 'y', 'z'],
              description: 'Position in the garden',
            },
            name: {
              type: 'string',
              description: 'Optional custom name for the plant',
            },
          },
          required: ['seedId', 'position'],
        },
      },
      {
        name: 'water_plant',
        description: 'Water a plant to maintain its health and growth. Grants gardening experience.',
        inputSchema: {
          type: 'object',
          properties: {
            plantId: {
              type: 'string',
              description: 'ID of the plant to water',
            },
            amount: {
              type: 'number',
              description: 'Amount of water to add (default: 30)',
            },
          },
          required: ['plantId'],
        },
      },
      {
        name: 'cross_breed_plants',
        description: 'Cross-breed two mature plants to create a new seed with combined genetics. Grants significant gardening experience. Higher skill level increases chance of rare traits.',
        inputSchema: {
          type: 'object',
          properties: {
            parent1Id: {
              type: 'string',
              description: 'ID of the first parent plant (must be mature)',
            },
            parent2Id: {
              type: 'string',
              description: 'ID of the second parent plant (must be mature)',
            },
          },
          required: ['parent1Id', 'parent2Id'],
        },
      },
      {
        name: 'get_plant_details',
        description: 'Get detailed information about a specific plant including genetics, age, health, and water needs.',
        inputSchema: {
          type: 'object',
          properties: {
            plantId: {
              type: 'string',
              description: 'ID of the plant',
            },
          },
          required: ['plantId'],
        },
      },
      {
        name: 'fertilize_plant',
        description: 'Apply fertilizer to boost a plant\'s health. Requires fertilizer resource. Grants gardening experience.',
        inputSchema: {
          type: 'object',
          properties: {
            plantId: {
              type: 'string',
              description: 'ID of the plant to fertilize',
            },
          },
          required: ['plantId'],
        },
      },
      {
        name: 'get_memories',
        description: 'Get garden memories (special moments, plantings, blooms, discoveries). Memories are automatically created during significant events.',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Filter by memory type (planting, bloom, harvest, milestone, discovery, cross-breed, growth)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of memories to return',
            },
          },
        },
      },
      {
        name: 'get_seeds',
        description: 'Get all available seeds in the inventory.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'initialize_garden': {
        const garden = await initializeGarden();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(garden, null, 2),
            },
          ],
        };
      }

      case 'get_garden_status': {
        const status = await getGardenStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      }

      case 'plant_seed': {
        const result = await plantSeed(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'water_plant': {
        const result = await waterPlant(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'cross_breed_plants': {
        const result = await crossBreedPlants(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_plant_details': {
        const result = await getPlantDetails(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'fertilize_plant': {
        const result = await fertilizePlant(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_memories': {
        const memories = await getMemories(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(memories, null, 2),
            },
          ],
        };
      }

      case 'get_seeds': {
        const seeds = await getSeeds();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(seeds, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Eternal Garden MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

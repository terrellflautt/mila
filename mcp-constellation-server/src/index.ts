#!/usr/bin/env node
/**
 * Constellation MCP Server
 * Provides astronomical data, star catalogs, and rendering services
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  generateBackgroundStars,
  generateConstellationStars,
  getStarTwinkleParams,
  magnitudeToSize,
  magnitudeToBrightness
} from "./star-catalog.js";

import {
  ALL_CONSTELLATIONS,
  getConstellationById,
  getRandomConstellation,
  getConstellationBounds
} from "./constellation-geometry.js";

import {
  celestialToCartesian,
  cartesianToScreen,
  stereographicProjection,
  aitoffProjection,
  angularSeparation,
  calculateOptimalZoom
} from "./coordinate-transforms.js";

const server = new Server(
  {
    name: "constellation-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_background_stars",
        description: "Generate realistic background starfield with magnitude-based sizing and spectral colors",
        inputSchema: {
          type: "object",
          properties: {
            count: {
              type: "number",
              description: "Number of background stars to generate (default: 200)"
            },
            bounds: {
              type: "object",
              properties: {
                width: { type: "number" },
                height: { type: "number" },
                depth: { type: "number" }
              },
              required: ["width", "height", "depth"]
            }
          },
          required: ["bounds"]
        }
      },
      {
        name: "get_constellation",
        description: "Get a specific constellation definition by ID or a random one",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Constellation ID (heart, letterM, letterT, flamingo, theaterMasks, ballerina, infinity)"
            },
            excludeIds: {
              type: "array",
              items: { type: "string" },
              description: "IDs to exclude when selecting random constellation"
            }
          }
        }
      },
      {
        name: "generate_constellation_stars",
        description: "Generate star data for a specific constellation with realistic magnitudes and colors",
        inputSchema: {
          type: "object",
          properties: {
            constellationId: {
              type: "string",
              description: "Constellation ID"
            },
            baseMagnitude: {
              type: "number",
              description: "Base apparent magnitude (default: 2)"
            }
          },
          required: ["constellationId"]
        }
      },
      {
        name: "calculate_constellation_bounds",
        description: "Calculate bounding box and optimal zoom for a constellation",
        inputSchema: {
          type: "object",
          properties: {
            constellationId: {
              type: "string",
              description: "Constellation ID"
            },
            viewportWidth: {
              type: "number",
              description: "Viewport width in pixels"
            },
            viewportHeight: {
              type: "number",
              description: "Viewport height in pixels"
            }
          },
          required: ["constellationId"]
        }
      },
      {
        name: "apply_projection",
        description: "Apply astronomical projection to convert celestial coordinates to screen space",
        inputSchema: {
          type: "object",
          properties: {
            projection: {
              type: "string",
              enum: ["stereographic", "aitoff", "equirectangular"],
              description: "Projection type to apply"
            },
            coordinates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  rightAscension: { type: "number" },
                  declination: { type: "number" }
                }
              }
            },
            scale: {
              type: "number",
              description: "Projection scale factor"
            }
          },
          required: ["projection", "coordinates"]
        }
      },
      {
        name: "get_star_twinkle_params",
        description: "Get realistic animation parameters for star twinkling effects",
        inputSchema: {
          type: "object",
          properties: {
            magnitude: {
              type: "number",
              description: "Star magnitude (lower = brighter)"
            },
            brightness: {
              type: "number",
              description: "Star brightness (0-1)"
            }
          },
          required: ["magnitude", "brightness"]
        }
      },
      {
        name: "list_all_constellations",
        description: "Get list of all available constellation definitions with metadata",
        inputSchema: {
          type: "object",
          properties: {}
        }
      }
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [{ type: "text", text: JSON.stringify({ error: "Missing arguments" }) }]
    };
  }

  try {
    switch (name) {
      case "generate_background_stars": {
        const count = (args.count as number) || 200;
        const bounds = args.bounds as { width: number; height: number; depth: number };
        const stars = generateBackgroundStars(count, bounds);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stars, null, 2)
            }
          ]
        };
      }

      case "get_constellation": {
        const id = args.id as string | undefined;
        const excludeIds = (args.excludeIds as string[]) || [];

        const constellation = id
          ? getConstellationById(id)
          : getRandomConstellation(excludeIds);

        if (!constellation) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: "Constellation not found or all excluded" })
              }
            ]
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(constellation, null, 2)
            }
          ]
        };
      }

      case "generate_constellation_stars": {
        const constellationId = args.constellationId as string;
        const baseMagnitude = (args.baseMagnitude as number) || 2;

        const constellation = getConstellationById(constellationId);
        if (!constellation) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: "Constellation not found" })
              }
            ]
          };
        }

        const stars = generateConstellationStars(
          constellationId,
          constellation.positions,
          baseMagnitude
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(stars, null, 2)
            }
          ]
        };
      }

      case "calculate_constellation_bounds": {
        const constellationId = args.constellationId as string;
        const viewportWidth = args.viewportWidth as number | undefined;
        const viewportHeight = args.viewportHeight as number | undefined;

        const constellation = getConstellationById(constellationId);
        if (!constellation) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: "Constellation not found" })
              }
            ]
          };
        }

        const bounds = getConstellationBounds(constellation);

        const result: any = { ...bounds };

        if (viewportWidth && viewportHeight) {
          result.optimalZoom = calculateOptimalZoom(
            { width: bounds.width, height: bounds.height },
            { width: viewportWidth, height: viewportHeight }
          );
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case "apply_projection": {
        const projection = args.projection as string;
        const coordinates = args.coordinates as Array<{ rightAscension: number; declination: number }>;
        const scale = (args.scale as number) || 10;

        let projected;
        switch (projection) {
          case "stereographic":
            projected = coordinates.map(coord =>
              stereographicProjection(coord, 0, 90, scale)
            );
            break;
          case "aitoff":
            projected = coordinates.map(coord =>
              aitoffProjection(coord, scale)
            );
            break;
          case "equirectangular":
          default:
            projected = coordinates.map(coord => {
              const cartesian = celestialToCartesian(coord, scale);
              return { x: cartesian.x, y: cartesian.y };
            });
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(projected, null, 2)
            }
          ]
        };
      }

      case "get_star_twinkle_params": {
        const magnitude = args.magnitude as number;
        const brightness = args.brightness as number;

        const star = {
          id: "temp",
          x: 0,
          y: 0,
          z: 0,
          magnitude,
          spectralType: "G",
          color: "#FFF4EA",
          size: magnitudeToSize(magnitude),
          brightness
        };

        const params = getStarTwinkleParams(star);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(params, null, 2)
            }
          ]
        };
      }

      case "list_all_constellations": {
        const summary = ALL_CONSTELLATIONS.map(c => ({
          id: c.id,
          name: c.name,
          symbol: c.symbol,
          theme: c.theme,
          starCount: c.positions.length,
          connectionCount: c.connections.length
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2)
            }
          ]
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `Unknown tool: ${name}` })
            }
          ]
        };
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: error.message })
        }
      ]
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Constellation MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

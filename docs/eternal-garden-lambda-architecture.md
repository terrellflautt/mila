# Eternal Garden - AWS Lambda Architecture

## Overview
Use AWS Lambda functions + API Gateway to create enhanced garden features that go beyond local capabilities.

## Lambda Functions Design

### 1. **AI Plant Generator** 🌱
**Endpoint:** `POST /api/garden/generate-plant`

**Purpose:** Use AI to create unique, poetic plant descriptions and genetics based on context.

**Input:**
```json
{
  "context": "It's Mila's birthday",
  "mood": "joyful",
  "season": "spring",
  "existingPlants": ["rose", "lily"],
  "preferences": {
    "colors": ["pink", "purple"],
    "style": "elegant"
  }
}
```

**Output:**
```json
{
  "plantId": "unique-id",
  "name": "Birthday Starbloom",
  "species": "Stellaria mirabilis",
  "description": "Blooms only on special days. Each petal holds a wish.",
  "genetics": {
    "color": { "dominant": "pink", "recessive": "white", "expressed": "pink" },
    "bloomSize": { "dominant": "large", "recessive": "medium", "expressed": "large" },
    "height": { "dominant": "tall", "recessive": "medium", "expressed": "tall" },
    "bloomPattern": { "dominant": "star", "recessive": "cup", "expressed": "star" },
    "fragrance": { "dominant": "sweet", "recessive": "subtle", "expressed": "sweet" }
  },
  "rarity": "legendary",
  "story": "This flower was born from starlight on the day you were born.",
  "visualTraits": {
    "petalCount": 5,
    "stemTexture": "smooth",
    "leafShape": "heart"
  }
}
```

**AI Integration:**
- Claude API to generate poetic descriptions
- Context-aware naming
- Unique stories for each plant
- Genetics that match the mood/season

**Use Cases:**
- Special occasion plants (birthday, anniversary, milestones)
- Seasonal discoveries
- Reward for achievements
- Random magical moments

---

### 2. **Genetic Analysis & Breeding Predictor** 🧬
**Endpoint:** `POST /api/garden/analyze-genetics`

**Purpose:** Complex genetic calculations and breeding predictions with AI explanations.

**Input:**
```json
{
  "parent1": {
    "id": "plant-123",
    "genetics": { /* full genetic data */ }
  },
  "parent2": {
    "id": "plant-456",
    "genetics": { /* full genetic data */ }
  },
  "analysisType": "prediction" // or "history", "traits"
}
```

**Output:**
```json
{
  "prediction": {
    "possibleOutcomes": [
      {
        "probability": 0.25,
        "traits": {
          "color": "pink",
          "bloomSize": "large",
          "height": "tall"
        },
        "visualization": "base64-punnett-square-image",
        "description": "Elegant pink bloom, reaches for the sky"
      },
      {
        "probability": 0.25,
        "traits": {
          "color": "white",
          "bloomSize": "large",
          "height": "tall"
        },
        "description": "Pure white bloom, graceful and tall"
      }
      // ... other 25% outcomes
    ],
    "mostLikely": {
      "traits": { /* dominant traits */ },
      "description": "Most likely to inherit the pink color and tall stature"
    },
    "rare Possibilities": [
      {
        "probability": 0.05,
        "traits": { /* mutation */ },
        "description": "Rare rainbow mutation - one in twenty chance"
      }
    ]
  },
  "punnettSquare": {
    "color": {
      "parent1Alleles": ["P", "p"],
      "parent2Alleles": ["P", "w"],
      "outcomes": [
        ["PP", "Pw"],
        ["pP", "pw"]
      ]
    }
  },
  "aiInsight": "These parent plants both carry strong pink genes. Their offspring will likely continue the vibrant color lineage with a small chance of pure white blooms."
}
```

**AI Integration:**
- Generate human-readable genetic explanations
- Create poetic descriptions of trait combinations
- Suggest breeding strategies
- Explain Mendelian inheritance in accessible language

---

### 3. **Garden Memory Generator** 📖
**Endpoint:** `POST /api/garden/create-memory`

**Purpose:** Transform garden events into beautiful, meaningful memories using AI.

**Input:**
```json
{
  "event": {
    "type": "first-bloom",
    "plantId": "plant-123",
    "plantName": "Morning Star Rose",
    "timestamp": "2025-10-31T14:30:00Z",
    "season": "spring",
    "weather": "sunny",
    "gardenAge": 30 // days
  },
  "context": {
    "recentEvents": ["planted 3 seeds", "watered daily"],
    "userMood": "peaceful",
    "timeOfDay": "morning"
  }
}
```

**Output:**
```json
{
  "memoryId": "memory-789",
  "title": "First Light",
  "date": "October 31, 2025",
  "story": "On a spring morning, your Morning Star Rose opened its first petal. Thirty days of care rewarded with a single, perfect bloom.",
  "poeticForm": "The star bloomed at dawn.\nThirty mornings of waiting,\none moment of beauty.",
  "significance": "milestone",
  "emotion": "joy",
  "preservationPrompt": "This moment marks the beginning of something beautiful.",
  "visualMetadata": {
    "suggestedColor": "#FFB6C1",
    "mood": "serene",
    "timeOfDay": "dawn"
  }
}
```

**AI Integration:**
- Transform technical events into stories
- Create haiku/poetry for special moments
- Capture emotional significance
- Generate shareable memory cards

---

### 4. **Seasonal Content Generator** 🍂
**Endpoint:** `POST /api/garden/seasonal-content`

**Purpose:** Generate season-specific plants, events, and activities.

**Input:**
```json
{
  "season": "fall",
  "gardenState": {
    "plantCount": 15,
    "discoveries": ["rare-bloom"],
    "achievements": ["geneticist"],
    "daysSinceLastSeasonChange": 3
  },
  "userPreferences": {
    "favoriteColors": ["orange", "red"],
    "activityLevel": "moderate"
  }
}
```

**Output:**
```json
{
  "seasonalPlants": [
    {
      "name": "Autumn Ember",
      "description": "Blooms only in fall, leaves turn gold",
      "rarity": "seasonal",
      "unlockCondition": "Available during fall season"
    },
    {
      "name": "Harvest Moon Lily",
      "description": "Opens at dusk, glows faintly",
      "rarity": "rare-seasonal"
    }
  ],
  "seasonalEvents": [
    {
      "name": "Leaf Dance",
      "description": "Watch leaves fall in gentle patterns",
      "trigger": "Visit garden during sunset",
      "reward": "Autumn Memories achievement"
    }
  ],
  "seasonalMessage": "Fall paints the garden in warm colors. Each leaf that falls is a memory preserved.",
  "activities": [
    {
      "suggestion": "Plant Autumn Ember near existing flowers",
      "reason": "It will create a beautiful color gradient"
    },
    {
      "suggestion": "Cross-breed summer blooms with fall plants",
      "reason": "Might discover a rare hybrid that blooms year-round"
    }
  ]
}
```

**AI Integration:**
- Generate season-appropriate content
- Create themed events and activities
- Suggest planting strategies
- Write seasonal poetry/messages

---

### 5. **Community Garden Exchange** 🌍
**Endpoint:** `POST /api/garden/share-cultivar`
**Endpoint:** `GET /api/garden/global-cultivars`

**Purpose:** Share unique plant genetics with community, discover others' creations.

**Share Cultivar:**
```json
{
  "plantId": "plant-123",
  "cultivarName": "Tyler's Starlight",
  "description": "A pink bloom that glows at night",
  "genetics": { /* full genetic data */ },
  "creatorId": "user-tyler",
  "shareSettings": {
    "public": true,
    "allowDerivatives": true
  }
}
```

**Discover Global Cultivars:**
```json
{
  "filters": {
    "color": "pink",
    "rarity": "legendary",
    "season": "spring"
  },
  "sort": "mostLiked" // or "newest", "rarest"
}
```

**Response:**
```json
{
  "cultivars": [
    {
      "id": "cultivar-456",
      "name": "Tyler's Starlight",
      "creator": "tyler",
      "description": "A pink bloom that glows at night",
      "likes": 1247,
      "downloads": 3891,
      "genetics": { /* genetics for breeding */ },
      "preview": "base64-image",
      "story": "Created after 50 days of careful cross-breeding"
    }
  ],
  "total": 15789,
  "page": 1
}
```

**Features:**
- Like/favorite cultivars
- Download genetics to cross-breed locally
- Track lineage (which cultivars created which)
- Seasonal featured cultivars
- Rarity rankings

---

### 6. **Garden Health Monitor** 🏥
**Endpoint:** `POST /api/garden/diagnose`

**Purpose:** AI diagnosis of garden health with care recommendations.

**Input:**
```json
{
  "garden": {
    "plants": [
      {
        "id": "plant-123",
        "species": "rose",
        "health": 65,
        "waterLevel": 30,
        "lastWatered": "2 days ago",
        "growthStage": "medium",
        "age": 10
      }
    ],
    "season": "summer",
    "lastCareAction": "watered-plant-456",
    "timeInGarden": "5 minutes daily"
  }
}
```

**Output:**
```json
{
  "overallHealth": "good",
  "alerts": [
    {
      "severity": "warning",
      "plantId": "plant-123",
      "plantName": "Morning Rose",
      "issue": "Low water",
      "recommendation": "Water within next 24 hours",
      "impact": "Growth will slow if not watered"
    }
  ],
  "insights": [
    {
      "type": "seasonal",
      "message": "Summer heat increases water needs. Consider watering 20% more often."
    },
    {
      "type": "growth",
      "message": "3 plants will reach maturity in next 2 days. Prepare for blooming!"
    }
  ],
  "careScore": {
    "current": 85,
    "trend": "improving",
    "comparedTo": "Last week: +10 points"
  },
  "recommendations": [
    {
      "priority": "high",
      "action": "Water plant-123 and plant-456",
      "timing": "within 24 hours",
      "reason": "Prevent growth slowdown"
    },
    {
      "priority": "medium",
      "action": "Fertilize plant-789",
      "timing": "this week",
      "reason": "Boost final growth stage"
    }
  ],
  "encouragement": "Your garden is thriving! Regular care is showing beautiful results."
}
```

**AI Integration:**
- Analyze patterns in care habits
- Predict plant needs
- Personalized recommendations
- Encouraging feedback

---

### 7. **Time Capsule** 🎁
**Endpoint:** `POST /api/garden/create-capsule`
**Endpoint:** `GET /api/garden/open-capsule/{id}`

**Purpose:** Create time-locked messages and rewards in the garden.

**Create Capsule:**
```json
{
  "message": "Happy 1-year anniversary with the garden!",
  "unlockDate": "2026-10-31T00:00:00Z",
  "rewards": {
    "plants": ["rare-anniversary-bloom"],
    "achievements": ["time-keeper"],
    "memories": ["first-year-reflection"]
  },
  "from": "Tyler",
  "to": "Mila",
  "context": {
    "gardenAge": 365,
    "plantsGrown": 127,
    "rarePlantsDiscovered": 5
  }
}
```

**Open Capsule (when unlocked):**
```json
{
  "id": "capsule-123",
  "message": "Happy 1-year anniversary with the garden!",
  "from": "Tyler",
  "to": "Mila",
  "createdDate": "2025-10-31",
  "openedDate": "2026-10-31",
  "rewards": {
    "plants": [
      {
        "name": "Anniversary Star Rose",
        "description": "A rare bloom that appears only once a year",
        "genetics": { /* special genetics */ }
      }
    ],
    "achievements": ["Time Keeper - Maintained garden for 1 year"],
    "memories": [
      {
        "title": "One Year of Growth",
        "story": "365 days. 127 plants. 5 rare discoveries. Your garden tells the story of patience rewarded."
      }
    ]
  },
  "stats": {
    "whenCreated": {
      "gardenAge": 0,
      "plantsGrown": 0
    },
    "now": {
      "gardenAge": 365,
      "plantsGrown": 127
    },
    "growth": "Infinite"
  }
}
```

**Features:**
- Time-locked rewards
- Progress comparison
- Personalized messages
- Automatic capsules for milestones
- Custom capsules from user

---

### 8. **AI Garden Designer** 🎨
**Endpoint:** `POST /api/garden/design-layout`

**Purpose:** AI-generated garden layouts based on preferences and aesthetics.

**Input:**
```json
{
  "preferences": {
    "style": "romantic", // or "zen", "wild", "symmetrical"
    "colorPalette": ["pink", "white", "purple"],
    "density": "moderate",
    "focusPoints": ["center", "corners"]
  },
  "constraints": {
    "existingPlants": [
      { "id": "plant-123", "position": { "x": 5, "y": 5 } }
    ],
    "gardenSize": { "width": 20, "height": 20 }
  },
  "season": "spring"
}
```

**Output:**
```json
{
  "layout": {
    "name": "Spring Romance",
    "description": "A gentle garden with flowing pink and purple paths",
    "plantingPlan": [
      {
        "position": { "x": 10, "y": 10 },
        "plant": "Pink Heart Rose",
        "reason": "Center focal point, draws the eye"
      },
      {
        "position": { "x": 8, "y": 12 },
        "plant": "White Star Lily",
        "reason": "Complements pink rose, creates balance"
      }
      // ... more positions
    ],
    "pathways": [
      { "from": { "x": 0, "y": 0 }, "to": { "x": 10, "y": 10 }, "style": "curved" }
    ],
    "visualPreview": "base64-layout-image",
    "seasonalNotes": "In spring, pink blooms will appear first, followed by purple in late season"
  },
  "alternatives": [
    {
      "name": "Zen Symmetry",
      "description": "Peaceful, balanced arrangement",
      "preview": "base64-image"
    }
  ],
  "explanation": "This layout creates a romantic atmosphere with a central focal point. Pink and purple blooms will create natural color gradients as the season progresses."
}
```

**AI Integration:**
- Generate aesthetically pleasing layouts
- Consider color theory
- Seasonal bloom timing
- Growth height variations
- Create 3D preview renders

---

## API Gateway Configuration

### Authentication
```yaml
Auth:
  Type: AWS_IAM # For MCP server
  Secondary: API_KEY # For web app (optional)
```

### Rate Limiting
```yaml
RateLimits:
  GeneratePlant: 10/hour # Prevent spam
  AnalyzeGenetics: 20/hour
  CreateMemory: 50/hour
  SeasonalContent: 100/hour # Higher for frequent checks
  ShareCultivar: 5/hour # Prevent spam
  GlobalCultivars: 100/hour # Read-heavy
  DiagnoseGarden: 20/hour
  CreateCapsule: 5/hour
  DesignLayout: 10/hour
```

### CORS Configuration
```yaml
CORS:
  AllowOrigins:
    - https://mila.terrellflautt.com
    - http://localhost:5173 # Dev
  AllowMethods:
    - GET
    - POST
  AllowHeaders:
    - Content-Type
    - Authorization
```

---

## DynamoDB Tables

### 1. **Gardens Table**
```yaml
TableName: eternal-gardens
PartitionKey: userId (String)
SortKey: gardenId (String)
Attributes:
  - userId
  - gardenId
  - created
  - season
  - seasonStart
  - plants (List)
  - resources (Map)
  - achievements (List)
  - memories (List)
TTL: none # Permanent storage
```

### 2. **Cultivars Table**
```yaml
TableName: global-cultivars
PartitionKey: cultivarId (String)
GlobalSecondaryIndexes:
  - IndexName: ByCreator
    PartitionKey: creatorId
  - IndexName: ByRarity
    PartitionKey: rarity
  - IndexName: ByLikes
    PartitionKey: dummy (for sorting)
    SortKey: likeCount (Number)
Attributes:
  - cultivarId
  - name
  - description
  - genetics (Map)
  - creatorId
  - created
  - likes (Number)
  - downloads (Number)
  - rarity
  - season
  - tags (List)
```

### 3. **Memories Table**
```yaml
TableName: garden-memories
PartitionKey: userId (String)
SortKey: memoryId (String)
Attributes:
  - userId
  - memoryId
  - gardenId
  - created
  - type
  - title
  - story
  - metadata (Map)
  - plantId (optional)
```

### 4. **Time Capsules Table**
```yaml
TableName: time-capsules
PartitionKey: userId (String)
SortKey: capsuleId (String)
GlobalSecondaryIndexes:
  - IndexName: ByUnlockDate
    PartitionKey: userId
    SortKey: unlockDate (String)
Attributes:
  - userId
  - capsuleId
  - created
  - unlockDate
  - opened (Boolean)
  - message
  - rewards (Map)
  - from
  - to
  - context (Map)
```

---

## Lambda Implementation Example

### AI Plant Generator (TypeScript)

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const { context, mood, season, existingPlants, preferences } = JSON.parse(event.body || '{}');

    // Build AI prompt
    const prompt = `Create a unique, poetic garden plant for this context:

Context: ${context}
Mood: ${mood}
Season: ${season}
Existing Plants: ${existingPlants.join(', ')}
Preferred Colors: ${preferences.colors.join(', ')}
Style: ${preferences.style}

Generate a JSON object with:
- name: Unique plant name (poetic, meaningful)
- species: Scientific-sounding name
- description: One sentence, simple and beautiful
- story: 2-3 sentences about why this plant is special
- genetics: {
    color: { dominant, recessive, expressed },
    bloomSize: { dominant, recessive, expressed },
    height: { dominant, recessive, expressed },
    bloomPattern: { dominant, recessive, expressed },
    fragrance: { dominant, recessive, expressed }
  }
- rarity: "common" | "uncommon" | "rare" | "legendary"

Make it genuine, not corny. Less is more.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const plantData = JSON.parse(message.content[0].text);

    // Add unique ID and timestamp
    const plant = {
      ...plantData,
      plantId: `plant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created: new Date().toISOString(),
      visualTraits: {
        petalCount: plantData.genetics.bloomPattern.expressed === 'star' ? 5 : 6,
        stemTexture: 'smooth',
        leafShape: 'heart'
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(plant)
    };

  } catch (error) {
    console.error('Error generating plant:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate plant' })
    };
  }
}
```

---

## Cost Estimation

### Per Month (Assuming 100 active users)

**API Gateway:**
- Requests: ~50,000/month
- Cost: ~$0.18

**Lambda:**
- Invocations: ~50,000/month
- Duration: avg 500ms
- Memory: 512MB
- Cost: ~$0.84

**DynamoDB:**
- Read/Write: ~100,000 operations
- Storage: ~1GB
- Cost: ~$1.25

**Claude API:**
- Tokens: ~5M tokens/month
- Cost: ~$15.00 (3.5 Sonnet)

**Total: ~$17.27/month**

For Mila only (1 user):
- Cost: ~$0.20/month

---

## Implementation Priority

1. **Phase 1 (MVP):**
   - AI Plant Generator
   - Garden Health Monitor
   - Basic DynamoDB setup

2. **Phase 2 (Enhanced):**
   - Genetic Analysis
   - Memory Generator
   - Seasonal Content

3. **Phase 3 (Community):**
   - Cultivar Sharing
   - Global Cultivars Discovery

4. **Phase 4 (Advanced):**
   - Time Capsules
   - AI Garden Designer

---

## Integration with MCP Server

The MCP server calls these Lambda functions when:
1. User requests AI-generated plant
2. Complex genetic calculations needed
3. Creating special memories
4. Accessing community features
5. Advanced diagnostics

**Flow:**
```
MCP Server → API Gateway → Lambda → Claude API (if needed) → DynamoDB → Response
```

**Example MCP Tool:**
```typescript
async function suggest_planting() {
  const response = await fetch('https://api.mila.terrellflautt.com/garden/design-layout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AWS_ACCESS_KEY}`
    },
    body: JSON.stringify({
      preferences: garden.preferences,
      constraints: garden.layout,
      season: garden.season
    })
  });

  return await response.json();
}
```

---

## Security

1. **API Gateway:** AWS IAM authentication
2. **Lambda:** VPC isolation if needed
3. **DynamoDB:** Encryption at rest
4. **Secrets:** AWS Secrets Manager for API keys
5. **Rate Limiting:** Prevent abuse
6. **CORS:** Whitelist only mila.terrellflautt.com

---

## Monitoring

**CloudWatch Metrics:**
- Lambda invocation count
- API Gateway latency
- DynamoDB throttling
- Error rates
- Claude API usage

**Alarms:**
- Lambda errors > 5%
- API latency > 2s
- DynamoDB throttling
- High API costs

---

## Next Steps

1. ✅ Design Lambda architecture
2. Set up AWS account/resources
3. Implement AI Plant Generator (Phase 1)
4. Test locally
5. Deploy to AWS
6. Integrate with MCP server
7. Test end-to-end
8. Add remaining functions progressively

This architecture makes the garden:
- **Intelligent** - AI-powered features
- **Personal** - Unique to each user
- **Social** - Community sharing (optional)
- **Magical** - Unexpected delights
- **Meaningful** - Memories preserved

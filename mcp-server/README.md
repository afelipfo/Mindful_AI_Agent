# Mindful AI MCP Server

A Model Context Protocol (MCP) server providing specialized mental health and wellness tools for AI agents.

## Features

### Tools

1. **analyze_mood** - Mood Analysis Tool
   - Analyzes text to detect mood, emotions, and triggers
   - Returns confidence scores and severity levels
   - Provides personalized recommendations

2. **generate_wellness_recommendations** - Wellness Recommendations
   - Generates immediate, short-term, and long-term wellness practices
   - Personalized based on mood, energy, and preferences
   - Includes detailed instructions and benefits

3. **generate_user_insights** - Historical Analysis
   - Identifies patterns and trends in mood history
   - Detects temporal, trigger, and behavioral patterns
   - Provides data-driven insights and recommendations

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Usage

### As a standalone MCP server

```bash
npm start
```

### Integration with Claude Desktop

Add to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "mindful-ai": {
      "command": "node",
      "args": [
        "/absolute/path/to/Mindful_AI_Agent/mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Development

```bash
npm run dev
```

## Tool Examples

### Analyze Mood

```typescript
{
  "text": "I've been feeling really overwhelmed with work lately. Can't seem to catch a break.",
  "moodScore": 4,
  "energyLevel": 3
}
```

Response:
```json
{
  "detectedMood": "stressed",
  "confidence": 85,
  "emotions": ["overwhelmed", "stressed"],
  "triggers": ["work"],
  "severity": "moderate",
  "analysis": "Based on your input, I'm detecting a stressed emotional state with a mood score of 4/10...",
  "recommendations": [
    "Take a 5-minute break from current tasks",
    "Practice progressive muscle relaxation",
    "Set clear boundaries between work and personal time"
  ]
}
```

### Generate Wellness Recommendations

```typescript
{
  "mood": "anxious",
  "moodScore": 5,
  "energyLevel": 6,
  "preferences": {
    "timeAvailable": 15,
    "activityLevel": "moderate",
    "environment": "home"
  }
}
```

Response:
```json
{
  "immediate": [
    {
      "type": "breathing",
      "title": "Box Breathing Technique",
      "description": "A quick breathing exercise to calm your nervous system",
      "duration": 3,
      "difficulty": "easy",
      "benefits": ["Reduces anxiety", "Lowers heart rate", "Clears mind"],
      "instructions": [
        "Inhale through your nose for 4 counts",
        "Hold your breath for 4 counts",
        "Exhale through your mouth for 4 counts",
        "Hold empty lungs for 4 counts",
        "Repeat 4 times"
      ]
    }
  ],
  "shortTerm": [...],
  "longTerm": [...]
}
```

### Generate User Insights

```typescript
{
  "userId": "user123",
  "moodHistory": [
    {
      "date": "2025-01-15",
      "mood": "stressed",
      "moodScore": 4,
      "energyLevel": 5,
      "triggers": ["work", "sleep"]
    },
    // ... more entries
  ],
  "timeframe": "week"
}
```

Response:
```json
{
  "summary": {
    "averageMood": 5.2,
    "averageEnergy": 5.8,
    "mostCommonMood": "stressed",
    "moodStability": 65,
    "improvementTrend": "stable"
  },
  "patterns": [
    {
      "type": "temporal",
      "description": "Your mood tends to be lower on Mon, Wed",
      "frequency": 28.5,
      "confidence": 75,
      "recommendation": "Plan self-care activities on Mon, Wed"
    }
  ],
  "triggers": [
    {
      "trigger": "work",
      "frequency": 45.2,
      "impact": "negative"
    }
  ],
  "recommendations": [...],
  "insights": [...]
}
```

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts              # Main server entry point
│   └── tools/
│       ├── mood-analysis.ts          # Mood detection and analysis
│       ├── wellness-recommendations.ts # Personalized wellness suggestions
│       └── user-insights.ts          # Historical pattern analysis
├── package.json
├── tsconfig.json
└── README.md
```

## Integration with Next.js Application

The MCP server can be called from the Next.js application through API routes or directly if running in the same environment. Example integration in an API route:

```typescript
// app/api/mcp/mood-analysis/route.ts
export async function POST(request: Request) {
  const body = await request.json();

  // Call MCP tool (implementation depends on your setup)
  const result = await callMCPTool('analyze_mood', body);

  return Response.json(result);
}
```

## Requirements

- Node.js >= 18.0.0
- TypeScript 5.x
- @modelcontextprotocol/sdk ^0.5.0

## License

MIT

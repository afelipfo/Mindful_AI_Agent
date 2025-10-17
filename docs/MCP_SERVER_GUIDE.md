# Mindful AI MCP Server Integration Guide

## Overview

The Mindful AI MCP (Model Context Protocol) Server provides specialized mental health and wellness tools that can be used by AI agents like Claude. This guide explains how to set up, configure, and use the MCP server with your Mindful AI application.

## Architecture

```
┌─────────────────────────────────────────┐
│         Claude Desktop / AI Agent       │
│                                         │
│  Uses MCP tools via stdio transport    │
└────────────────┬────────────────────────┘
                 │
                 │ MCP Protocol
                 │
┌────────────────▼────────────────────────┐
│      Mindful AI MCP Server              │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Tool: analyze_mood              │  │
│  │  - Detects emotional state       │  │
│  │  - Identifies triggers           │  │
│  │  - Assesses severity             │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Tool: generate_wellness_recs    │  │
│  │  - Immediate actions             │  │
│  │  - Short-term practices          │  │
│  │  - Long-term strategies          │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Tool: generate_user_insights    │  │
│  │  - Pattern detection             │  │
│  │  - Trend analysis                │  │
│  │  - Personalized recommendations  │  │
│  └──────────────────────────────────┘  │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Next.js Application                │
│                                         │
│  API Routes (REST Interface):           │
│  - POST /api/mcp/mood-analysis          │
│  - POST /api/mcp/wellness-recommendations│
│  - GET/POST /api/mcp/user-insights      │
│                                         │
│  Direct Function Imports (SSR):         │
│  - analyzeMood()                        │
│  - generateWellnessRecommendations()    │
│  - generateUserInsights()               │
└─────────────────────────────────────────┘
```

## Installation

### 1. Install Dependencies

```bash
cd mcp-server
npm install
npm run build
```

### 2. Configure Claude Desktop

Run the automated setup script:

```bash
./mcp-server/scripts/setup-claude-desktop.sh
```

Or manually edit your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the following configuration:

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

### 3. Restart Claude Desktop

After updating the configuration, restart Claude Desktop for the changes to take effect.

## Usage

### Using Tools in Claude Desktop

Once configured, you can use the MCP tools in your conversations with Claude:

**Example 1: Mood Analysis**
```
User: "Use the analyze_mood tool to analyze this: I've been feeling really
stressed about work deadlines. Can't sleep well and feel constantly on edge."

Claude: [Uses analyze_mood tool]

Based on the analysis:
- Detected Mood: Stressed (85% confidence)
- Severity: Moderate
- Triggers: Work, Sleep
- Emotions: Stressed, overwhelmed

Recommendations:
1. Take a 5-minute break from current tasks
2. Practice progressive muscle relaxation
3. Set clear boundaries between work and personal time
```

**Example 2: Wellness Recommendations**
```
User: "Generate wellness recommendations for someone feeling anxious with
energy level 6, who has 20 minutes available at home"

Claude: [Uses generate_wellness_recommendations tool]

Here are personalized recommendations:

Immediate (0-5 min):
- Box Breathing Technique (3 min)
- 5-4-3-2-1 Grounding Exercise (5 min)

Short-term (5-30 min):
- Guided Body Scan Meditation (15 min)
- Gentle Walk (20 min)

Long-term:
- Daily Mindfulness Practice (10 min/day)
- Regular Exercise Routine (30 min, 3-4x/week)
```

**Example 3: User Insights**
```
User: "Analyze my mood patterns and give me insights"

Claude: [Uses generate_user_insights tool with your historical data]

Based on your mood history:

Summary:
- Average Mood: 5.8/10
- Average Energy: 6.2/10
- Most Common Mood: Stressed
- Trend: Improving

Key Patterns:
- Your mood tends to be lower on Mondays and Wednesdays
- "Work" appears as your most frequent trigger (45% of entries)
- Your mood closely tracks your energy levels (75% correlation)

Recommendations:
1. Plan self-care activities on Mondays and Wednesdays
2. Develop coping strategies for work-related stress
3. Focus on energy management through exercise and sleep
```

### Using API Routes in Your Application

The MCP tools are also exposed via REST API routes for use in your Next.js application:

#### 1. Mood Analysis API

```typescript
// Frontend component
async function analyzeMoodFromText(text: string) {
  const response = await fetch('/api/mcp/mood-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: text,
      moodScore: 5,
      energyLevel: 6
    })
  });

  const result = await response.json();
  console.log(result.data);
  // {
  //   detectedMood: "stressed",
  //   confidence: 85,
  //   emotions: ["stressed", "overwhelmed"],
  //   triggers: ["work"],
  //   severity: "moderate",
  //   analysis: "...",
  //   recommendations: [...]
  // }
}
```

#### 2. Wellness Recommendations API

```typescript
async function getWellnessRecommendations() {
  const response = await fetch('/api/mcp/wellness-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mood: "anxious",
      moodScore: 5,
      energyLevel: 6,
      preferences: {
        timeAvailable: 20,
        activityLevel: "moderate",
        environment: "home"
      }
    })
  });

  const result = await response.json();
  console.log(result.data);
  // {
  //   immediate: [...],
  //   shortTerm: [...],
  //   longTerm: [...]
  // }
}
```

#### 3. User Insights API

```typescript
// GET request - automatically analyzes current user's data
async function getUserInsights() {
  const response = await fetch('/api/mcp/user-insights');
  const result = await response.json();
  console.log(result.data);
  // {
  //   summary: { averageMood: 5.8, ... },
  //   patterns: [...],
  //   triggers: [...],
  //   recommendations: [...],
  //   insights: [...]
  // }
}

// POST request - analyze custom mood history
async function analyzeCustomHistory(moodHistory) {
  const response = await fetch('/api/mcp/user-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moodHistory })
  });

  const result = await response.json();
  console.log(result.data);
}
```

## Tool Specifications

### 1. analyze_mood

**Purpose**: Detect mood, emotions, and triggers from text

**Input**:
```typescript
{
  text: string;                    // Required
  emotions?: string[];             // Optional
  moodScore?: number;              // Optional, 1-10
  energyLevel?: number;            // Optional, 1-10
  context?: string;                // Optional
}
```

**Output**:
```typescript
{
  detectedMood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
  confidence: number;              // 0-100
  emotions: string[];
  triggers: string[];
  severity: "low" | "moderate" | "high";
  analysis: string;
  recommendations: string[];
}
```

### 2. generate_wellness_recommendations

**Purpose**: Generate personalized wellness practices

**Input**:
```typescript
{
  mood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
  moodScore: number;               // 1-10, required
  energyLevel: number;             // 1-10, required
  triggers?: string[];
  preferences?: {
    activityLevel?: "low" | "moderate" | "high";
    timeAvailable?: number;        // Minutes
    environment?: "home" | "work" | "outdoor" | "any";
  };
}
```

**Output**:
```typescript
{
  immediate: WellnessRecommendation[];     // 0-5 min activities
  shortTerm: WellnessRecommendation[];     // 5-30 min activities
  longTerm: WellnessRecommendation[];      // Ongoing practices
}

// WellnessRecommendation structure:
{
  type: "breathing" | "meditation" | "exercise" | "social" | "creative" | "rest" | "nutrition" | "grounding";
  title: string;
  description: string;
  duration: number;                // Minutes
  difficulty: "easy" | "moderate" | "challenging";
  benefits: string[];
  instructions: string[];
}
```

### 3. generate_user_insights

**Purpose**: Analyze mood history for patterns and trends

**Input**:
```typescript
{
  userId: string;
  moodHistory: Array<{
    date: string;                  // ISO date
    mood: "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited";
    moodScore: number;             // 1-10
    energyLevel: number;           // 1-10
    triggers?: string[];
    emotions?: string[];
  }>;
  timeframe?: "week" | "month" | "quarter" | "year";
}
```

**Output**:
```typescript
{
  summary: {
    averageMood: number;
    averageEnergy: number;
    mostCommonMood: string;
    moodStability: number;         // 0-100
    improvementTrend: "improving" | "declining" | "stable";
  };
  patterns: Pattern[];
  triggers: Array<{
    trigger: string;
    frequency: number;
    impact: "positive" | "negative" | "neutral";
  }>;
  recommendations: string[];
  insights: string[];
}
```

## Testing

### Test MCP Server Directly

```bash
cd mcp-server
npm run dev
```

Then send test input via stdin:
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

### Test API Routes

```bash
# Test mood analysis
curl -X POST http://localhost:3000/api/mcp/mood-analysis \
  -H "Content-Type: application/json" \
  -d '{"text":"I feel overwhelmed with work","moodScore":4,"energyLevel":3}'

# Test wellness recommendations
curl -X POST http://localhost:3000/api/mcp/wellness-recommendations \
  -H "Content-Type: application/json" \
  -d '{"mood":"anxious","moodScore":5,"energyLevel":6}'

# Test user insights
curl http://localhost:3000/api/mcp/user-insights
```

## Troubleshooting

### MCP Server Not Showing Up in Claude Desktop

1. Check config file location and syntax
2. Ensure absolute paths are used
3. Verify server built successfully (`npm run build`)
4. Restart Claude Desktop
5. Check Claude Desktop logs for errors

### API Routes Returning Errors

1. Verify authentication (logged in user)
2. Check request body format matches schemas
3. Review server logs for detailed errors
4. Ensure database has mood_entries table

### TypeScript Import Errors

The MCP server uses ES modules. If you encounter import errors:

1. Ensure `"type": "module"` in mcp-server/package.json
2. Use `.js` extensions in imports (TypeScript will resolve `.ts` files)
3. Check tsconfig.json has `"module": "ES2022"`

## Best Practices

1. **Rate Limiting**: Consider adding rate limits to API routes in production
2. **Caching**: Cache user insights to reduce computation
3. **Privacy**: Never log sensitive user mood data
4. **Error Handling**: Always handle errors gracefully and provide user-friendly messages
5. **Data Validation**: Validate all inputs with Zod schemas
6. **Authentication**: Ensure all API routes check user authentication

## Future Enhancements

- [ ] Add WebSocket support for real-time insights
- [ ] Implement ML-based mood prediction
- [ ] Add support for voice/audio analysis
- [ ] Create visualization tools for patterns
- [ ] Add multi-language support
- [ ] Implement federated learning for privacy-preserving insights

## Support

For issues or questions:
- GitHub Issues: [Your repo URL]
- Email: afelipeflorezo@gmail.com
- Documentation: See README files in each directory

## License

MIT

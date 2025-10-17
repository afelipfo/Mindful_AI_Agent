#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { analyzeMood, MoodAnalysisInputSchema } from "./tools/mood-analysis.js";
import { generateWellnessRecommendations, WellnessRecommendationsInputSchema, } from "./tools/wellness-recommendations.js";
import { generateUserInsights, UserInsightsInputSchema, } from "./tools/user-insights.js";
/**
 * Mindful AI MCP Server
 * Provides mental health and wellness tools for AI agents
 */
// Define available tools
const TOOLS = [
    {
        name: "analyze_mood",
        description: "Analyzes text input to detect mood, emotions, triggers, and severity. Returns detailed mood analysis with confidence scores and personalized recommendations.",
        inputSchema: {
            type: "object",
            properties: {
                text: {
                    type: "string",
                    description: "User's text input describing their feelings or situation",
                },
                emotions: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional list of detected emotions",
                },
                moodScore: {
                    type: "number",
                    minimum: 1,
                    maximum: 10,
                    description: "Optional mood score from 1-10",
                },
                energyLevel: {
                    type: "number",
                    minimum: 1,
                    maximum: 10,
                    description: "Optional energy level from 1-10",
                },
                context: {
                    type: "string",
                    description: "Optional additional context about the user's situation",
                },
            },
            required: ["text"],
        },
    },
    {
        name: "generate_wellness_recommendations",
        description: "Generates personalized wellness recommendations based on user's current emotional state. Returns immediate, short-term, and long-term actionable wellness practices with instructions.",
        inputSchema: {
            type: "object",
            properties: {
                mood: {
                    type: "string",
                    enum: ["anxious", "happy", "sad", "tired", "stressed", "excited"],
                    description: "Current mood state",
                },
                moodScore: {
                    type: "number",
                    minimum: 1,
                    maximum: 10,
                    description: "Mood score from 1-10",
                },
                energyLevel: {
                    type: "number",
                    minimum: 1,
                    maximum: 10,
                    description: "Energy level from 1-10",
                },
                triggers: {
                    type: "array",
                    items: { type: "string" },
                    description: "Optional list of identified triggers",
                },
                preferences: {
                    type: "object",
                    properties: {
                        activityLevel: {
                            type: "string",
                            enum: ["low", "moderate", "high"],
                            description: "User's activity level preference",
                        },
                        timeAvailable: {
                            type: "number",
                            description: "Minutes available for wellness activities",
                        },
                        environment: {
                            type: "string",
                            enum: ["home", "work", "outdoor", "any"],
                            description: "Current environment",
                        },
                    },
                },
            },
            required: ["mood", "moodScore", "energyLevel"],
        },
    },
    {
        name: "generate_user_insights",
        description: "Analyzes historical mood data to identify patterns, trends, and triggers. Generates personalized insights and recommendations based on mood history over time.",
        inputSchema: {
            type: "object",
            properties: {
                userId: {
                    type: "string",
                    description: "User identifier",
                },
                moodHistory: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            date: {
                                type: "string",
                                description: "ISO date string",
                            },
                            mood: {
                                type: "string",
                                enum: ["anxious", "happy", "sad", "tired", "stressed", "excited"],
                            },
                            moodScore: {
                                type: "number",
                                minimum: 1,
                                maximum: 10,
                            },
                            energyLevel: {
                                type: "number",
                                minimum: 1,
                                maximum: 10,
                            },
                            triggers: {
                                type: "array",
                                items: { type: "string" },
                            },
                            emotions: {
                                type: "array",
                                items: { type: "string" },
                            },
                        },
                        required: ["date", "mood", "moodScore", "energyLevel"],
                    },
                    description: "Array of historical mood entries",
                },
                timeframe: {
                    type: "string",
                    enum: ["week", "month", "quarter", "year"],
                    description: "Optional timeframe for analysis",
                },
            },
            required: ["userId", "moodHistory"],
        },
    },
];
// Create server instance
const server = new Server({
    name: "mindful-ai-mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOLS,
    };
});
// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "analyze_mood": {
                const validated = MoodAnalysisInputSchema.parse(args);
                const result = await analyzeMood(validated);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case "generate_wellness_recommendations": {
                const validated = WellnessRecommendationsInputSchema.parse(args);
                const result = await generateWellnessRecommendations(validated);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            case "generate_user_insights": {
                const validated = UserInsightsInputSchema.parse(args);
                const result = await generateUserInsights(validated);
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ error: errorMessage }, null, 2),
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
    console.error("Mindful AI MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
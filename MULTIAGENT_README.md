# Multi-Agent System Implementation

## Overview

This branch implements a production-grade, secure, multi-agent system for the Mindful AI Agent platform using **LangGraph** for orchestration, **OpenAI** for LLM capabilities, and **Supabase** for execution tracing with Row-Level Security (RLS).

## Key Features

✅ **Dynamic Tool Selection** - LangGraph planner agent selects appropriate tools based on user intent
✅ **Goal Coach Agent** - Specialized agent for wellness goal creation, tracking, and coaching
✅ **Command Palette UI** - Keyboard-driven command interface (Cmd+K) using `cmdk`
✅ **Execution Tracing** - All agent actions logged to Supabase with full observability
✅ **Secure by Default** - RLS policies ensure user data isolation
✅ **Backward Compatible** - Zero breaking changes to existing features

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Command Palette (Cmd+K)                   │
├─────────────────────────────────────────────────────────────┤
│                 LangGraph Planner Agent                      │
│  • Analyzes user intent                                      │
│  • Selects tools dynamically                                 │
│  • Orchestrates multi-tool workflows                         │
├─────────────────────────────────────────────────────────────┤
│                    Specialist Agents                         │
│  ├─ Goal Coach Agent (goal management)                      │
│  ├─ Mood Analyzer (wraps existing empathy-agent.ts)         │
│  └─ Resource Finder (books, music, places)                  │
├─────────────────────────────────────────────────────────────┤
│                    Tool Registry                             │
│  • Dynamic tool discovery from database                      │
│  • JSON schema validation                                    │
│  • Rate limiting per tool                                    │
├─────────────────────────────────────────────────────────────┤
│              Execution Trace Store (Supabase)                │
│  • session-scoped traces                                     │
│  • RLS policies for security                                 │
│  • Performance analytics                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## New Database Tables

### 1. `agent_sessions`
Tracks multi-agent conversation sessions:
- `id` (UUID) - Session identifier
- `user_id` (UUID) - User who owns the session
- `session_type` - onboarding | goal_coaching | ad_hoc | command_palette
- `status` - active | completed | failed | timeout
- `context` (JSONB) - Session state and metadata
- `created_at`, `updated_at`, `completed_at`

### 2. `execution_traces`
Stores every agent action and tool call:
- `id` (UUID) - Trace identifier
- `session_id` (UUID) - Parent session
- `user_id` (UUID) - User who triggered the action
- `agent` - planner | goal_coach | mood_analyzer | resource_finder
- `tool` - Tool name if applicable
- `input` (JSONB) - Tool input parameters
- `output` (JSONB) - Tool output results
- `status` - pending | running | success | failed
- `duration_ms` - Execution time
- `error_message` - Error details if failed
- `timestamp`, `metadata` (JSONB)

### 3. `tool_registry`
Dynamic tool registration:
- `id` (UUID) - Tool identifier
- `tool_name` - Unique tool name
- `display_name` - Human-readable name
- `description` - Tool purpose
- `category` - analysis | recommendation | goal_management | resource_discovery
- `endpoint` - API route path
- `input_schema` (JSONB) - JSON schema for validation
- `output_schema` (JSONB) - Expected output structure
- `rate_limit_per_minute` - Rate limiting
- `is_active` - Enable/disable tool

### 4. `agent_configurations`
Agent-specific configurations:
- `agent_name` - Unique agent identifier
- `system_prompt` - LLM system prompt
- `model_name` - OpenAI model (default: gpt-4o-mini)
- `temperature` - LLM temperature
- `max_tokens` - Token limit
- `version` - Prompt version tracking

---

## Command Palette Usage

Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open the command palette.

### Available Commands

#### Goal Management
- **Create a new goal** - Set a wellness target with AI guidance
- **Track progress** - View all goals and insights
- **Celebrate achievement** - Mark a goal as completed

#### Wellness Resources
- **Find calming music** - Mood-based playlist recommendations
- **Recommend a book** - Mental wellness reading suggestions
- **Find nearby wellness spots** - Parks, cafes, quiet places

#### AI Analysis
- **Analyze my mood** - Get personalized insights from your message
- **Generate insights** - Analyze patterns from your mood history

---

## API Endpoints

### `POST /api/agent/execute`
Execute agent commands from the command palette.

**Request:**
```json
{
  "command": "draft_goal" | "track_goals" | "analyze_mood" | ...,
  "args": {
    "text": "I want to meditate 10 minutes daily",
    "targetValue": 10,
    "unit": "sessions"
  },
  "userId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "type": "draft",
    "message": "Great! I've structured your goal...",
    "goal": {
      "goal": "Meditate 10 minutes daily",
      "targetValue": 10,
      "unit": "sessions",
      "progress": 0
    }
  },
  "sessionId": "uuid",
  "executionTimeMs": 1234
}
```

### `GET /api/agent/execute`
Get user's active agent sessions.

**Response:**
```json
{
  "success": true,
  "data": {
    "activeSessions": [...],
    "count": 2
  }
}
```

---

## Agent Framework

### Planner Agent (`lib/agents/planner-agent.ts`)
Dynamic tool selection using LangGraph:
1. **Plan** - Analyze user intent and select tools
2. **Execute** - Run selected tools in sequence
3. **Respond** - Synthesize results into supportive message

**Usage:**
```typescript
import { invokePlannerAgent } from "@/lib/agents/planner-agent"

const result = await invokePlannerAgent(
  sessionId,
  userId,
  "I'm feeling anxious today",
  { moodScore: 4, energyLevel: 6 }
)
```

### Goal Coach Agent (`lib/agents/goal-coach-agent.ts`)
Specialized agent for goal management:
- **draft** - Create SMART goals
- **update** - Track progress with encouragement
- **track** - Analyze all goals
- **celebrate** - Acknowledge achievements
- **suggest_adjustment** - Recommend realistic adjustments

**Usage:**
```typescript
import { goalCoachAgent } from "@/lib/agents/goal-coach-agent"

const result = await goalCoachAgent(state, {
  action: "draft",
  goalText: "Exercise 3 times per week",
})
```

---

## Tool Registry

Tools are dynamically loaded from the `tool_registry` table. Pre-seeded tools:

1. **analyze_mood** - `/api/mcp/mood-analysis`
2. **generate_wellness_recommendations** - `/api/mcp/wellness-recommendations`
3. **generate_user_insights** - `/api/mcp/user-insights`
4. **draft_goal** - `/api/wellness-goals`
5. **update_goal** - `/api/wellness-goals`
6. **fetch_resources** - `/api/empathy-recommendations`

**Adding New Tools:**
```typescript
import { registerTool } from "@/lib/agents/tools/tool-registry"

await registerTool({
  name: "my_tool",
  displayName: "My Tool",
  description: "What my tool does",
  category: "analysis",
  endpoint: "/api/my-tool",
  inputSchema: MyInputSchema,
  outputSchema: MyOutputSchema,
  rateLimit: 10,
})
```

---

## Execution Tracing

All agent actions are automatically traced to Supabase:

```typescript
import { saveExecutionTrace } from "@/lib/agents/trace-store"

await saveExecutionTrace({
  sessionId,
  userId,
  agent: "goal_coach",
  tool: "draft_goal",
  input: { goalText: "..." },
  output: { goal: {...} },
  status: "success",
  durationMs: 1234,
  timestamp: new Date(),
})
```

View traces in the database:
```sql
SELECT * FROM execution_traces
WHERE user_id = '<user-id>'
ORDER BY timestamp DESC
LIMIT 50;
```

---

## Security

### Row-Level Security (RLS)
All new tables enforce RLS policies:
```sql
CREATE POLICY "Users can view own traces"
  ON execution_traces FOR SELECT
  USING (auth.uid() = user_id);
```

### Session Management
- JWT-based authentication via NextAuth.js
- Session IDs scoped to individual users
- No cross-user data leakage

### Rate Limiting
- Tool-level rate limits (configurable per tool)
- Default: 10 requests/minute per tool
- Upgradeable to Upstash Redis for distributed limiting

---

## Deployment Steps

### 1. Install Dependencies
```bash
pnpm install
```

New packages added:
- `@langchain/core`
- `@langchain/langgraph`
- `@langchain/openai`
- `@ai-sdk/openai`
- `cmdk`
- `zod-to-json-schema`

### 2. Run Database Migration
```bash
# Connect to your Supabase instance
psql -h <supabase-url> -U postgres -d postgres -f supabase/multiagent-schema.sql
```

Verify tables created:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND (
  tablename LIKE 'agent_%'
  OR tablename = 'execution_traces'
  OR tablename = 'tool_registry'
);
```

### 3. Set Environment Variables
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL_NAME=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For tool execution
```

### 4. Build and Deploy
```bash
pnpm build
pnpm start
```

### 5. Test Command Palette
1. Sign in to your account
2. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
3. Select a command (e.g., "Create a new goal")
4. Type your goal and press Enter

---

## Monitoring & Observability

### Agent Performance View
```sql
SELECT * FROM agent_performance_summary
WHERE user_id = '<user-id>';
```

Returns:
- `agent` - Agent name
- `total_executions` - Total runs
- `successful_executions` - Success count
- `failed_executions` - Failure count
- `avg_duration_ms` - Average execution time
- `p95_duration_ms` - 95th percentile latency
- `last_execution` - Most recent run

### Tool Usage Summary
```sql
SELECT * FROM tool_usage_summary
ORDER BY usage_date DESC, total_calls DESC
LIMIT 50;
```

### Session Completion Rates
```sql
SELECT * FROM session_completion_rates;
```

---

## Cost Estimation

### OpenAI API Costs (GPT-4o-mini)
- **Input**: $0.015 per 1M tokens
- **Output**: $0.06 per 1M tokens

**Example:**
- 10,000 commands/month
- ~500 input tokens per command
- ~300 output tokens per command

**Total**: ~$0.26/month

### Database Storage
- ~5 KB per execution trace
- 10,000 commands = 50 MB/month
- Supabase Free Tier: 500 MB (sufficient for testing)
- Pro Plan ($25/month): 8 GB included

### Recommendation
- Implement 90-day trace retention
- Archive old traces to cold storage (Vercel Blob/S3)

---

## Backward Compatibility

✅ **Zero Breaking Changes**
- All existing features continue to work
- New tables only (no schema changes to existing tables)
- New API routes under `/api/agent/*`
- Command palette is opt-in (keyboard shortcut)

✅ **Existing Endpoints Unchanged**
- `/api/empathy-recommendations` - Still works
- `/api/wellness-goals` - Still works
- `/api/mcp/*` - Still works

---

## Troubleshooting

### Command Palette Not Opening
- Check browser console for errors
- Verify you're signed in (palette requires authentication)
- Try clearing browser cache

### Agent Execution Fails
- Check OpenAI API key is set: `echo $OPENAI_API_KEY`
- Verify database migration ran successfully
- Check Supabase logs for RLS policy errors

### Tools Not Showing
- Verify `tool_registry` table is populated:
  ```sql
  SELECT * FROM tool_registry WHERE is_active = true;
  ```
- If empty, re-run the seed section of `multiagent-schema.sql`

### Slow Agent Responses
- Check OpenAI API status
- Monitor execution traces for bottlenecks:
  ```sql
  SELECT agent, tool, AVG(duration_ms)
  FROM execution_traces
  WHERE status = 'success'
  GROUP BY agent, tool;
  ```

---

## Future Enhancements

### Phase 5: Adaptive Onboarding
- Replace static 6-step onboarding with dynamic LLM planner
- A/B test completion rates
- Skip irrelevant questions based on user responses

### Phase 6: Multi-Modal Input
- Voice command support ("Hey Mindful, create a goal...")
- Image-based mood detection via command palette
- Video journaling analysis

### Phase 7: Advanced Analytics
- User insights dashboard showing agent activity
- Goal achievement predictions using ML
- Personalized intervention timing

---

## Contributing

### Adding a New Agent
1. Create agent file in `lib/agents/`
2. Define agent state and response types
3. Implement agent logic using OpenAI Chat
4. Add execution tracing
5. Export from `lib/agents/index.ts`

### Adding a New Tool
1. Create tool implementation (API route)
2. Register in `tool_registry` table
3. Add Zod schemas for input/output validation
4. Update planner agent's tool preparation logic

### Adding Command Palette Commands
1. Add command item to `components/command-palette.tsx`
2. Handle command in `/api/agent/execute/route.ts`
3. Update documentation

---

## Support

For issues, questions, or feature requests:
1. Check this README
2. Review execution traces in database
3. Check Supabase logs
4. Review OpenAI API usage dashboard

---

## License

Same as parent project (Mindful AI Agent)

---

**Built with:**
- [LangGraph](https://github.com/langchain-ai/langgraph) - Agent orchestration
- [OpenAI](https://openai.com) - LLM capabilities
- [Supabase](https://supabase.com) - Database + Auth + RLS
- [cmdk](https://cmdk.paco.me/) - Command palette UI
- [Next.js 15](https://nextjs.org) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Zod](https://zod.dev) - Schema validation

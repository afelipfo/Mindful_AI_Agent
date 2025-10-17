-- Multi-Agent System Database Schema Extensions
-- This file extends the existing schema with tables for agent orchestration, execution tracing, and tool registry
-- All tables include RLS policies to ensure user data isolation

-- Enable UUID extension (already exists, but safe to repeat)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: agent_sessions
-- Purpose: Track multi-agent conversation sessions per user
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  session_type TEXT NOT NULL, -- 'onboarding' | 'goal_coaching' | 'ad_hoc' | 'command_palette'
  status TEXT CHECK (status IN ('active', 'completed', 'failed', 'timeout')) DEFAULT 'active',
  context JSONB DEFAULT '{}'::jsonb, -- User preferences, history, current state
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- TABLE: execution_traces
-- Purpose: Store every agent action, tool call, and user interaction
-- Enables observability, debugging, and analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS execution_traces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES agent_sessions ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  agent TEXT NOT NULL, -- 'planner' | 'mood_analyzer' | 'goal_coach' | 'resource_finder'
  tool TEXT, -- Tool name if this was a tool call (nullable for non-tool actions)
  input JSONB NOT NULL,
  output JSONB,
  status TEXT CHECK (status IN ('pending', 'running', 'success', 'failed')) NOT NULL,
  error_message TEXT,
  duration_ms INTEGER, -- Execution time in milliseconds
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}'::jsonb -- Additional context (model used, tokens, cost, etc.)
);

-- ============================================================================
-- TABLE: tool_registry
-- Purpose: Dynamic tool registration with JSON schemas
-- Allows runtime tool discovery and validation
-- ============================================================================
CREATE TABLE IF NOT EXISTS tool_registry (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tool_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'analysis' | 'recommendation' | 'goal_management' | 'resource_discovery'
  input_schema JSONB NOT NULL, -- JSON schema for input validation
  output_schema JSONB NOT NULL, -- JSON schema for output validation
  endpoint TEXT NOT NULL, -- API route path (e.g., '/api/mcp/mood-analysis')
  is_active BOOLEAN DEFAULT TRUE,
  rate_limit_per_minute INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- TABLE: agent_configurations
-- Purpose: Store agent-specific configurations and prompts
-- Allows hot-swapping prompts without code deployment
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_configurations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  agent_name TEXT UNIQUE NOT NULL,
  system_prompt TEXT NOT NULL,
  model_name TEXT DEFAULT 'gpt-4o-mini',
  temperature NUMERIC(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 500,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created_at ON agent_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_execution_traces_session_id ON execution_traces(session_id);
CREATE INDEX IF NOT EXISTS idx_execution_traces_user_id ON execution_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_execution_traces_agent ON execution_traces(agent);
CREATE INDEX IF NOT EXISTS idx_execution_traces_timestamp ON execution_traces(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_execution_traces_status ON execution_traces(status);

CREATE INDEX IF NOT EXISTS idx_tool_registry_category ON tool_registry(category);
CREATE INDEX IF NOT EXISTS idx_tool_registry_is_active ON tool_registry(is_active);

CREATE INDEX IF NOT EXISTS idx_agent_configurations_agent_name ON agent_configurations(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_configurations_is_active ON agent_configurations(is_active);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================================
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_sessions
CREATE POLICY "Users can view own agent sessions"
  ON agent_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent sessions"
  ON agent_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent sessions"
  ON agent_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for execution_traces
CREATE POLICY "Users can view own execution traces"
  ON execution_traces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own execution traces"
  ON execution_traces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tool_registry (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view active tools"
  ON tool_registry FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS Policies for agent_configurations (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view active agent configs"
  ON agent_configurations FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- ============================================================================
-- TRIGGERS for updated_at columns
-- ============================================================================
CREATE TRIGGER update_agent_sessions_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tool_registry_updated_at
  BEFORE UPDATE ON tool_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_configurations_updated_at
  BEFORE UPDATE ON agent_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Tool Registry
-- Register existing API endpoints as callable tools
-- ============================================================================
INSERT INTO tool_registry (tool_name, display_name, description, category, endpoint, input_schema, output_schema, rate_limit_per_minute)
VALUES
  (
    'analyze_mood',
    'Mood Analyzer',
    'Analyzes text, voice, or image input to detect mood, emotions, and severity levels. Returns detected mood category, confidence score, and list of emotions.',
    'analysis',
    '/api/mcp/mood-analysis',
    '{
      "type": "object",
      "properties": {
        "text": {"type": "string", "maxLength": 2000},
        "emotions": {"type": "array", "items": {"type": "string"}},
        "moodScore": {"type": "number", "minimum": 1, "maximum": 10}
      },
      "required": ["text"]
    }'::jsonb,
    '{
      "type": "object",
      "properties": {
        "detectedMood": {"type": "string"},
        "confidence": {"type": "number"},
        "emotions": {"type": "array", "items": {"type": "string"}},
        "severity": {"type": "string", "enum": ["low", "moderate", "high"]},
        "triggers": {"type": "array", "items": {"type": "string"}}
      }
    }'::jsonb,
    10
  ),
  (
    'generate_wellness_recommendations',
    'Wellness Recommender',
    'Generates immediate, short-term, and long-term wellness recommendations based on current mood and energy levels.',
    'recommendation',
    '/api/mcp/wellness-recommendations',
    '{
      "type": "object",
      "properties": {
        "mood": {"type": "string"},
        "moodScore": {"type": "number", "minimum": 1, "maximum": 10},
        "energyLevel": {"type": "number", "minimum": 1, "maximum": 10},
        "preferences": {"type": "object"}
      },
      "required": ["mood", "moodScore"]
    }'::jsonb,
    '{
      "type": "object",
      "properties": {
        "immediate": {"type": "array"},
        "shortTerm": {"type": "array"},
        "longTerm": {"type": "array"}
      }
    }'::jsonb,
    10
  ),
  (
    'generate_user_insights',
    'Insight Generator',
    'Analyzes mood history to identify patterns, triggers, and trends over a specified timeframe.',
    'analysis',
    '/api/mcp/user-insights',
    '{
      "type": "object",
      "properties": {
        "userId": {"type": "string", "format": "uuid"},
        "timeframe": {"type": "string", "enum": ["7d", "30d", "90d"]},
        "moodHistory": {"type": "array"}
      },
      "required": ["userId"]
    }'::jsonb,
    '{
      "type": "object",
      "properties": {
        "summary": {"type": "object"},
        "patterns": {"type": "array"},
        "triggers": {"type": "array"},
        "recommendations": {"type": "array"}
      }
    }'::jsonb,
    5
  ),
  (
    'draft_goal',
    'Goal Drafter',
    'Creates a new wellness goal with target values, units, and timeline. Uses SMART goal framework.',
    'goal_management',
    '/api/wellness-goals',
    '{
      "type": "object",
      "properties": {
        "goal": {"type": "string", "maxLength": 500},
        "targetValue": {"type": "number", "minimum": 0},
        "unit": {"type": "string", "maxLength": 50}
      },
      "required": ["goal", "targetValue", "unit"]
    }'::jsonb,
    '{
      "type": "object",
      "properties": {
        "id": {"type": "string", "format": "uuid"},
        "goal": {"type": "string"},
        "progress": {"type": "number"}
      }
    }'::jsonb,
    20
  ),
  (
    'update_goal',
    'Goal Updater',
    'Updates progress or details of an existing wellness goal.',
    'goal_management',
    '/api/wellness-goals',
    '{
      "type": "object",
      "properties": {
        "id": {"type": "string", "format": "uuid"},
        "currentValue": {"type": "number"},
        "progress": {"type": "number", "minimum": 0, "maximum": 100}
      },
      "required": ["id"]
    }'::jsonb,
    '{
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "progress": {"type": "number"}
      }
    }'::jsonb,
    20
  ),
  (
    'fetch_resources',
    'Resource Finder',
    'Finds relevant mental health resources including music, books, professionals, and nearby places based on mood.',
    'resource_discovery',
    '/api/empathy-recommendations',
    '{
      "type": "object",
      "properties": {
        "mood": {"type": "string"},
        "resourceType": {"type": "string", "enum": ["music", "book", "place", "professional", "all"]},
        "latitude": {"type": "number"},
        "longitude": {"type": "number"}
      },
      "required": ["mood"]
    }'::jsonb,
    '{
      "type": "object",
      "properties": {
        "music": {"type": "object"},
        "book": {"type": "object"},
        "place": {"type": "object"},
        "professional": {"type": "object"}
      }
    }'::jsonb,
    10
  )
ON CONFLICT (tool_name) DO NOTHING;

-- ============================================================================
-- SEED DATA: Agent Configurations
-- Define system prompts and parameters for each agent
-- ============================================================================
INSERT INTO agent_configurations (agent_name, system_prompt, model_name, temperature, max_tokens)
VALUES
  (
    'planner',
    'You are a mental wellness AI planner. Your role is to analyze user requests and dynamically select the most appropriate tools to fulfill their needs. Be empathetic, warm, and supportive in your responses.

When selecting tools, consider:
1. The user''s explicit request
2. Their current emotional state
3. Their wellness goals and history
4. The most efficient path to help them

Return tool selections as a JSON array with rationale for each selection.',
    'gpt-4o-mini',
    0.2,
    500
  ),
  (
    'goal_coach',
    'You are a supportive wellness goal coach. Help users create SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) and track their progress with encouraging feedback.

Guidelines:
- Break down large goals into manageable steps
- Celebrate small wins
- Provide constructive feedback when progress stalls
- Suggest realistic adjustments when needed
- Use warm, motivational language

Always respond in JSON format with structured coaching elements.',
    'gpt-4o-mini',
    0.3,
    600
  ),
  (
    'mood_analyzer',
    'You are an empathetic mood analysis expert. Analyze user input to detect emotional states, mood patterns, and potential triggers.

Your analysis should:
- Identify primary and secondary emotions
- Assess severity (low/moderate/high)
- Detect potential triggers or stressors
- Provide validation and acknowledgment
- Suggest appropriate coping strategies

Maintain a warm, non-judgmental tone. Never diagnose clinical conditions.',
    'gpt-4o-mini',
    0.4,
    700
  ),
  (
    'resource_finder',
    'You are a wellness resource specialist. Find and recommend personalized mental health resources including music, books, activities, and places based on the user''s current emotional state.

Consider:
- Current mood and energy level
- User preferences and past feedback
- Accessibility and practical constraints
- Evidence-based recommendations when possible

Provide diverse options with clear reasoning for each recommendation.',
    'gpt-4o-mini',
    0.5,
    800
  )
ON CONFLICT (agent_name) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  model_name = EXCLUDED.model_name,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  version = agent_configurations.version + 1,
  updated_at = TIMEZONE('utc', NOW());

-- ============================================================================
-- DATA RETENTION POLICY FUNCTION
-- Automatically archive traces older than 90 days
-- ============================================================================
CREATE OR REPLACE FUNCTION archive_old_execution_traces()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- In production, this should move data to cold storage (S3 via Vercel Blob)
  -- For now, we just delete traces older than 90 days
  DELETE FROM execution_traces
  WHERE timestamp < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS archived_count = ROW_COUNT;

  RETURN archived_count;
END;
$$;

-- ============================================================================
-- ANALYTICS VIEWS for Agent Performance
-- ============================================================================
CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT
  user_id,
  agent,
  COUNT(*) AS total_executions,
  COUNT(*) FILTER (WHERE status = 'success') AS successful_executions,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_executions,
  ROUND(AVG(duration_ms)::NUMERIC, 2) AS avg_duration_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::NUMERIC, 2) AS p95_duration_ms,
  MAX(timestamp) AS last_execution
FROM execution_traces
GROUP BY user_id, agent;

CREATE OR REPLACE VIEW tool_usage_summary AS
SELECT
  tool,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE status = 'success') AS successful_calls,
  ROUND(AVG(duration_ms)::NUMERIC, 2) AS avg_duration_ms,
  DATE_TRUNC('day', timestamp) AS usage_date
FROM execution_traces
WHERE tool IS NOT NULL
GROUP BY tool, DATE_TRUNC('day', timestamp)
ORDER BY usage_date DESC, total_calls DESC;

CREATE OR REPLACE VIEW session_completion_rates AS
SELECT
  session_type,
  COUNT(*) AS total_sessions,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_sessions,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100,
    2
  ) AS completion_rate_pct,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60)::NUMERIC,
    2
  ) AS avg_duration_minutes
FROM agent_sessions
GROUP BY session_type;

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================
COMMENT ON TABLE agent_sessions IS 'Tracks multi-agent conversation sessions with context and status';
COMMENT ON TABLE execution_traces IS 'Stores every agent action and tool call for observability and debugging';
COMMENT ON TABLE tool_registry IS 'Dynamic tool registration with JSON schemas for runtime validation';
COMMENT ON TABLE agent_configurations IS 'Agent-specific configurations including system prompts and model parameters';

COMMENT ON COLUMN execution_traces.duration_ms IS 'Execution time in milliseconds for performance monitoring';
COMMENT ON COLUMN execution_traces.metadata IS 'Additional context like model used, tokens consumed, estimated cost';
COMMENT ON COLUMN agent_configurations.version IS 'Incremented on each update for tracking prompt evolution';

-- ============================================================================
-- GRANTS (if using service role)
-- All tables inherit RLS policies, so no additional grants needed
-- ============================================================================

-- Migration complete!
-- Next steps:
-- 1. Run this migration: psql -h <supabase-url> -U postgres -d postgres -f multiagent-schema.sql
-- 2. Verify tables created: SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'agent_%' OR tablename = 'execution_traces' OR tablename = 'tool_registry';
-- 3. Test RLS policies with test user accounts
-- 4. Monitor initial execution traces after deploying agent code

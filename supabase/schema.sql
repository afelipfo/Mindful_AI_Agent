-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create onboarding_responses table
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  step INTEGER NOT NULL,
  step_title TEXT NOT NULL,
  response TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  emotions TEXT[] DEFAULT '{}',
  triggers TEXT[] DEFAULT '{}',
  coping_strategies TEXT[] DEFAULT '{}',
  entry_type TEXT CHECK (entry_type IN ('text', 'voice', 'emoji', 'photo')),
  note TEXT,
  audio_url TEXT,
  photo_url TEXT,
  entry_timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create wellness_goals table
CREATE TABLE IF NOT EXISTS wellness_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  goal TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  insight_type TEXT CHECK (insight_type IN ('pattern', 'recommendation', 'alert')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_date ON mood_entries(date DESC);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, date DESC);
CREATE INDEX idx_onboarding_responses_user_id ON onboarding_responses(user_id);
CREATE INDEX idx_wellness_goals_user_id ON wellness_goals(user_id);
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for onboarding_responses
CREATE POLICY "Users can view own onboarding responses"
  ON onboarding_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding responses"
  ON onboarding_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding responses"
  ON onboarding_responses FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for mood_entries
CREATE POLICY "Users can view own mood entries"
  ON mood_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood entries"
  ON mood_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood entries"
  ON mood_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood entries"
  ON mood_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for wellness_goals
CREATE POLICY "Users can view own wellness goals"
  ON wellness_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness goals"
  ON wellness_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness goals"
  ON wellness_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness goals"
  ON wellness_goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ai_insights
CREATE POLICY "Users can view own ai insights"
  ON ai_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ai insights"
  ON ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_entries_updated_at BEFORE UPDATE ON mood_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_responses_updated_at BEFORE UPDATE ON onboarding_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wellness_goals_updated_at BEFORE UPDATE ON wellness_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure unique onboarding steps per user
DO $$
BEGIN
  ALTER TABLE onboarding_responses
    ADD CONSTRAINT onboarding_responses_user_step_key UNIQUE (user_id, step);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- Ensure insights are unique per description per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_insights_user_description ON ai_insights(user_id, description);

-- Aggregated analytics views
CREATE OR REPLACE VIEW public.user_trigger_frequency AS
SELECT
  user_id,
  unnest_trigger AS trigger,
  COUNT(*) AS occurrences
FROM (
  SELECT
    user_id,
    UNNEST(triggers) AS unnest_trigger
  FROM mood_entries
  WHERE array_length(triggers, 1) IS NOT NULL
) t
GROUP BY user_id, unnest_trigger;

CREATE OR REPLACE VIEW public.user_coping_effectiveness AS
SELECT
  user_id,
  UNNEST(coping_strategies) AS strategy,
  ROUND(AVG(mood_score)::NUMERIC, 1) AS average_mood
FROM mood_entries
WHERE array_length(coping_strategies, 1) IS NOT NULL
GROUP BY user_id, strategy;

CREATE OR REPLACE VIEW public.user_energy_by_hour AS
SELECT
  user_id,
  EXTRACT(HOUR FROM entry_timestamp AT TIME ZONE 'UTC')::SMALLINT AS entry_hour,
  DATE(entry_timestamp) AS entry_date,
  ROUND(AVG(energy_level)::NUMERIC, 2) AS avg_energy
FROM mood_entries
GROUP BY user_id, entry_date, EXTRACT(HOUR FROM entry_timestamp AT TIME ZONE 'UTC')::SMALLINT;

-- Process onboarding payload in a single transaction
CREATE OR REPLACE FUNCTION public.process_onboarding_check_in(
  p_user_id UUID,
  p_responses JSONB,
  p_mood_entry JSONB,
  p_summary JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  resp JSONB;
  inserted_entry_id UUID;
  mood_score INTEGER;
  energy_level INTEGER;
  entry_type TEXT;
  entry_note TEXT;
  entry_audio TEXT;
  entry_photo TEXT;
  entry_date DATE;
  entry_timestamp TIMESTAMPTZ;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User id is required';
  END IF;

  IF p_mood_entry IS NULL THEN
    RAISE EXCEPTION 'Mood entry payload is required';
  END IF;

  -- Upsert responses per (user, step)
  IF COALESCE(jsonb_array_length(p_responses), 0) > 0 THEN
    FOR resp IN SELECT * FROM jsonb_array_elements(p_responses)
    LOOP
      INSERT INTO onboarding_responses (user_id, step, step_title, response, metadata)
      VALUES (
        p_user_id,
        (resp ->> 'step')::INTEGER,
        resp ->> 'stepTitle',
        resp ->> 'response',
        resp -> 'metadata'
      )
      ON CONFLICT (user_id, step) DO UPDATE
      SET step_title = EXCLUDED.step_title,
          response = EXCLUDED.response,
          metadata = EXCLUDED.metadata,
          updated_at = TIMEZONE('utc', NOW());
    END LOOP;
  END IF;

  mood_score := COALESCE((p_mood_entry ->> 'moodScore')::INTEGER, 5);
  energy_level := COALESCE((p_mood_entry ->> 'energyLevel')::INTEGER, 5);
  entry_type := COALESCE(p_mood_entry ->> 'entryType', 'text');
  entry_note := NULLIF(p_mood_entry ->> 'note', '');
  entry_audio := NULLIF(p_mood_entry ->> 'audioUrl', '');
  entry_photo := NULLIF(p_mood_entry ->> 'photoUrl', '');
  entry_date := COALESCE((p_mood_entry ->> 'date')::DATE, TIMEZONE('utc', NOW())::DATE);
  entry_timestamp := COALESCE((p_mood_entry ->> 'timestamp')::TIMESTAMPTZ, TIMEZONE('utc', NOW()));

  INSERT INTO mood_entries (
    user_id,
    date,
    mood_score,
    energy_level,
    emotions,
    triggers,
    coping_strategies,
    entry_type,
    note,
    audio_url,
    photo_url,
    entry_timestamp
  )
  VALUES (
    p_user_id,
    entry_date,
    GREATEST(1, LEAST(10, mood_score)),
    GREATEST(1, LEAST(10, energy_level)),
    COALESCE(
      ARRAY(
        SELECT value::TEXT
        FROM jsonb_array_elements_text(COALESCE(p_mood_entry -> 'emotions', '[]'::JSONB))
        WHERE TRIM(value::TEXT) <> ''
      ),
      '{}'::TEXT[]
    ),
    COALESCE(
      ARRAY(
        SELECT value::TEXT
        FROM jsonb_array_elements_text(COALESCE(p_mood_entry -> 'triggers', '[]'::JSONB))
        WHERE TRIM(value::TEXT) <> ''
      ),
      '{}'::TEXT[]
    ),
    COALESCE(
      ARRAY(
        SELECT value::TEXT
        FROM jsonb_array_elements_text(COALESCE(p_mood_entry -> 'coping', '[]'::JSONB))
        WHERE TRIM(value::TEXT) <> ''
      ),
      '{}'::TEXT[]
    ),
    CASE
      WHEN entry_type IN ('text', 'voice', 'emoji', 'photo') THEN entry_type
      ELSE 'text'
    END,
    entry_note,
    entry_audio,
    entry_photo,
    entry_timestamp
  )
  RETURNING id INTO inserted_entry_id;

  IF p_summary ? 'analysisSummary' AND NULLIF(p_summary ->> 'analysisSummary', '') IS NOT NULL THEN
    INSERT INTO ai_insights (user_id, insight_type, title, description, action)
    VALUES (
      p_user_id,
      'recommendation',
      CONCAT('Mood insight', CASE WHEN NULLIF(p_summary ->> 'detectedMood', '') IS NOT NULL THEN ': ' || p_summary ->> 'detectedMood' ELSE '' END),
      p_summary ->> 'analysisSummary',
      'Review recommendations'
    )
    ON CONFLICT (user_id, description) DO NOTHING;
  END IF;

  RETURN inserted_entry_id;
END;
$$;

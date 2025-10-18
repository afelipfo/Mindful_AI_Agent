-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  bio TEXT,
  timezone TEXT,
  preferred_language TEXT DEFAULT 'en',
  notify_email BOOLEAN DEFAULT TRUE,
  notify_push BOOLEAN DEFAULT FALSE,
  notify_sms BOOLEAN DEFAULT FALSE,
  daily_reminder BOOLEAN DEFAULT TRUE,
  weekly_summary BOOLEAN DEFAULT TRUE,
  reminder_time TEXT DEFAULT '09:00',
  theme_preference TEXT DEFAULT 'system',
  sound_enabled BOOLEAN DEFAULT TRUE,
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

-- Create professionals table
CREATE TABLE IF NOT EXISTS professionals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  location TEXT,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  bio TEXT,
  experience TEXT,
  languages TEXT[] DEFAULT '{}',
  availability TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create professional_messages table
CREATE TABLE IF NOT EXISTS professional_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES professionals ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_from_user BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create empathy_feedback table for recommendation accuracy tracking
CREATE TABLE IF NOT EXISTS empathy_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  detected_mood TEXT NOT NULL,
  feedback TEXT CHECK (feedback IN ('helpful', 'not_helpful')) NOT NULL,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create journal_entries table for user journaling
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_date ON mood_entries(date DESC);
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, date DESC);
CREATE INDEX idx_onboarding_responses_user_id ON onboarding_responses(user_id);
CREATE INDEX idx_wellness_goals_user_id ON wellness_goals(user_id);
CREATE INDEX idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX idx_professional_messages_user_id ON professional_messages(user_id);
CREATE INDEX idx_professional_messages_professional_id ON professional_messages(professional_id);
CREATE INDEX idx_professional_messages_conversation ON professional_messages(user_id, professional_id, created_at DESC);
CREATE INDEX idx_empathy_feedback_user_id ON empathy_feedback(user_id);
CREATE INDEX idx_empathy_feedback_mood ON empathy_feedback(detected_mood);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(date DESC);
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE empathy_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can insert own ai insights"
  ON ai_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai insights"
  ON ai_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for professionals
CREATE POLICY "All authenticated users can view active professionals"
  ON professionals FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS Policies for professional_messages
CREATE POLICY "Users can view own messages"
  ON professional_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON professional_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for empathy_feedback
CREATE POLICY "Users can view own feedback"
  ON empathy_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON empathy_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for journal_entries
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
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

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure profile preference columns exist when applying incremental schema updates
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_push BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_sms BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_reminder BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_summary BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reminder_time TEXT DEFAULT '09:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sound_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_empathy_data JSONB;

-- Add therapeutic questionnaire data columns to mood_entries
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS symptom_anxiety INTEGER CHECK (symptom_anxiety >= 0 AND symptom_anxiety <= 5);
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS symptom_sadness INTEGER CHECK (symptom_sadness >= 0 AND symptom_sadness <= 5);
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS symptom_stress INTEGER CHECK (symptom_stress >= 0 AND symptom_stress <= 5);
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS symptom_loneliness INTEGER CHECK (symptom_loneliness >= 0 AND symptom_loneliness <= 5);
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS symptom_suicide_trends INTEGER CHECK (symptom_suicide_trends >= 0 AND symptom_suicide_trends <= 5);
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS has_previous_therapy BOOLEAN;
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS therapy_duration TEXT;
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS therapy_type TEXT;
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS therapeutic_relationship_importance INTEGER CHECK (therapeutic_relationship_importance >= 1 AND therapeutic_relationship_importance <= 5);
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS patient_readiness INTEGER CHECK (patient_readiness >= 1 AND patient_readiness <= 5);

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
    entry_timestamp,
    symptom_anxiety,
    symptom_sadness,
    symptom_stress,
    symptom_loneliness,
    symptom_suicide_trends,
    has_previous_therapy,
    therapy_duration,
    therapy_type,
    therapeutic_relationship_importance,
    patient_readiness
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
    entry_timestamp,
    -- Therapeutic questionnaire data
    CASE WHEN (p_mood_entry -> 'symptomRatings' ->> 'anxiety')::INTEGER IS NOT NULL
         THEN GREATEST(0, LEAST(5, (p_mood_entry -> 'symptomRatings' ->> 'anxiety')::INTEGER))
         ELSE NULL END,
    CASE WHEN (p_mood_entry -> 'symptomRatings' ->> 'sadness')::INTEGER IS NOT NULL
         THEN GREATEST(0, LEAST(5, (p_mood_entry -> 'symptomRatings' ->> 'sadness')::INTEGER))
         ELSE NULL END,
    CASE WHEN (p_mood_entry -> 'symptomRatings' ->> 'stress')::INTEGER IS NOT NULL
         THEN GREATEST(0, LEAST(5, (p_mood_entry -> 'symptomRatings' ->> 'stress')::INTEGER))
         ELSE NULL END,
    CASE WHEN (p_mood_entry -> 'symptomRatings' ->> 'loneliness')::INTEGER IS NOT NULL
         THEN GREATEST(0, LEAST(5, (p_mood_entry -> 'symptomRatings' ->> 'loneliness')::INTEGER))
         ELSE NULL END,
    CASE WHEN (p_mood_entry -> 'symptomRatings' ->> 'suicideTrends')::INTEGER IS NOT NULL
         THEN GREATEST(0, LEAST(5, (p_mood_entry -> 'symptomRatings' ->> 'suicideTrends')::INTEGER))
         ELSE NULL END,
    (p_mood_entry -> 'therapyHistory' ->> 'hasPreviousTherapy')::BOOLEAN,
    p_mood_entry -> 'therapyHistory' ->> 'duration',
    p_mood_entry -> 'therapyHistory' ->> 'type',
    CASE WHEN (p_mood_entry ->> 'therapeuticRelationshipImportance')::INTEGER IS NOT NULL
         THEN GREATEST(1, LEAST(5, (p_mood_entry ->> 'therapeuticRelationshipImportance')::INTEGER))
         ELSE NULL END,
    CASE WHEN (p_mood_entry ->> 'patientReadiness')::INTEGER IS NOT NULL
         THEN GREATEST(1, LEAST(5, (p_mood_entry ->> 'patientReadiness')::INTEGER))
         ELSE NULL END
  )
  RETURNING id INTO inserted_entry_id;

  -- Insert AI insights if summary analysis is provided
  IF p_summary IS NOT NULL AND
     jsonb_typeof(p_summary -> 'analysisSummary') = 'string' AND
     NULLIF(p_summary ->> 'analysisSummary', '') IS NOT NULL THEN
    INSERT INTO ai_insights (user_id, insight_type, title, description, action)
    VALUES (
      p_user_id,
      'recommendation',
      CASE
        WHEN jsonb_typeof(p_summary -> 'detectedMood') = 'string' AND
             NULLIF(p_summary ->> 'detectedMood', '') IS NOT NULL
        THEN CONCAT('Check-in Analysis: ', INITCAP(p_summary ->> 'detectedMood'), ' Mood')
        ELSE 'Check-in Analysis'
      END,
      p_summary ->> 'analysisSummary',
      NULL
    )
    ON CONFLICT (user_id, description) DO NOTHING;
  END IF;

  RETURN inserted_entry_id;
END;
$$;

-- Seed data for professionals table
INSERT INTO professionals (name, specialty, location, phone, email, photo_url, bio, experience, languages, availability, is_active)
VALUES
  (
    'Dr. Sarah Martinez',
    'Clinical Psychologist',
    'San Francisco, CA',
    '+1 (415) 555-0123',
    'sarah.martinez@mindful.health',
    'https://i.pravatar.cc/150?img=1',
    'Specializing in cognitive behavioral therapy and mindfulness-based interventions for anxiety and depression.',
    '15 years',
    ARRAY['English', 'Spanish'],
    'Monday-Friday, 9am-5pm',
    true
  ),
  (
    'Dr. Michael Chen',
    'Psychiatrist',
    'New York, NY',
    '+1 (212) 555-0456',
    'michael.chen@mindful.health',
    'https://i.pravatar.cc/150?img=12',
    'Board-certified psychiatrist with expertise in medication management and integrative mental health approaches.',
    '12 years',
    ARRAY['English', 'Mandarin'],
    'Tuesday-Saturday, 10am-6pm',
    true
  ),
  (
    'Dr. Emily Rodriguez',
    'Licensed Therapist (LMFT)',
    'Los Angeles, CA',
    '+1 (310) 555-0789',
    'emily.rodriguez@mindful.health',
    'https://i.pravatar.cc/150?img=5',
    'Marriage and family therapist focused on relationship dynamics, trauma recovery, and emotional regulation.',
    '10 years',
    ARRAY['English', 'Spanish'],
    'Wednesday-Sunday, 11am-7pm',
    true
  ),
  (
    'Dr. James Wilson',
    'Clinical Social Worker',
    'Chicago, IL',
    '+1 (312) 555-0321',
    'james.wilson@mindful.health',
    'https://i.pravatar.cc/150?img=15',
    'Licensed clinical social worker specializing in stress management, life transitions, and workplace mental health.',
    '8 years',
    ARRAY['English'],
    'Monday-Thursday, 8am-4pm',
    true
  ),
  (
    'Dr. Priya Patel',
    'Psychotherapist',
    'Austin, TX',
    '+1 (512) 555-0654',
    'priya.patel@mindful.health',
    'https://i.pravatar.cc/150?img=9',
    'Holistic psychotherapist integrating mindfulness, somatic therapy, and narrative approaches for healing.',
    '11 years',
    ARRAY['English', 'Hindi', 'Gujarati'],
    'Monday-Friday, 12pm-8pm',
    true
  ),
  (
    'Dr. David Thompson',
    'Addiction Counselor',
    'Seattle, WA',
    '+1 (206) 555-0987',
    'david.thompson@mindful.health',
    'https://i.pravatar.cc/150?img=13',
    'Certified addiction counselor with extensive experience in substance abuse recovery and dual diagnosis treatment.',
    '20 years',
    ARRAY['English'],
    'Monday-Saturday, 9am-9pm',
    true
  )
ON CONFLICT DO NOTHING;

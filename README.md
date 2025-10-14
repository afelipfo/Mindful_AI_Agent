# Mindful AI Agent

An AI-powered mental wellness companion that tracks emotional states through multimodal inputs and provides personalized insights with empathetic recommendations.

## Features

- **Conversational Onboarding**: 6-step personalized setup flow with multimodal inputs (text, voice, emoji, photo)
- **Multimodal Check-Ins**: Express yourself through text, voice, emojis, or photos—both in onboarding and the quick analyzer on the landing page (signed-in quick check-ins are stored alongside your dashboard history)
- **AI Empathy & Recommendations**: Real-time personalized wellness support powered by 5 external APIs:
  - OpenAI GPT-4o-mini for empathetic validation messages
  - Spotify Web API for mood-appropriate music
  - Open Library API for book recommendations
  - Quotable API for inspirational quotes
  - Foursquare Places API for wellness locations
- **Wellness Dashboard**: Visualize mood trends, energy patterns, and triggers
- **AI Insights**: Get personalized recommendations based on your patterns
- **Goal Tracking**: Monitor progress toward your wellness objectives

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS v4
- Shadcn/ui components
- Recharts for data visualization
- Geist font family
- AI SDK for empathy recommendations
- External APIs: OpenAI, Spotify, Open Library, Quotable, Foursquare

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables (see Environment Variables section below)

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Add these to your `.env.local` file or configure them in the Vars section of the v0 in-chat sidebar:

\`\`\`env
# Required for AI empathy messages, multimodal analysis, and recommendations
OPENAI_API_KEY=sk-...

# Supabase (database + auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_secure_random_value

# Required for music recommendations
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Optional for location-based place recommendations
FOURSQUARE_API_KEY=your_api_key
\`\`\`

**Note**: Open Library and Quotable APIs require no authentication. The app will use fallback recommendations if API keys are missing.

### Quick verification

1. Restart the dev server after populating `.env.local` so Next.js and the Supabase client pick up the new keys.
2. Sign up through `/auth/signup`, then walk through onboarding. On any step try recording a **voice note** or uploading a **photo**—you should see the transcript/insight appear in the chat before the empathy panel.
3. From the home page, run a quick analyzer check-in (text + optional voice/photo) while signed in—the result should appear immediately and be written to your dashboard history.
4. Load the dashboard (or refresh `/onboarding` while on the “Dashboard” tab) to confirm the charts now reflect the new entries.
5. Hit the wellness snapshot API directly to inspect the stored data:
   ```bash
   curl -H "cookie: $(pbpaste)" http://localhost:3000/api/wellness-snapshot
   ```
   Replace the cookie header with one copied from your authenticated browser session.

## Project Structure

\`\`\`
/app
  /page.tsx - Landing page with Get Started CTA
  /onboarding/page.tsx - Conversational flow with multimodal inputs
  /dashboard/page.tsx - Wellness metrics overview
  /insights/page.tsx - AI recommendations
  /api
    /empathy-recommendations/route.ts - Main orchestration endpoint
    /music-recommendation/route.ts - Spotify integration
    /book-recommendation/route.ts - Open Library integration
    /quote-recommendation/route.ts - Quotable integration
    /place-recommendation/route.ts - Foursquare integration

/components
  /onboarding 
    - conversation-interface.tsx - Chat UI with multimodal inputs
    - progress-sidebar.tsx - 6-step progress tracker
  /check-in 
    - text-journal.tsx - Text input with character count
    - voice-recorder.tsx - Audio recording with waveform
    - emoji-selector.tsx - Mood emoji picker
    - photo-capture.tsx - Camera/upload interface
    - empathy-recommendations.tsx - AI empathy panel
  /dashboard - Charts and metric cards
  /insights - AI insight cards
  /layout - Header and navigation
  /ui - Shadcn components

/lib
  /sample-data.ts - Mock data for demonstration
  /utils.ts - Utility functions
  /empathy-agent.ts - Mood detection and API orchestration
\`\`\`

## AI Empathy & Recommendations System

### How It Works

After completing any check-in in the onboarding flow, the system:

1. **Analyzes Mood**: Detects emotional state from your input (text sentiment, voice tone, emoji selection, or photo expression)
2. **Categorizes Emotion**: Maps to one of 6 core moods: anxious, happy, sad, tired, stressed, or excited
3. **Calls 5 APIs in Parallel**: Fetches personalized recommendations in <2 seconds using `Promise.all()`
4. **Displays Results**: Shows empathy panel with staggered animations

### API Integration Details

#### 1. OpenAI GPT-4o-mini - Empathy Messages
- **Purpose**: Generate personalized empathy messages and actionable recommendations
- **Model**: gpt-4o-mini with JSON response format
- **Temperature**: 0.7 for natural, empathetic tone
- **Fallback**: Pre-cached responses for each mood category

#### 2. Spotify Web API - Music Recommendations
- **Purpose**: Find mood-appropriate music using audio features
- **Features Used**: Valence (positivity), energy, tempo
- **Seed Genres**: ambient, classical, acoustic
- **Fallback**: Curated playlist for each mood

#### 3. Open Library API - Book Recommendations
- **Purpose**: Search books by mood-related subjects
- **Filters**: Minimum 3.8/5 rating, cover image required
- **Subjects**: Anxiety, mindfulness, joy, resilience, etc.
- **Fallback**: Bestselling wellness books

#### 4. Quotable API - Inspirational Quotes
- **Purpose**: Fetch mood-appropriate quotes
- **Tags**: courage, wisdom, peace, happiness, hope, etc.
- **Max Length**: 150 characters for readability
- **Fallback**: Curated quote collection

#### 5. Foursquare Places API - Wellness Locations
- **Purpose**: Recommend nearby wellness-appropriate places
- **Categories**: Parks, gardens, cafés, viewpoints, water bodies, museums
- **Radius**: 5km from user location
- **Fallback**: Generic place types with benefits

### Mood Categories & Mappings

| Mood | Audio Features | Place Type | Key Benefit |
|------|---------------|------------|-------------|
| **Anxious** | Low valence (0.3), low energy (0.35), slow tempo (60-80 BPM) | Botanical garden | Reduces cortisol by 21% |
| **Happy** | High valence (0.85), high energy (0.75), fast tempo (120-140 BPM) | Scenic viewpoint | Amplifies positive emotions |
| **Sad** | Very low valence (0.2), low energy (0.3), slow tempo (50-75 BPM) | Cozy café | Gentle social exposure |
| **Tired** | Mid valence (0.45), very low energy (0.2), moderate tempo (60-90 BPM) | Quiet park | Restorative environment |
| **Stressed** | Low valence (0.4), low energy (0.4), moderate tempo (70-100 BPM) | Body of water | Calms nervous system |
| **Excited** | Very high valence (0.9), high energy (0.85), fast tempo (130-160 BPM) | Art museum | Channels creative energy |

### Features

- **Parallel API Calls**: All 5 APIs called simultaneously to reduce wait time to <2 seconds
- **Staggered Animations**: Smooth slide-down with 100ms fade-in delays per section
- **User Feedback**: Thumbs up/down to improve future recommendations
- **Error Handling**: Graceful fallbacks if APIs fail or keys are missing
- **Accessibility**: Full keyboard navigation, screen reader support, ARIA labels
- **Responsive Design**: 3-column grid on desktop, single column on mobile
- **Dismissible**: Optional panel that doesn't interrupt workflow

## Design System

### Colors

- **Primary Color**: #6366F1 (Soft Indigo)
- **Secondary Color**: #A78BFA (Lavender)
- **Success**: #10B981 (Green)
- **Warning**: #F59E0B (Amber)
- **Danger**: #EF4444 (Red)

### Animation Easing

- **Hover effects**: ease-out
- **Slide animations**: cubic-bezier(0.4, 0, 0.2, 1)
- **Scale animations**: ease-in-out
- **Rotation (spinners)**: linear
- **Elastic effects**: cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Component States

- **Disabled**: opacity-50 cursor-not-allowed pointer-events-none
- **Focus-visible**: ring-2 ring-primary ring-offset-2
- **Active (pressed)**: scale-95 brightness-95
- **Invalid**: border-red-500 bg-red-50

## Accessibility

- WCAG AA compliant color contrast
- Keyboard navigation support with visible focus indicators
- Screen reader friendly with proper ARIA labels
- Semantic HTML structure
- Focus management in modals and panels
- Alternative text for all images
- Proper heading hierarchy

## API Endpoints

### POST /api/empathy-recommendations

Main orchestration endpoint that calls OpenAI and returns complete recommendation set.

**Request Body:**
\`\`\`json
{
  "moodScore": 7,
  "emotions": ["happy", "grateful"],
  "energyLevel": 8,
  "context": "Had a great meeting today"
}
\`\`\`

**Response:**
\`\`\`json
{
  "empathyMessage": "Your positive energy is wonderful!...",
  "recommendation": {
    "title": "Gratitude Journaling",
    "description": "Capture this moment!...",
    "actionLabel": "Open journal",
    "actionType": "journal"
  },
  "quote": {
    "text": "Happiness is not by chance, but by choice.",
    "author": "Jim Rohn"
  },
  "music": {
    "title": "Here Comes the Sun",
    "artist": "The Beatles",
    "reason": "Uplifting melody that amplifies positive energy",
    "spotifyUrl": "https://open.spotify.com/...",
    "appleMusicUrl": "https://music.apple.com/..."
  },
  "book": {
    "title": "The Book of Joy",
    "author": "Dalai Lama",
    "relevance": "Deepens appreciation for joy",
    "amazonUrl": "https://www.amazon.com/..."
  },
  "place": {
    "type": "A hilltop viewpoint",
    "reason": "Expansive views amplify positive emotions",
    "benefits": "Height enhances feelings of possibility"
  }
}
\`\`\`

### POST /api/music-recommendation

Spotify integration for mood-appropriate music.

### POST /api/book-recommendation

Open Library integration for wellness books.

### POST /api/quote-recommendation

Quotable API integration for inspirational quotes.

### POST /api/place-recommendation

Foursquare integration for wellness locations.

## Performance Optimizations

- Parallel API calls using `Promise.all()` reduce total wait time
- Server-side recommendation generation during mood analysis
- Cached fallback responses for offline/error scenarios
- Lazy loading for external resources
- Optimized animations with CSS transforms
- Debounced input validation
- Next.js API route caching with `revalidate`

## Future Enhancements

- Database storage for tracking recommendation effectiveness over time
- Machine learning to personalize recommendations based on user feedback
- Integration with Spotify/Apple Music APIs for direct playback
- Real-time geolocation for accurate place recommendations
- Social features for sharing progress with trusted contacts
- Voice-to-text transcription for voice check-ins
- Photo mood analysis using computer vision
- Weekly/monthly wellness reports

## Troubleshooting

### API Keys Not Working

1. Check that environment variables are set in the Vars section of the v0 in-chat sidebar
2. Verify API keys are valid and have proper permissions
3. For Spotify, ensure both CLIENT_ID and CLIENT_SECRET are set
4. The app will use fallback recommendations if keys are missing

### Recommendations Not Loading

1. Check browser console for API errors
2. Verify network connectivity
3. The app includes fallback responses for all moods
4. Try refreshing the page

### Voice Recording Not Working

1. Grant microphone permissions in your browser
2. Use HTTPS or localhost (required for microphone access)
3. Check browser compatibility (Chrome, Firefox, Safari supported)

## License

MIT

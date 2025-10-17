# Mindful AI Agent

## Overview
Mindful AI Agent is a Next.js 15 application designed to support mental wellness through multimodal check-ins, personalized recommendations, and comprehensive analytics. The application guides users through conversational onboarding, captures mood and energy data across multiple input modalities (text, voice, emoji, images), and provides AI-driven insights to support mental health awareness. All user data is persisted in Supabase with row-level security policies ensuring privacy and data isolation.

## Core Features

### Onboarding and Check-ins
- Conversational onboarding wizard with 6-step questionnaire covering daily routines, current mood/energy, triggers, coping strategies, wellness goals, and support preferences.
- Multimodal input support: text responses, voice recordings with transcription, emoji selection, and image upload with AI analysis.
- Empathy-driven recommendations generated via OpenAI based on detected mood, emotions, and user context.
- Personalized content recommendations including Spotify music playlists, book suggestions, inspirational quotes, and nearby wellness locations.

### Dashboard and Analytics
- Comprehensive wellness dashboard displaying 7-day and 30-day trend visualizations for mood and energy levels.
- Wellbeing score calculated from recent mood and energy check-ins.
- Energy heatmap showing energy patterns by time of day and day of week.
- Trigger cloud visualization highlighting frequent mood triggers.
- Check-in streak tracking to encourage consistent engagement.
- Recent check-in history with inline editing and deletion capabilities.

### Goal Management
- Create, update, and track wellness goals with progress visualization.
- Goal archiving and deletion with confirmation dialogs.
- Real-time progress calculations based on current and target values.

### AI Insights
- AI-generated insights categorized as patterns, recommendations, or alerts.
- Insight center with filtering by type and read/unread status.
- Dismissal workflow to mark insights as reviewed.

### Journaling
- Dedicated journaling page for reflective writing at `/journal`.
- Save journal entries with automatic timestamp and date tracking.
- View recent journal entries (last 20) with date and time information.
- Private entries stored securely with RLS policies.

### Feedback System
- User feedback mechanism (helpful/not helpful) on empathy recommendations.
- Feedback data stored for continuous improvement of recommendation accuracy.
- Analytics endpoint to track feedback statistics by mood and overall helpfulness.

### Professional Support
- Directory of mental health professionals with specialty, location, and availability information.
- Contact and messaging functionality to connect with professionals.
- Profile pages with detailed bio, experience, and language capabilities.

## Architecture

### Technology Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Data Visualization**: Recharts for trend charts and heatmaps
- **Backend**: Next.js API routes with server-side rendering
- **Database**: Supabase (PostgreSQL) with row-level security policies
- **Authentication**: NextAuth.js with credentials provider backed by Supabase Auth
- **AI Services**: OpenAI for empathy generation, mood analysis, and content recommendations
- **External APIs**: Spotify (music), Foursquare (places), Amazon (books)

### Data Layer
- Supabase database with comprehensive schema including profiles, mood entries, wellness goals, AI insights, journal entries, and feedback tracking.
- Row-level security (RLS) policies ensuring users can only access their own data.
- Database functions and triggers for automated profile creation, timestamp updates, and transactional data processing.
- Aggregated analytics views for trigger frequency, coping effectiveness, and energy patterns.
- Stored procedure `process_onboarding_check_in` for atomic persistence of onboarding responses and mood entries.

### Key Directories
```
app/
├── api/                      # Next.js API routes
│   ├── analyze/             # Text, voice, and image analysis endpoints
│   ├── empathy-feedback/    # Feedback collection and statistics
│   ├── empathy-recommendations/  # AI-driven recommendation generation
│   ├── journal/             # Journal entry CRUD operations
│   ├── mood-entries/        # Mood entry management
│   ├── onboarding/          # Onboarding check-in persistence
│   ├── professionals/       # Professional directory and messaging
│   ├── wellness-goals/      # Goal CRUD operations
│   ├── wellness-snapshot/   # Consolidated dashboard data feed
│   └── *-recommendation/    # Music, book, quote, place recommendations
├── auth/                    # Authentication pages (signin, signup, error)
├── journal/                 # Journaling interface
├── onboarding/              # Onboarding wizard and results dashboard
├── professionals/           # Professional directory
├── profile/                 # User profile management
└── settings/                # User preferences and settings

components/
├── check-in/                # Empathy recommendations and feedback UI
├── dashboard/               # Dashboard visualizations and management dialogs
├── insights/                # AI insight display components
├── layout/                  # Header, footer, and layout components
├── onboarding/              # Onboarding conversation interface
└── ui/                      # shadcn/ui base components

lib/
├── analytics.ts             # Data transformation utilities
├── auth.ts                  # NextAuth configuration
├── empathy-agent.ts         # Empathy response generation logic
├── mcp-tools.ts             # MCP tool integrations
├── supabase/                # Supabase client utilities
└── utils.ts                 # General utility functions

supabase/
└── schema.sql               # Complete database schema with tables, indexes, RLS policies, functions, triggers, and views
```

## Environment Configuration

### Required Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# AI and Content Services
OPENAI_API_KEY=your-openai-api-key
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Optional Services
FOURSQUARE_API_KEY=your-foursquare-api-key
```

### Security Notes
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client; it is used only in server-side contexts (API routes).
- `NEXT_PUBLIC_*` variables are safe for client-side use and follow Next.js conventions.
- All authentication operations use the public anon key with RLS policies enforcing access control.

## Local Development

### Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
```

### Database Setup
1. Create a new Supabase project at https://supabase.com
2. Navigate to SQL Editor in Supabase dashboard
3. Execute `supabase/schema.sql` to create all tables, policies, functions, and views
4. Verify that RLS is enabled on all tables

### Run Development Server
```bash
npm run dev
```
Access the application at http://localhost:3000

### Complete Initial Onboarding
1. Navigate to http://localhost:3000/auth/signup to create an account
2. Complete the onboarding flow at http://localhost:3000/onboarding
3. View your personalized dashboard, AI insights, and recommendations

## Quality Assurance

### Linting
```bash
npm run lint
```
Runs ESLint with Next.js configuration to catch code quality issues.

### Testing
```bash
npm run test
```
Executes Node.js test runner covering analytics utility functions in `tests/analytics.test.ts`.

### Build Verification
```bash
npm run build
```
Produces optimized production build. Verifies TypeScript compilation, component rendering, and API route bundling.

## API Reference

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/[...nextauth]` - NextAuth authentication endpoints
- `POST /api/auth/resend-confirmation` - Resend email confirmation

### Onboarding and Mood Tracking
- `POST /api/onboarding/check-in` - Persist onboarding responses and mood entry via database RPC
- `GET /api/wellness-snapshot` - Retrieve comprehensive user wellness data including mood entries, goals, triggers, coping strategies, and energy patterns
- `PATCH /api/mood-entries/:id` - Update existing mood entry
- `DELETE /api/mood-entries/:id` - Remove mood entry

### Analysis Endpoints
- `POST /api/analyze/text` - Analyze text input for mood and emotions
- `POST /api/analyze/voice` - Transcribe and analyze voice recording
- `POST /api/analyze/image` - Analyze image for mood indicators

### Wellness Goals
- `GET /api/wellness-goals` - List user's wellness goals
- `POST /api/wellness-goals` - Create new wellness goal
- `PATCH /api/wellness-goals/:id` - Update goal progress or details
- `DELETE /api/wellness-goals/:id` - Remove wellness goal

### AI Insights
- `PATCH /api/ai-insights/:id` - Mark insight as read/reviewed

### Empathy and Recommendations
- `POST /api/empathy-recommendations` - Generate AI-driven empathy response with personalized recommendations
- `POST /api/empathy-feedback` - Submit feedback on recommendation helpfulness
- `GET /api/empathy-feedback` - Retrieve feedback statistics for analytics
- `POST /api/music-recommendation` - Get Spotify playlist for detected mood
- `POST /api/book-recommendation` - Get book suggestion from Amazon
- `POST /api/quote-recommendation` - Get inspirational quote via OpenAI
- `POST /api/place-recommendation` - Get nearby wellness location via Foursquare

### Journaling
- `GET /api/journal` - Retrieve recent journal entries (last 20)
- `POST /api/journal` - Save new journal entry

### Professionals
- `GET /api/professionals` - List available mental health professionals
- `POST /api/professionals/contact-message` - Send initial contact message
- `GET /api/professionals/:id/messages` - Retrieve conversation history
- `POST /api/professionals/:id/messages` - Send message to professional

### User Management
- `GET /api/profile` - Retrieve user profile
- `PATCH /api/profile` - Update profile information
- `GET /api/settings` - Get user preferences
- `PATCH /api/settings` - Update user preferences

## Deployment

### Vercel Deployment
This application is optimized for Vercel deployment:

1. **Connect Repository**: Import project from GitHub in Vercel dashboard
2. **Configure Environment Variables**: Add all required environment variables in Vercel project settings
3. **Database Migration**: Execute `supabase/schema.sql` in production Supabase instance before first deployment
4. **Deploy**: Vercel automatically runs `npm run build` and deploys

### Environment Variable Security
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is not exposed to client bundles
- All server-only variables should be accessed only in API routes or server components
- Use Vercel's environment variable encryption for sensitive credentials

### Database Considerations
- Apply schema changes via Supabase SQL Editor or CLI migrations
- Ensure RLS policies are enabled on all tables before production use
- Test RLS policies with different user roles to verify access control
- Consider creating database backups before schema modifications

### Monitoring and Observability
- Vercel Analytics is integrated via `Analytics` component in app layout
- Consider adding Sentry for error tracking in production
- Monitor Supabase dashboard for database performance and query patterns
- Review API route logs in Vercel dashboard for debugging

## Extending the Application

### Adding New Features
1. Create new API routes in `app/api/` for backend logic
2. Add corresponding UI components in `components/`
3. Update database schema in `supabase/schema.sql` if new tables are needed
4. Add RLS policies for any new tables to ensure data security
5. Update this README with new API endpoints and features

### Custom Analytics
- Extend `lib/analytics.ts` with new data transformation functions
- Add tests in `tests/analytics.test.ts` to verify calculations
- Update dashboard components to visualize new metrics

### AI Model Improvements
- Modify `lib/empathy-agent.ts` to adjust empathy generation prompts
- Update feedback collection in `app/api/empathy-feedback/route.ts`
- Use collected feedback data to fine-tune recommendation accuracy

## License
This project is private and proprietary. All rights reserved.

## Support
For questions, bug reports, or feature requests, please contact the development team or create an issue in the project repository.

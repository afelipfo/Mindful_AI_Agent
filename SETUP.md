# Mindful AI Agent - Setup Guide

## Step 1: Database Setup (Supabase)

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Fill in:
   - **Name**: Mindful AI Agent (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
4. Click "Create new project" (takes ~2 minutes)

### 1.2 Run the Database Schema

1. In your Supabase project, go to the **SQL Editor** (left sidebar)
2. Click "New Query"
3. Copy the entire contents of `/supabase/schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" (bottom right)
6. You should see "Success. No rows returned"

### 1.3 Get Your API Keys

1. Go to **Project Settings** → **API** (left sidebar)
2. Copy these values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal") → This is your `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANT**: The `service_role` key is sensitive. Never commit it to git or expose it client-side.

---

## Step 2: Environment Variables

### 2.1 Create .env.local file

In the project root, create a file named `.env.local`:

```bash
cp .env.example .env.local
```

### 2.2 Fill in Required Variables

Open `.env.local` and add your Supabase credentials:

```env
# Supabase (from Step 1.3)
NEXT_PUBLIC_SUPABASE_URL=your_actual_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_string_here
```

### 2.3 Generate NEXTAUTH_SECRET

Run this command to generate a secure random string:

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET`.

---

## Step 3: Optional - Google OAuth

If you want "Sign in with Google" functionality:

### 3.1 Create Google OAuth Credentials

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local dev)
   - `https://yourdomain.vercel.app/api/auth/callback/google` (for production)
7. Copy **Client ID** and **Client Secret**

### 3.2 Add to .env.local

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## Step 4: Install Dependencies & Run

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Step 5: Test Authentication

1. Go to [http://localhost:3000](http://localhost:3000)
2. Click "Get Started"
3. You should be redirected to the sign-in page (since /onboarding is protected)
4. Click "Sign up" and create an account
5. After signup, you should be automatically signed in and redirected to `/onboarding`

---

## Verification Checklist

✅ Supabase project created
✅ Database schema executed successfully
✅ All 3 Supabase API keys added to `.env.local`
✅ NEXTAUTH_SECRET generated and added
✅ `pnpm install` completed without errors
✅ `pnpm dev` runs successfully
✅ Can create account on signup page
✅ Can sign in with email/password
✅ Protected routes redirect to signin when not authenticated

---

## Troubleshooting

### "Invalid API key" error
- Double-check your Supabase keys in `.env.local`
- Make sure you copied the full key (they're very long)
- Restart the dev server (`pnpm dev`)

### "Supabase client error"
- Verify the database schema was executed successfully
- Check the Supabase dashboard for any errors in the logs

### "NextAuth error"
- Make sure `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your local URL

### Sign up fails
- Check Supabase logs in the dashboard
- Verify email format is correct
- Ensure password is at least 8 characters

---

## Next Steps

Once authentication is working:
- Continue to Step 2: Implementing data persistence API routes
- Set up file upload for audio/photos
- Configure external APIs (OpenAI, Spotify, etc.)

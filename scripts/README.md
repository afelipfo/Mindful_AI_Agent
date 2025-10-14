# Database Management Scripts

## Reset Authentication State

The `reset-auth.js` script completely resets the Supabase authentication state and clears all user data.

### ⚠️ WARNING

This script will **permanently delete** all user data including:
- All authenticated users
- Profile records
- Onboarding responses
- Mood entries
- Wellness goals
- AI insights

### Usage

```bash
# Install dependencies first
pnpm install

# Run the reset script
node scripts/reset-auth.js
```

The script will:
1. List all current users
2. Give you 5 seconds to cancel (Ctrl+C)
3. Delete all users from Supabase Auth
4. Clear all data from related tables
5. Provide a summary of what was deleted

### When to Use

Use this script when:
- You want to start with a completely clean authentication state
- There are "ghost" users that can sign in but aren't properly in the database
- You need to reset the entire user ecosystem for testing

### Environment Variables Required

Make sure your `.env.local` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### After Reset

After running the reset:
- No users will be able to sign in
- All user data will be cleared
- New registrations will require email confirmation
- The application will have a clean slate

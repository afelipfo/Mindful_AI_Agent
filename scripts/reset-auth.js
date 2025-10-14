#!/usr/bin/env node

/**
 * Reset Supabase Authentication State
 *
 * This script resets the authentication state by:
 * 1. Deleting all users from Supabase Auth
 * 2. Clearing all profile records
 * 3. Clearing all related data tables
 *
 * WARNING: This will delete ALL user data. Use with caution!
 *
 * Usage: node scripts/reset-auth.js
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetAuthState() {
  console.log('🚨 WARNING: This will delete ALL user data!')
  console.log('Press Ctrl+C within 5 seconds to cancel...')

  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000))

  try {
    console.log('🧹 Starting authentication state reset...')

    // Get all users
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }

    console.log(`📋 Found ${users.users.length} users`)

    // Delete all users
    for (const user of users.users) {
      console.log(`🗑️  Deleting user: ${user.email} (${user.id})`)

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

      if (deleteError) {
        console.error(`❌ Error deleting user ${user.email}:`, deleteError.message)
      } else {
        console.log(`✅ Deleted user: ${user.email}`)
      }
    }

    // Clear all profile records
    console.log('🧹 Clearing profile records...')
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (profileError) {
      console.error('❌ Error clearing profiles:', profileError.message)
    } else {
      console.log('✅ Cleared all profile records')
    }

    // Clear onboarding responses
    console.log('🧹 Clearing onboarding responses...')
    const { error: onboardingError } = await supabase
      .from('onboarding_responses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (onboardingError) {
      console.error('❌ Error clearing onboarding responses:', onboardingError.message)
    } else {
      console.log('✅ Cleared all onboarding responses')
    }

    // Clear mood entries
    console.log('🧹 Clearing mood entries...')
    const { error: moodError } = await supabase
      .from('mood_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (moodError) {
      console.error('❌ Error clearing mood entries:', moodError.message)
    } else {
      console.log('✅ Cleared all mood entries')
    }

    // Clear wellness goals
    console.log('🧹 Clearing wellness goals...')
    const { error: goalsError } = await supabase
      .from('wellness_goals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (goalsError) {
      console.error('❌ Error clearing wellness goals:', goalsError.message)
    } else {
      console.log('✅ Cleared all wellness goals')
    }

    // Clear AI insights
    console.log('🧹 Clearing AI insights...')
    const { error: insightsError } = await supabase
      .from('ai_insights')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (insightsError) {
      console.error('❌ Error clearing AI insights:', insightsError.message)
    } else {
      console.log('✅ Cleared all AI insights')
    }

    console.log('')
    console.log('🎉 Authentication state reset complete!')
    console.log('📝 Summary:')
    console.log(`   - Deleted ${users.users.length} users`)
    console.log('   - Cleared all profile records')
    console.log('   - Cleared all onboarding responses')
    console.log('   - Cleared all mood entries')
    console.log('   - Cleared all wellness goals')
    console.log('   - Cleared all AI insights')
    console.log('')
    console.log('🔄 The application now has a clean authentication state.')
    console.log('📧 New users will need to confirm their email addresses.')

  } catch (error) {
    console.error('❌ Unexpected error during reset:', error)
    process.exit(1)
  }
}

// Run the reset if this script is executed directly
if (require.main === module) {
  resetAuthState()
}

module.exports = { resetAuthState }

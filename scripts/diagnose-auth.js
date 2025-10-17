const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=')
        }
      }
    })

    // Set environment variables
    Object.keys(envVars).forEach(key => {
      process.env[key] = envVars[key]
    })

    console.log('✅ Environment variables loaded from .env.local')
  } else {
    console.log('❌ .env.local file not found')
  }
}

// This script helps diagnose authentication issues
async function diagnoseAuth() {
  console.log('🔍 Diagnosing authentication configuration...\n')

  // Load environment variables
  loadEnv()

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const nextauthSecret = process.env.NEXTAUTH_SECRET
  const nextauthUrl = process.env.NEXTAUTH_URL

  console.log('📋 Environment Variables:')
  console.log('NEXT_PUBLIC_SUPABASE_URL: ' + (supabaseUrl ? '✅ Set' : '❌ Missing'))
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY: ' + (supabaseAnonKey ? '✅ Set' : '❌ Missing'))
  console.log('SUPABASE_SERVICE_ROLE_KEY: ' + (supabaseServiceKey ? '✅ Set' : '❌ Missing'))
  console.log('NEXTAUTH_SECRET: ' + (nextauthSecret ? '✅ Set' : '❌ Missing'))
  console.log('NEXTAUTH_URL: ' + (nextauthUrl ? '✅ Set' : '❌ Missing') + '\n')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Supabase configuration incomplete. Cannot continue with diagnosis.')
    return
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('🔗 Testing Supabase connection...')

    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (healthError) {
      console.log('❌ Supabase connection failed:', healthError.message)
    } else {
      console.log('✅ Supabase connection successful')
    }

    // Check user existence
    const userEmail = 'afelipeflorezo@gmail.com'
    console.log('\n👤 Checking user: ' + userEmail)

    try {
      // First, try to sign in to check if user exists and credentials are correct
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: 'Mindful1996'
      })

      if (signInError) {
        console.log('❌ Sign in failed:', signInError.message)

        // Check if user exists but email not confirmed
        if (signInError.message.includes('Email not confirmed')) {
          console.log('⚠️  User exists but email is not confirmed')
        } else if (signInError.message.includes('Invalid login credentials')) {
          console.log('❌ Invalid credentials - user may not exist or password is incorrect')
        }
      } else if (signInData.user) {
        console.log('✅ User exists and credentials are correct')
        console.log('📧 Email confirmed: ' + (signInData.user.email_confirmed_at ? '✅ Yes' : '❌ No'))
        console.log('🆔 User ID: ' + signInData.user.id)
        console.log('📅 Created: ' + signInData.user.created_at)
      }

      // Sign out after test
      await supabase.auth.signOut()

    } catch (error) {
      console.log('❌ Error during authentication test:', error)
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error)
  }
}

// Run diagnosis
diagnoseAuth().catch(console.error)

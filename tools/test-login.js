// Test login functionality
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
  }
}

async function testLogin() {
  console.log('🔐 Testing login functionality...\n')

  // Load environment variables
  loadEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Supabase configuration missing')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const email = 'afelipeflorezo@gmail.com'
  const password = 'Mindful1996'

  console.log('Attempting login with:')
  console.log('Email: ' + email)
  console.log('Password: ***\n')

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.log('❌ Login failed:')
      console.log('Error message: ' + error.message)
      console.log('Error details:', error)
    } else {
      console.log('✅ Login successful!')
      console.log('User ID: ' + data.user.id)
      console.log('Email confirmed: ' + (data.user.email_confirmed_at ? 'Yes' : 'No'))
      console.log('Session created: ' + (data.session ? 'Yes' : 'No'))

      if (data.session) {
        console.log('Access token exists: ' + (data.session.access_token ? 'Yes' : 'No'))
        console.log('Refresh token exists: ' + (data.session.refresh_token ? 'Yes' : 'No'))
      }
    }

    // Clean up
    await supabase.auth.signOut()

  } catch (error) {
    console.log('❌ Unexpected error during login test:', error)
  }
}

testLogin().catch(console.error)

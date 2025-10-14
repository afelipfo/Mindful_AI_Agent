import { NextAuthOptions } from 'next-auth'
import { SupabaseAdapter } from '@auth/supabase-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client if environment variables are available
const createSupabaseClient = () => {
  console.log("Creating Supabase client with env vars:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "present" : "missing",
    anonKey: process.env.SUPABASE_ANON_KEY ? "present" : "missing",
  })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error("Supabase environment variables missing")
    return null
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

const supabase = createSupabaseClient()

export const authOptions: NextAuthOptions = {
  adapter: (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    ? SupabaseAdapter({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        secret: process.env.SUPABASE_ANON_KEY,
      })
    : undefined,
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('Credentials provider called with:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password
        })

        if (!credentials?.email || !credentials?.password) {
          console.error('Missing email or password')
          throw new Error('Email and password required')
        }

        if (!supabase) {
          console.error('Supabase client not available')
          throw new Error('Authentication not configured')
        }

        try {
          console.log('Attempting Supabase sign in...')
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          console.log('Supabase response:', { hasData: !!data, hasUser: !!data?.user, error: error?.message })

          if (error || !data.user) {
            console.error('Supabase auth error:', error)
            throw new Error(error?.message || 'Invalid credentials')
          }

          console.log('Supabase auth successful for user:', data.user.email)

          const user = {
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata?.full_name || data.user.email!.split('@')[0],
            image: data.user.user_metadata?.avatar_url,
          }

          console.log('Returning user object:', user)
          return user
        } catch (error) {
          console.error('Credentials provider error:', error)
          throw error
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

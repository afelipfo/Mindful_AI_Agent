import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { signupSchema } from '@/lib/validations/auth'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // Check for environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Supabase configuration missing. Please check environment variables.' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const body = await request.json()

    // Validate input
    const validatedData = signupSchema.parse(body)
    const { email, password, fullName } = validatedData

    // Create user in Supabase Auth with email confirmation required
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        full_name: fullName || '',
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Manually create profile record to ensure it's created immediately
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        full_name: fullName || null,
        onboarding_completed: false,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the signup if profile creation fails, but log it
    }

    // Send confirmation email
    const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName || '',
      },
      redirectTo: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/signin?message=email-confirmed`,
    })

    if (emailError) {
      console.error('Email confirmation error:', emailError)
      // Don't fail signup if email fails, but log it
    }

    return NextResponse.json(
      {
        message: 'User created successfully. Please check your email to confirm your account.',
        user: {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: false,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    )
  }
}

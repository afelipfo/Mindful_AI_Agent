import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { withRateLimit } from '@/lib/api-middleware'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Apply rate limiting (Upload tier - 3 requests per minute)
    const rateLimitResult = await withRateLimit(request, 'upload', session.user.id)
    if (rateLimitResult) {
      return rateLimitResult
    }

    // Get the file from form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileType = file.type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/wav', 'audio/webm', 'audio/mp3', 'audio/mpeg']

    if (!validTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and audio files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const userId = session.user.id
    const filename = `${userId}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
      size: file.size,
      type: fileType,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

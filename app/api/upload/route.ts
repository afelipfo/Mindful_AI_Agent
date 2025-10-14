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

    // Try to upload to Vercel Blob, fallback to local storage for development
    let uploadResult: { url: string; filename: string }

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false,
      })
      uploadResult = {
        url: blob.url,
        filename: blob.pathname,
      }
    } else {
      // Fallback for local development - store as data URL
      console.warn('BLOB_READ_WRITE_TOKEN not configured, using local storage fallback')

      // For local development, we'll store files as base64 data URLs
      // This is not suitable for production but works for development
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const dataUrl = `data:${fileType};base64,${base64}`

      uploadResult = {
        url: dataUrl,
        filename: filename,
      }
    }

    return NextResponse.json({
      url: uploadResult.url,
      filename: uploadResult.filename,
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

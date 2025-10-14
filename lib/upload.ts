/**
 * Upload a file to the server
 * @param file - File or Blob to upload
 * @param filename - Optional filename (will be auto-generated if not provided)
 * @returns Upload response with URL
 */
export async function uploadFile(
  file: File | Blob,
  filename?: string
): Promise<{ url: string; filename: string; size: number; type: string }> {
  const formData = new FormData()

  // If it's a Blob, convert to File
  if (file instanceof Blob && !(file instanceof File)) {
    const actualFilename = filename || `recording-${Date.now()}.wav`
    formData.append('file', new File([file], actualFilename, { type: file.type }))
  } else {
    formData.append('file', file)
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload file')
  }

  return response.json()
}

/**
 * Upload audio blob
 */
export async function uploadAudio(audioBlob: Blob): Promise<string> {
  const result = await uploadFile(audioBlob, `audio-${Date.now()}.wav`)
  return result.url
}

/**
 * Upload image file
 */
export async function uploadImage(imageFile: File): Promise<string> {
  const result = await uploadFile(imageFile)
  return result.url
}

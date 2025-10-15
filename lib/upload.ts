type UploadResponse = { url: string; filename: string; size: number; type: string }

const FALLBACK_TYPE = "application/octet-stream"

async function encodeAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Unable to encode file"))
      }
    }
    reader.onerror = () => reject(new Error("Unable to encode file"))
    reader.readAsDataURL(file)
  })
}

async function inlineFallback(file: File): Promise<UploadResponse> {
  const dataUrl = await encodeAsDataUrl(file)
  return {
    url: dataUrl,
    filename: file.name || `upload-${Date.now()}`,
    size: file.size,
    type: file.type || FALLBACK_TYPE,
  }
}

function normalizeFile(input: File | Blob, filename?: string): File {
  if (input instanceof File) {
    return input
  }

  const safeType = input.type || FALLBACK_TYPE
  const extension = safeType.includes("/")
    ? safeType.split("/")[1]?.split(";")[0] || "bin"
    : "bin"
  const baseName = safeType.startsWith("audio/")
    ? "recording"
    : safeType.startsWith("image/")
      ? "snapshot"
      : "upload"
  const safeName = filename || `${baseName}-${Date.now()}.${extension}`

  return new File([input], safeName, { type: safeType })
}

/**
 * Upload a file to the server
 * @param file - File or Blob to upload
 * @param filename - Optional filename (will be auto-generated if not provided)
 * @returns Upload response with URL
 */
export async function uploadFile(
  file: File | Blob,
  filename?: string
): Promise<UploadResponse> {
  const normalized = normalizeFile(file, filename)
  const formData = new FormData()
  formData.append("file", normalized)

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      if (typeof window !== "undefined") {
        return inlineFallback(normalized)
      }
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || "Failed to upload file")
    }

    return response.json()
  } catch (error) {
    if (typeof window !== "undefined") {
      return inlineFallback(normalized)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to upload file")
  }
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

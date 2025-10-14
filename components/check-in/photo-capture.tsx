"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface PhotoCaptureProps {
  onPhotoCapture?: (file: File) => void
}

export function PhotoCapture({ onPhotoCapture }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      onPhotoCapture?.(file)
    }
  }

  const clearPhoto = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {preview ? (
        <div className="relative w-full max-w-md">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-border">
            <Image src={preview || "/placeholder.svg"} alt="Captured photo" fill className="object-cover" />
          </div>
          <Button
            onClick={clearPhoto}
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30">
            <Camera className="h-12 w-12 text-text-muted" />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>
          <p className="text-sm text-text-secondary text-center">
            Optional: Upload a photo to capture your current state
          </p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload photo"
      />
    </div>
  )
}

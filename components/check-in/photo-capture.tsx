"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, Upload, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface PhotoCaptureProps {
  onPhotoCapture?: (file: File) => void
  onSend?: (file: File) => void
}

export function PhotoCapture({ onPhotoCapture, onSend }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setCapturedFile(file)
      onPhotoCapture?.(file)
    }
  }

  const clearPhoto = () => {
    setPreview(null)
    setCapturedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ""
    }
  }

  const handleSendPhoto = () => {
    if (capturedFile) {
      onSend?.(capturedFile)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {preview ? (
        <div className="flex flex-col items-center gap-4 w-full">
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
          <Button onClick={handleSendPhoto} className="w-full max-w-md">
            <Send className="h-4 w-4 mr-2" />
            Send Photo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30">
            <Camera className="h-12 w-12 text-text-muted" />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => cameraInputRef.current?.click()} variant="outline">
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>
          <p className="text-sm text-text-secondary text-center">
            Optional: Take or upload a photo to capture your current state
          </p>
        </div>
      )}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Take photo with camera"
      />
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

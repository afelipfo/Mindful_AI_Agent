"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
  const [isMobile, setIsMobile] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    // Detect if device supports camera capture
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(isMobileDevice)

    // Check for camera availability
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => setHasCamera(true))
        .catch(() => setHasCamera(false))
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      })
      setStream(mediaStream)
      setIsCameraActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      // Fallback to file input
      cameraInputRef.current?.click()
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
            handleFileChange(file)
          }
        }, 'image/jpeg', 0.8)

        stopCamera()
      }
    }
  }

  const handleFileChange = (fileOrEvent: File | React.ChangeEvent<HTMLInputElement>) => {
    let file: File

    if (fileOrEvent instanceof File) {
      file = fileOrEvent
    } else {
      const eventFile = fileOrEvent.target.files?.[0]
      if (!eventFile) return
      file = eventFile
    }

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setCapturedFile(file)
      onPhotoCapture?.(file)

      // Reset file inputs
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }


  const clearPhoto = () => {
    setPreview(null)
    setCapturedFile(null)
    stopCamera() // Also stop camera if active
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
      {isCameraActive ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="relative w-full max-w-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-square object-cover rounded-xl border-2 border-border"
            />
            <canvas ref={canvasRef} className="hidden" />
            <Button
              onClick={stopCamera}
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2"
              aria-label="Cancel camera"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={capturePhoto} className="w-full max-w-md">
            <Camera className="h-4 w-4 mr-2" />
            Capture Photo
          </Button>
        </div>
      ) : preview ? (
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
            {hasCamera && (
              <Button onClick={startCamera} variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            )}
            {!hasCamera && isMobile && (
              <Button onClick={() => cameraInputRef.current?.click()} variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            )}
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              {isMobile ? 'Upload Photo' : 'Select Photo'}
            </Button>
          </div>
          <p className="text-sm text-text-secondary text-center">
            Optional: Take or upload a photo to capture your current state
          </p>
        </div>
      )}
      {isMobile && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Take photo with camera"
        />
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

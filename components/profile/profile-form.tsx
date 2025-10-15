"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { uploadImage } from "@/lib/upload"
import { cn } from "@/lib/utils"

interface ProfileFormProps {
  initialProfile: {
    email: string
    fullName: string
    avatarUrl: string | null
    bio: string
  }
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [fullName, setFullName] = useState(initialProfile.fullName ?? "")
  const [bio, setBio] = useState(initialProfile.bio ?? "")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile.avatarUrl ?? null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false)
  const [isPending, startTransition] = useTransition()

  const initials = fullName
    ? fullName
        .split(" ")
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : initialProfile.email.charAt(0).toUpperCase()

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploadingAvatar(true)
      const url = await uploadImage(file)
      setAvatarUrl(url)
      toast({
        title: "Avatar updated",
        description: "Your new profile photo is ready.",
      })
    } catch (error) {
      console.error("[mindful-ai] avatar upload failed:", error)
      toast({
        title: "Upload failed",
        description: "We couldn't upload that image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
      event.target.value = ""
    }
  }

  const handleAvatarRemove = () => {
    if (!avatarUrl) return
    setIsRemovingAvatar(true)
    setAvatarUrl(null)
    setIsRemovingAvatar(false)
    toast({
      title: "Avatar removed",
      description: "Save changes to confirm the update.",
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            bio,
            avatarUrl: avatarUrl ?? "",
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || "Unable to save profile")
        }

        toast({
          title: "Profile updated",
          description: "Your profile details were saved successfully.",
        })

        router.refresh()
      } catch (error) {
        console.error("[mindful-ai] profile update failed:", error)
        toast({
          title: "Update failed",
          description:
            error instanceof Error ? error.message : "We couldn't save your profile right now. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  const isSaving = isPending || isUploadingAvatar || isRemovingAvatar

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-muted/40">
            <Avatar className="h-24 w-24">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={fullName || initialProfile.email} />
              ) : (
                <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
              )}
            </Avatar>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Profile photo</p>
              <p className="text-xs text-text-muted">Use a square image under 2MB for best results.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" disabled={isUploadingAvatar} asChild>
                <label className={cn("cursor-pointer", isUploadingAvatar && "pointer-events-none opacity-60")}>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  {isUploadingAvatar ? "Uploading…" : "Upload photo"}
                </label>
              </Button>
              <Button type="button" variant="ghost" onClick={handleAvatarRemove} disabled={!avatarUrl || isSaving}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="How should we call you?"
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={initialProfile.email} disabled />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">About you</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Share a short bio or the intention behind your wellness journey."
              maxLength={500}
              rows={4}
            />
            <p className="text-xs text-text-muted text-right">{bio.length}/500</p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  )
}

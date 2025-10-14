"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Brain, MessageSquare, Mic, Smile, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextJournal } from "@/components/check-in/text-journal"
import { VoiceRecorder } from "@/components/check-in/voice-recorder"
import { EmojiSelector } from "@/components/check-in/emoji-selector"
import { PhotoCapture } from "@/components/check-in/photo-capture"
import { cn } from "@/lib/utils"
import { uploadAudio, uploadImage } from "@/lib/upload"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  type?: "text" | "voice" | "emoji" | "photo"
  metadata?: {
    emoji?: string
    label?: string
    note?: string
  }
}

interface ConversationInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string, type?: "text" | "voice" | "emoji" | "photo", metadata?: any) => void
  placeholder?: string
  isLoading?: boolean
  enableMultimodal?: boolean
}

export function ConversationInterface({
  messages,
  onSendMessage,
  placeholder = "Type your response...",
  isLoading = false,
  enableMultimodal = false,
}: ConversationInterfaceProps) {
  const [input, setInput] = useState("")
  const [activeTab, setActiveTab] = useState("text")
  const [textJournalValue, setTextJournalValue] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim(), "text")
      setInput("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "56px"
      }
    }
  }

  const handleTextJournalSubmit = () => {
    if (textJournalValue.trim() && !isLoading) {
      onSendMessage(textJournalValue.trim(), "text")
      setTextJournalValue("")
    }
  }

  const handleVoiceComplete = (_audioBlob: Blob) => {
    // This is called when recording is stopped, but we don't send yet
  }

  const handleVoiceSend = async (audioBlob: Blob) => {
    try {
      setIsUploading(true)
      toast({
        title: "Uploading audio...",
        description: "Please wait while we process your recording",
      })

      const audioUrl = await uploadAudio(audioBlob)

      onSendMessage("Voice recording captured", "voice", { audioUrl })

      toast({
        title: "Audio uploaded",
        description: "Your voice recording has been saved",
      })
    } catch (error) {
      console.error("Failed to upload audio:", error)
      toast({
        title: "❌ Upload failed",
        description: "Failed to upload audio. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleEmojiSelect = (emoji: string, label: string, value: number, note?: string) => {
    const message = note ? `Feeling ${label}: ${note}` : `Feeling ${label}`
    onSendMessage(message, "emoji", { emoji, label, value, note })
  }

  const handlePhotoCapture = (_file: File) => {
    // This is called when photo is selected, but we don't send yet
  }

  const handlePhotoSend = async (file: File) => {
    try {
      setIsUploading(true)
      toast({
        title: "Uploading photo...",
        description: "Please wait while we process your image",
      })

      const photoUrl = await uploadImage(file)

      onSendMessage("Photo captured", "photo", { photoUrl })

      toast({
        title: "Photo uploaded",
        description: "Your photo has been saved",
      })
    } catch (error) {
      console.error("Failed to upload photo:", error)
      toast({
        title: "❌ Upload failed",
        description: "Failed to upload photo. Please try again.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize textarea
    e.target.style.height = "56px"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex gap-3 items-start", message.role === "user" && "flex-row-reverse")}>
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback
                className={message.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"}
              >
                {message.role === "assistant" ? <Brain className="h-5 w-5" /> : "You"}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-5 py-4 transition-all duration-300",
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border rounded-bl-sm",
              )}
            >
              {message.metadata?.emoji && <div className="text-3xl mb-2">{message.metadata.emoji}</div>}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 items-start">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Brain className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-5 py-4">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-text-muted animate-breathe" style={{ animationDelay: "0ms" }} />
                <div
                  className="h-2 w-2 rounded-full bg-text-muted animate-breathe"
                  style={{ animationDelay: "200ms" }}
                />
                <div
                  className="h-2 w-2 rounded-full bg-text-muted animate-breathe"
                  style={{ animationDelay: "400ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-border bg-background p-6">
        {enableMultimodal ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="text" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Text</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Voice</span>
              </TabsTrigger>
              <TabsTrigger value="emoji" className="gap-2">
                <Smile className="h-4 w-4" />
                <span className="hidden sm:inline">Emoji</span>
              </TabsTrigger>
              <TabsTrigger value="photo" className="gap-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Photo</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-0">
              <div className="space-y-3">
                <TextJournal value={textJournalValue} onChange={setTextJournalValue} onSubmit={handleTextJournalSubmit} />
                <Button
                  onClick={handleTextJournalSubmit}
                  disabled={!textJournalValue.trim() || isLoading}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Response
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="voice" className="mt-0">
              <VoiceRecorder onRecordingComplete={handleVoiceComplete} onSend={handleVoiceSend} />
            </TabsContent>

            <TabsContent value="emoji" className="mt-0">
              <EmojiSelector onSelect={handleEmojiSelect} />
            </TabsContent>

            <TabsContent value="photo" className="mt-0">
              <PhotoCapture onPhotoCapture={handlePhotoCapture} onSend={handlePhotoSend} />
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[56px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0" disabled={!input.trim() || isLoading}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

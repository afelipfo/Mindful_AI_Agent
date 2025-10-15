"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Send, Brain } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ConversationMessage, MessageMetadata, MessageType } from "@/types/conversation"

interface ConversationInterfaceProps {
  messages: ConversationMessage[]
  onSendMessage: (message: string, type?: MessageType, metadata?: MessageMetadata) => void
  placeholder?: string
  isLoading?: boolean
}

export function ConversationInterface({
  messages,
  onSendMessage,
  placeholder = "Type your response...",
  isLoading = false,
}: ConversationInterfaceProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendCurrentInput = () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) {
      return
    }
    onSendMessage(trimmed, "text")
    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px"
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    sendCurrentInput()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      sendCurrentInput()
    }
  }

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
    event.target.style.height = "56px"
    event.target.style.height = `${Math.min(event.target.scrollHeight, 200)}px`
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-6 md:p-8">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex items-start gap-3", message.role === "user" && "flex-row-reverse")}>
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
                  ? "rounded-br-sm bg-primary text-primary-foreground"
                  : "rounded-bl-sm border border-border bg-card",
              )}
            >
              {message.metadata?.emoji && <div className="mb-2 text-3xl">{message.metadata.emoji}</div>}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

              {message.metadata?.transcript && (
                <p className="mt-2 text-xs italic text-primary-foreground/80 sm:text-text-secondary">
                  Transcript: {message.metadata.transcript}
                </p>
              )}

              {message.metadata?.summary && (
                <p className="mt-2 text-xs text-primary-foreground/80 sm:text-text-secondary">
                  Insight: {message.metadata.summary}
                </p>
              )}

              {(message.metadata?.audioUrl || message.metadata?.photoUrl) && (
                <div className="mt-3 space-y-3">
                  {message.metadata.audioUrl && <audio controls className="w-full" src={message.metadata.audioUrl} />}
                  {message.metadata.photoUrl && (
                    <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border">
                      <Image
                        src={message.metadata.photoUrl}
                        alt="Attached check-in snapshot"
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Brain className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="rounded-2xl rounded-bl-sm border border-border bg-card px-5 py-4">
              <div className="flex gap-1">
                <div className="h-2 w-2 animate-breathe rounded-full bg-text-muted" style={{ animationDelay: "0ms" }} />
                <div
                  className="h-2 w-2 animate-breathe rounded-full bg-text-muted"
                  style={{ animationDelay: "200ms" }}
                />
                <div
                  className="h-2 w-2 animate-breathe rounded-full bg-text-muted"
                  style={{ animationDelay: "400ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background p-6">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
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
      </div>
    </div>
  )
}

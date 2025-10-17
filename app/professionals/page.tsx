"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, MapPin, Phone, Mail, Languages, Clock, Sparkles, Copy, CheckCircle2, Send, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Professional {
  id: string
  name: string
  specialty: string
  location: string
  phone: string
  email: string
  photo: string
  bio: string
  experience: string
  languages: string[]
  availability: string
}

interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  isFromUser: boolean
}

export default function ProfessionalsPage() {
  const { status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState("")
  const [isCopied, setIsCopied] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Chat state
  const [showChat, setShowChat] = useState(false)
  const [chatProfessional, setChatProfessional] = useState<Professional | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin?callbackUrl=" + encodeURIComponent("/professionals"))
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") {
      loadProfessionals()
    }
  }, [status])

  const loadProfessionals = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/professionals")
      if (!response.ok) {
        throw new Error("Failed to load professionals")
      }
      const data = await response.json()
      setProfessionals(data.professionals || [])
    } catch (error) {
      console.error("[mindful-ai] Error loading professionals:", error)
      toast({
        title: "Unable to load professionals",
        description: "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async (professionalId: string) => {
    try {
      setIsLoadingMessages(true)
      const response = await fetch(`/api/professionals/${professionalId}/messages`)
      if (!response.ok) {
        throw new Error("Failed to load messages")
      }
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("[mindful-ai] Error loading messages:", error)
      toast({
        title: "Unable to load messages",
        description: "Please try again.",
      })
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatProfessional || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    try {
      const response = await fetch(`/api/professionals/${chatProfessional.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()
      setMessages((prev) => [...prev, data.message])

      // Poll for professional's response
      setTimeout(() => {
        loadMessages(chatProfessional.id)
      }, 2000)
    } catch (error) {
      console.error("[mindful-ai] Error sending message:", error)
      toast({
        title: "Failed to send message",
        description: "Please try again.",
      })
      setNewMessage(messageContent) // Restore message if failed
    } finally {
      setIsSending(false)
    }
  }

  const generateContactMessage = async (professional: Professional) => {
    try {
      setIsGenerating(true)
      const response = await fetch("/api/professionals/contact-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalName: professional.name,
          professionalSpecialty: professional.specialty,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate message")
      }

      const data = await response.json()
      setGeneratedMessage(data.message)
      setIsCopied(false)
    } catch (error) {
      console.error("[mindful-ai] Error generating message:", error)
      toast({
        title: "Unable to generate message",
        description: "Please try again.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleContactClick = async (professional: Professional) => {
    setSelectedProfessional(professional)
    setGeneratedMessage("")
    setIsCopied(false)
    await generateContactMessage(professional)
  }

  const handleChatClick = async (professional: Professional) => {
    setChatProfessional(professional)
    setShowChat(true)
    await loadMessages(professional.id)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedMessage)
      setIsCopied(true)
      toast({
        title: "Message copied",
        description: "You can now paste it in your email or messaging app.",
      })
      setTimeout(() => setIsCopied(false), 3000)
    } catch (error) {
      console.error("[mindful-ai] Error copying to clipboard:", error)
      toast({
        title: "Unable to copy",
        description: "Please try selecting and copying the text manually.",
      })
    }
  }

  const filteredProfessionals = professionals.filter(
    (prof) =>
      prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-sm text-text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>

          <h1 className="text-3xl font-semibold mb-2">Mental Health Professionals</h1>
          <p className="text-base text-text-muted">
            Connect with licensed professionals who can provide personalized support for your mental health journey.
          </p>
        </div>

        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search by name, specialty, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-text-muted">Loading professionals...</div>
          </div>
        ) : filteredProfessionals.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-text-muted">No professionals found matching your search.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfessionals.map((professional) => (
              <Card key={professional.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={professional.photo}
                    alt={professional.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{professional.name}</h3>
                    <p className="text-sm text-text-secondary">{professional.specialty}</p>
                    <Badge variant="outline" className="mt-1">
                      {professional.experience} experience
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-text-muted mb-4 line-clamp-3">{professional.bio}</p>

                <div className="space-y-2 text-sm text-text-muted mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{professional.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{professional.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{professional.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>{professional.availability}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 flex-shrink-0" />
                    <span>{professional.languages.join(", ")}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleContactClick(professional)}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Message
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleChatClick(professional)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Generate Message Dialog */}
      <Dialog open={!!selectedProfessional} onOpenChange={() => setSelectedProfessional(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact {selectedProfessional?.name}</DialogTitle>
            <DialogDescription>
              We've generated a personalized message to help you reach out. You can customize it or regenerate a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 animate-pulse text-primary" />
                  <span className="text-sm text-text-muted">Generating personalized message...</span>
                </div>
              </div>
            ) : generatedMessage ? (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <Textarea
                    value={generatedMessage}
                    onChange={(e) => setGeneratedMessage(e.target.value)}
                    className="min-h-[150px] resize-none border-0 bg-transparent focus-visible:ring-0"
                    placeholder="Your personalized message will appear here..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                    {isCopied ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Message
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => selectedProfessional && generateContactMessage(selectedProfessional)}
                    variant="outline"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Contact Information:</p>
                  <div className="space-y-1 text-sm text-text-muted">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${selectedProfessional?.email}`} className="hover:text-primary">
                        {selectedProfessional?.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${selectedProfessional?.phone}`} className="hover:text-primary">
                        {selectedProfessional?.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-sm text-text-muted">
                Unable to generate message. Please try again.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={showChat} onOpenChange={() => setShowChat(false)}>
        <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              {chatProfessional && (
                <>
                  <img
                    src={chatProfessional.photo}
                    alt={chatProfessional.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <DialogTitle>{chatProfessional.name}</DialogTitle>
                    <DialogDescription>{chatProfessional.specialty}</DialogDescription>
                  </div>
                </>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-sm text-text-muted">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-text-muted" />
                  <p className="text-sm text-text-muted">No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        message.isFromUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-text-primary"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.isFromUser ? "text-primary-foreground/70" : "text-text-muted"}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          <div className="px-6 py-4 border-t">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Type your message..."
                disabled={isSending}
              />
              <Button onClick={sendMessage} disabled={!newMessage.trim() || isSending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export type MessageType = "text" | "voice" | "emoji" | "photo"

export interface MessageMetadata {
  emoji?: string
  label?: string
  note?: string
  value?: number
  audioUrl?: string
  photoUrl?: string
  energy?: number
  [key: string]: unknown
}

export interface ConversationMessage {
  id: string
  role: "user" | "assistant"
  content: string
  type?: MessageType
  metadata?: MessageMetadata
}

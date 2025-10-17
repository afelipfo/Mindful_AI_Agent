import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { ConversationMessage, MessageMetadata, MessageType } from "@/types/conversation"

type FlowState = "collecting" | "processing" | "completed"

interface OnboardingQuestion {
  question: string
  placeholder: string
}

interface UseOnboardingFlowOptions {
  questions: OnboardingQuestion[]
  stepTitles: string[]
  onComplete: (params: {
    conversation: ConversationMessage[]
    responsesByStep: Record<number, ConversationMessage>
    latestUserMessage: ConversationMessage | undefined
  }) => Promise<void> | void
}

const createMessageId = () => crypto.randomUUID?.() ?? Date.now().toString()

export function useOnboardingFlow({
  questions,
  stepTitles,
  onComplete,
}: UseOnboardingFlowOptions) {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [flowState, setFlowState] = useState<FlowState>("collecting")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [responsesByStep, setResponsesByStep] = useState<Record<number, ConversationMessage>>({})

  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current || questions.length === 0) {
      return
    }
    const initialMessage: ConversationMessage = {
      id: createMessageId(),
      role: "assistant",
      content: questions[0].question,
    }
    setMessages([initialMessage])
    initializedRef.current = true
  }, [questions, messages.length])

  const steps = useMemo(
    () =>
      stepTitles.map((title, index) => {
        if (flowState === "completed") {
          return { id: index + 1, title, status: "completed" as const }
        }
        if (index < currentStepIndex) {
          return { id: index + 1, title, status: "completed" as const }
        }
        if (index === currentStepIndex) {
          return { id: index + 1, title, status: "active" as const }
        }
        return { id: index + 1, title, status: "upcoming" as const }
      }),
    [currentStepIndex, flowState, stepTitles],
  )

  const appendAssistantPrompt = useCallback(
    (prompt: string) => {
      const assistantMessage: ConversationMessage = {
        id: createMessageId(),
        role: "assistant",
        content: prompt,
      }
      setMessages((prev) => [...prev, assistantMessage])
    },
    [],
  )

  const resetFlow = useCallback(() => {
    setMessages([])
    setFlowState("collecting")
    setCurrentStepIndex(0)
    setIsProcessing(false)
    setResponsesByStep({})
    initializedRef.current = false
  }, [])

  const handleUserMessage = useCallback(
    async (content: string, type?: MessageType, metadata?: MessageMetadata) => {
      if (flowState === "processing") {
        return
      }

      const trimmed = content.trim()
      if (!trimmed) {
        return
      }

      const userMessage: ConversationMessage = {
        id: createMessageId(),
        role: "user",
        content: trimmed,
        type,
        metadata,
      }

      setMessages((prev) => [...prev, userMessage])
      setResponsesByStep((prev) => ({
        ...prev,
        [currentStepIndex]: userMessage,
      }))

      const nextStepIndex = currentStepIndex + 1

      if (nextStepIndex < questions.length) {
        setCurrentStepIndex(nextStepIndex)
        appendAssistantPrompt(questions[nextStepIndex].question)
        return
      }

      // Completion path
      setFlowState("processing")
      setIsProcessing(true)

      const completionMessage: ConversationMessage = {
        id: createMessageId(),
        role: "assistant",
        content:
          "Thank you for opening up with me. I have what I need to tailor your wellness plan—here are the suggestions I prepared for you.",
      }

      let conversationSnapshot: ConversationMessage[] = []
      setMessages((prev) => {
        conversationSnapshot = [...prev, completionMessage]
        return conversationSnapshot
      })

      try {
        console.log("[mindful-ai] Starting onboarding completion...")
        await onComplete({
          conversation: [...conversationSnapshot],
          responsesByStep: { ...responsesByStep, [currentStepIndex]: userMessage },
          latestUserMessage: userMessage,
        })
        console.log("[mindful-ai] Onboarding completion successful, switching to completed state")
        setFlowState("completed")
      } catch (error) {
        console.error("[mindful-ai] onboarding completion error:", error)
        // Still set to completed even if there's an error, so UI shows results
        setFlowState("completed")
      } finally {
        setIsProcessing(false)
        setCurrentStepIndex(nextStepIndex)
      }
    },
    [
      appendAssistantPrompt,
      currentStepIndex,
      flowState,
      onComplete,
      questions,
      responsesByStep,
    ],
  )

  const currentQuestion = questions[currentStepIndex] ?? questions[questions.length - 1] ?? null

  return {
    flowState,
    currentStepIndex,
    messages,
    steps,
    isProcessing,
    currentQuestion,
    responsesByStep,
    handleUserMessage,
    resetFlow,
  }
}

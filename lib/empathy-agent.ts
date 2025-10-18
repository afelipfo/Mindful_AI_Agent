// Therapeutic empathy agent - generates professional mental health recommendations using OpenAI

import { retryFetch } from "./retry"

export type MoodCategory = "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited"

interface EmpathyInput {
  moodScore: number
  detectedMood: MoodCategory
  emotions: string[]
  energyLevel: number
  context?: string
  voiceTranscript?: string
  imageMood?: string
  imageConfidence?: number
  // Therapeutic questionnaire data (PRIMARY)
  symptomRatings?: {
    anxiety?: number
    sadness?: number
    stress?: number
    loneliness?: number
    suicideTrends?: number
  }
  therapyHistory?: {
    hasPreviousTherapy?: boolean
    duration?: string
    type?: string
  }
  therapeuticRelationshipImportance?: number
  patientReadiness?: number
  presentingProblem?: string
}

interface AnalysisSource {
  type: "text" | "symptoms" | "history" | "assessment"
  label: string
  weight: number
}

interface TherapeuticRecommendation {
  empathyMessage: string
  recommendation: {
    title: string
    description: string
    actionLabel: string
    actionType: "breathing" | "journal" | "timer" | "contact"
  }
  quote: {
    text: string
    author: string
  }
  music: {
    title: string
    artist: string
    reason: string
    spotifyUrl: string
    appleMusicUrl: string
  }
  book: {
    title: string
    author: string
    relevance: string
    amazonUrl: string
    coverUrl?: string
  }
  place: {
    type: string
    reason: string
    benefits: string
    address?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
}

export interface EmpathyResponse extends TherapeuticRecommendation {
  detectedMood: MoodCategory
  confidence: number
  analysisSummary: string
  analysisSources: AnalysisSource[]
  warnings?: string[]
}

// ============================================================================
// MOOD DETECTION FROM THERAPEUTIC SYMPTOMS (PRIMARY METHOD)
// ============================================================================

export function detectMoodFromSymptoms(symptomRatings: {
  anxiety?: number
  sadness?: number
  stress?: number
  loneliness?: number
  suicideTrends?: number
}): MoodCategory | null {
  const anxiety = symptomRatings.anxiety || 0
  const sadness = symptomRatings.sadness || 0
  const stress = symptomRatings.stress || 0
  const loneliness = symptomRatings.loneliness || 0

  // If no symptoms reported, return null
  if (anxiety === 0 && sadness === 0 && stress === 0 && loneliness === 0) {
    return null
  }

  // Clinical decision tree based on symptom severity
  if (anxiety >= 4 || (anxiety >= 3 && stress >= 3)) return "anxious"
  if (sadness >= 4 || (sadness >= 3 && loneliness >= 3)) return "sad"
  if (stress >= 4) return "stressed"
  if (anxiety >= 3) return "anxious"
  if (sadness >= 3) return "sad"
  if (stress >= 3) return "stressed"
  if (loneliness >= 2 && anxiety <= 2 && sadness <= 2) return "tired"
  if (anxiety >= 2 || stress >= 2 || sadness >= 2) return "stressed"

  return "tired" // Neutral/low symptoms
}

// Fallback mood detection from emotions
export function detectMoodCategory(emotions: string[], moodScore: number): MoodCategory {
  const emotionMap: Record<string, MoodCategory> = {
    worried: "anxious",
    nervous: "anxious",
    stressed: "stressed",
    overwhelmed: "anxious",
    down: "sad",
    depressed: "sad",
    lonely: "sad",
    exhausted: "tired",
    drained: "tired",
  }

  for (const emotion of emotions) {
    const normalized = emotion.toLowerCase()
    if (emotionMap[normalized]) {
      return emotionMap[normalized]
    }
  }

  // Fallback to mood score
  if (moodScore >= 7) return "happy"
  if (moodScore >= 5) return "tired"
  if (moodScore >= 3) return "sad"
  return "anxious"
}

// Ensure valid mood category
function ensureValidMood(mood: string): MoodCategory {
  const validMoods: MoodCategory[] = ["anxious", "happy", "sad", "tired", "stressed", "excited"]
  if (validMoods.includes(mood as MoodCategory)) {
    return mood as MoodCategory
  }
  return "tired"
}

// ============================================================================
// CONFIDENCE & ANALYSIS
// ============================================================================

function calculateConfidence(input: EmpathyInput): number {
  let confidence = 60

  if (typeof input.moodScore === "number" && !Number.isNaN(input.moodScore)) {
    confidence += Math.min(15, Math.abs(input.moodScore - 5) * 3)
  }
  if (input.context && input.context.length > 80) {
    confidence += 10
  }
  if (input.emotions.length > 0) {
    confidence += 5
  }
  if (typeof input.energyLevel === "number" && input.energyLevel !== 5) {
    confidence += 5
  }
  if (input.voiceTranscript && input.voiceTranscript.length > 20) {
    confidence += 5
  }
  // Boost confidence for therapeutic data
  if (input.symptomRatings && Object.keys(input.symptomRatings).length > 0) {
    confidence += 8
  }
  if (input.presentingProblem) {
    confidence += 7
  }
  if (input.therapyHistory?.hasPreviousTherapy !== undefined) {
    confidence += 3
  }

  return Math.max(45, Math.min(95, Math.round(confidence)))
}

const moodDescriptors: Record<MoodCategory, string> = {
  anxious: "Assessment indicates elevated anxiety symptoms consistent with anxious presentation.",
  happy: "Client reports positive emotional state and adequate functioning.",
  sad: "Assessment suggests depressive symptoms and low mood.",
  tired: "Client reports low energy and possible burnout or fatigue.",
  stressed: "Assessment indicates stress-related symptoms and overwhelm.",
  excited: "Client reports elevated positive mood and high energy.",
}

function buildAnalysisSummary(input: EmpathyInput, mood: MoodCategory): string {
  const descriptor = moodDescriptors[mood]
  const parts: string[] = [descriptor]

  // Add presenting problem if available
  if (input.presentingProblem) {
    parts.push(`Chief concern: "${input.presentingProblem.slice(0, 100)}".`)
  }

  // Add symptom ratings if available
  if (input.symptomRatings) {
    const symptoms: string[] = []
    if (input.symptomRatings.anxiety !== undefined && input.symptomRatings.anxiety > 2) {
      symptoms.push(`anxiety (${input.symptomRatings.anxiety}/5)`)
    }
    if (input.symptomRatings.sadness !== undefined && input.symptomRatings.sadness > 2) {
      symptoms.push(`sadness (${input.symptomRatings.sadness}/5)`)
    }
    if (input.symptomRatings.stress !== undefined && input.symptomRatings.stress > 2) {
      symptoms.push(`stress (${input.symptomRatings.stress}/5)`)
    }
    if (input.symptomRatings.loneliness !== undefined && input.symptomRatings.loneliness > 2) {
      symptoms.push(`loneliness (${input.symptomRatings.loneliness}/5)`)
    }
    if (symptoms.length > 0) {
      parts.push(`Elevated symptoms: ${symptoms.join(", ")}.`)
    }
  }

  if (input.emotions.length > 0) {
    parts.push(`Reported emotions: ${input.emotions.slice(0, 3).join(", ")}.`)
  }

  if (typeof input.energyLevel === "number") {
    parts.push(`Energy level: ${input.energyLevel}/10.`)
  }

  if (input.therapyHistory?.hasPreviousTherapy) {
    parts.push(`Previous therapy experience noted.`)
  }

  if (input.patientReadiness !== undefined && input.patientReadiness >= 4) {
    parts.push(`High treatment readiness (${input.patientReadiness}/5).`)
  }

  return parts.join(" ")
}

function buildAnalysisSources(input: EmpathyInput): AnalysisSource[] {
  const sources: AnalysisSource[] = []

  if (input.symptomRatings && Object.keys(input.symptomRatings).length > 0) {
    sources.push({ type: "symptoms", label: "Symptom severity ratings", weight: 0.5 })
  }

  if (input.presentingProblem) {
    sources.push({ type: "assessment", label: "Presenting problem", weight: 0.3 })
  }

  if (input.context) {
    sources.push({ type: "text", label: "Client narrative", weight: 0.2 })
  }

  if (input.therapyHistory?.hasPreviousTherapy !== undefined) {
    sources.push({ type: "history", label: "Treatment history", weight: 0.1 })
  }

  // Normalize weights to sum to 100
  const total = sources.reduce((sum, source) => sum + source.weight, 0)
  return sources.map((source) => ({
    ...source,
    weight: Math.round((source.weight / total) * 100),
  }))
}

// ============================================================================
// OPENAI THERAPEUTIC RECOMMENDATION GENERATION
// ============================================================================

async function generatePersonalizedEmpathy(
  input: EmpathyInput,
  warnings?: string[],
): Promise<TherapeuticRecommendation> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured")
    }

    const systemPrompt = `You are a professional mental health AI assistant helping therapists provide initial assessments and recommendations. Generate a compassionate, professional response message (2-3 sentences) and one evidence-based therapeutic recommendation based on the client's presenting concerns and symptom profile. Use 'you' pronouns. Focus on validation, psychoeducation, and therapeutic interventions. Never provide crisis intervention advice - recommend professional help for severe symptoms. Return ONLY valid JSON with this structure:
{
  "empathyMessage": "string",
  "recommendation": {
    "title": "string",
    "description": "string (therapeutic intervention with clinical rationale)",
    "actionLabel": "string (call to action)",
    "actionType": "breathing" | "journal" | "timer" | "contact"
  }
}`

    // Build comprehensive therapeutic context
    let userPrompt = `Client Profile:
- Presenting Problem: ${input.presentingProblem || "Not specified"}
- Current Mood: ${input.detectedMood}, Score: ${input.moodScore}/10, Energy: ${input.energyLevel}/10`

    // Add symptom ratings if available
    if (input.symptomRatings) {
      const symptoms = []
      if (input.symptomRatings.anxiety !== undefined) symptoms.push(`Anxiety: ${input.symptomRatings.anxiety}/5`)
      if (input.symptomRatings.sadness !== undefined) symptoms.push(`Sadness: ${input.symptomRatings.sadness}/5`)
      if (input.symptomRatings.stress !== undefined) symptoms.push(`Stress: ${input.symptomRatings.stress}/5`)
      if (input.symptomRatings.loneliness !== undefined) symptoms.push(`Loneliness: ${input.symptomRatings.loneliness}/5`)
      if (input.symptomRatings.suicideTrends !== undefined && input.symptomRatings.suicideTrends > 0)
        symptoms.push(`Suicidal Ideation: ${input.symptomRatings.suicideTrends}/5 - ALERT`)

      if (symptoms.length > 0) {
        userPrompt += `\n- Symptom Severity (past 2 weeks): ${symptoms.join(", ")}`
      }
    }

    // Add therapy history
    if (input.therapyHistory) {
      if (input.therapyHistory.hasPreviousTherapy) {
        userPrompt += `\n- Previous Therapy: Yes (${input.therapyHistory.duration || "duration unspecified"}, ${input.therapyHistory.type || "type unspecified"})`
      } else {
        userPrompt += `\n- Previous Therapy: No`
      }
    }

    // Add readiness and relationship importance
    if (input.patientReadiness !== undefined) {
      userPrompt += `\n- Treatment Readiness: ${input.patientReadiness}/5`
    }
    if (input.therapeuticRelationshipImportance !== undefined) {
      userPrompt += `\n- Therapeutic Alliance Importance: ${input.therapeuticRelationshipImportance}/5`
    }

    // Add context notes
    if (input.context) {
      userPrompt += `\n- Additional Context: "${input.context}"`
    }

    const response = await retryFetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 300,
          response_format: { type: "json_object" },
        }),
      },
      { retries: 2 },
    )

    if (!response.ok) {
      throw new Error("OpenAI API request failed")
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    return result
  } catch (error) {
    console.error("[empathy-agent] OpenAI generation error:", error)
    warnings?.push("Generated recommendation using fallback content.")

    // Fallback recommendations
    return getFallbackRecommendation(input.detectedMood)
  }
}

// ============================================================================
// FALLBACK THERAPEUTIC RECOMMENDATIONS
// ============================================================================

function getFallbackRecommendation(mood: MoodCategory): TherapeuticRecommendation {
  const fallbacks: Record<MoodCategory, TherapeuticRecommendation> = {
    anxious: {
      empathyMessage:
        "I understand you're experiencing anxiety. This is a common response to stress and uncertainty, and it's important that you're seeking support. Your willingness to engage with these feelings is a positive step toward managing them.",
      recommendation: {
        title: "Diaphragmatic Breathing (Evidence-Based Anxiety Reduction)",
        description:
          "Practice diaphragmatic breathing: Inhale slowly for 4 counts, hold for 7, exhale for 8. Repeat for 5 minutes. This technique activates the parasympathetic nervous system and has been shown to reduce anxiety symptoms in clinical trials.",
        actionLabel: "Begin breathing exercise",
        actionType: "breathing",
      },
      quote: {
        text: "Between stimulus and response there is a space. In that space is our power to choose our response.",
        author: "Viktor E. Frankl",
      },
      music: {
        title: "Weightless",
        artist: "Marconi Union",
        reason: "Clinical studies show this composition can reduce anxiety levels through carefully designed harmonies.",
        spotifyUrl: "https://open.spotify.com/search/Weightless%20Marconi%20Union",
        appleMusicUrl: "https://music.apple.com/search?term=Weightless%20Marconi%20Union",
      },
      book: {
        title: "The Anxiety and Phobia Workbook",
        author: "Edmund J. Bourne, PhD",
        relevance: "Evidence-based CBT and mindfulness techniques for managing anxiety disorders.",
        amazonUrl: "https://www.amazon.com/s?k=The+Anxiety+and+Phobia+Workbook",
      },
      place: {
        type: "A quiet natural space (park or botanical garden)",
        reason: "Nature-based therapy has demonstrated efficacy in reducing cortisol and anxiety symptoms",
        benefits: "Natural environments support nervous system regulation.",
      },
    },
    sad: {
      empathyMessage:
        "I hear that you're experiencing sadness. This is a valid emotional response, and it's important to acknowledge these feelings rather than suppress them. Your engagement in this process demonstrates self-awareness and a willingness to work through difficult emotions.",
      recommendation: {
        title: "Behavioral Activation (Depression Treatment)",
        description:
          "Engage in one small, meaningful activity despite low motivation. Behavioral activation is an evidence-based treatment for depression that helps break the cycle of withdrawal and sadness.",
        actionLabel: "View suggested activities",
        actionType: "contact",
      },
      quote: {
        text: "The only way out is through.",
        author: "Robert Frost",
      },
      music: {
        title: "The Night We Met",
        artist: "Lord Huron",
        reason: "Music therapy research suggests validating emotional experiences through music can provide cathartic release.",
        spotifyUrl: "https://open.spotify.com/search/The%20Night%20We%20Met%20Lord%20Huron",
        appleMusicUrl: "https://music.apple.com/search?term=The%20Night%20We%20Met%20Lord%20Huron",
      },
      book: {
        title: "Feeling Good: The New Mood Therapy",
        author: "David D. Burns, MD",
        relevance: "Evidence-based cognitive behavioral techniques for managing depression.",
        amazonUrl: "https://www.amazon.com/s?k=Feeling+Good+David+Burns",
      },
      place: {
        type: "A well-lit communal space (café or library)",
        reason: "Gentle social exposure combats isolation, a key maintaining factor in depression",
        benefits: "Low-pressure environment that provides structure and human connection.",
      },
    },
    stressed: {
      empathyMessage:
        "You're experiencing stress, which indicates your system is responding to perceived demands. Recognizing this physiological response is an important first step toward implementing effective stress management strategies.",
      recommendation: {
        title: "Progressive Muscle Relaxation (PMR)",
        description:
          "Practice PMR: Systematically tense and release each muscle group for 5-7 seconds, progressing from feet to head. This evidence-based technique reduces physiological arousal.",
        actionLabel: "Begin PMR exercise",
        actionType: "breathing",
      },
      quote: {
        text: "You can't calm the storm, so stop trying. What you can do is calm yourself.",
        author: "Timber Hawkeye",
      },
      music: {
        title: "Breathe Me",
        artist: "Sia",
        reason: "Emotionally resonant music can facilitate emotional processing and self-compassion.",
        spotifyUrl: "https://open.spotify.com/search/Breathe%20Me%20Sia",
        appleMusicUrl: "https://music.apple.com/search?term=Breathe%20Me%20Sia",
      },
      book: {
        title: "The Relaxation and Stress Reduction Workbook",
        author: "Martha Davis, PhD",
        relevance: "Comprehensive evidence-based techniques for stress management.",
        amazonUrl: "https://www.amazon.com/s?k=Relaxation+Stress+Reduction+Workbook",
      },
      place: {
        type: "A natural water setting (lake, ocean, or stream)",
        reason: "Blue space exposure has been shown to reduce physiological markers of stress",
        benefits: "Rhythmic water sounds promote parasympathetic nervous system activation.",
      },
    },
    tired: {
      empathyMessage:
        "I recognize that you're experiencing fatigue. This may indicate physical exhaustion, emotional burnout, or both. It's important to listen to your body's signals and prioritize self-care.",
      recommendation: {
        title: "Restorative Break (15 minutes)",
        description:
          "Take a 15-minute intentional break: Step outside for fresh air, practice gentle stretching, or simply rest. Brief restorative breaks improve cognitive function and emotional regulation.",
        actionLabel: "Set timer for break",
        actionType: "timer",
      },
      quote: {
        text: "Almost everything will work again if you unplug it for a few minutes, including you.",
        author: "Anne Lamott",
      },
      music: {
        title: "Clair de Lune",
        artist: "Debussy",
        reason: "Gentle, restorative classical piece that promotes relaxation.",
        spotifyUrl: "https://open.spotify.com/search/Clair%20de%20Lune%20Debussy",
        appleMusicUrl: "https://music.apple.com/search?term=Clair%20de%20Lune%20Debussy",
      },
      book: {
        title: "Rest",
        author: "Alex Soojung-Kim Pang",
        relevance: "The science of productive rest and why downtime is essential.",
        amazonUrl: "https://www.amazon.com/s?k=Rest+Alex+Soojung-Kim+Pang",
      },
      place: {
        type: "A quiet park bench under trees",
        reason: "Restorative environment with nature sounds",
        benefits: "Dappled sunlight and bird songs provide sensory restoration.",
      },
    },
    happy: {
      empathyMessage:
        "I'm glad to hear you're experiencing positive emotions. It's valuable to recognize and appreciate moments of well-being, as this practice can strengthen emotional resilience.",
      recommendation: {
        title: "Gratitude Practice (Evidence-Based)",
        description:
          "Document 3 specific things you're grateful for today. Research shows regular gratitude practice increases overall well-being and life satisfaction.",
        actionLabel: "Open journal",
        actionType: "journal",
      },
      quote: {
        text: "Happiness is not by chance, but by choice.",
        author: "Jim Rohn",
      },
      music: {
        title: "Here Comes the Sun",
        artist: "The Beatles",
        reason: "Uplifting melody that matches and amplifies positive energy.",
        spotifyUrl: "https://open.spotify.com/search/Here%20Comes%20the%20Sun%20Beatles",
        appleMusicUrl: "https://music.apple.com/search?term=Here%20Comes%20the%20Sun%20Beatles",
      },
      book: {
        title: "The Book of Joy",
        author: "Dalai Lama & Desmond Tutu",
        relevance: "Deepens appreciation for joy and teaches cultivating lasting happiness.",
        amazonUrl: "https://www.amazon.com/s?k=The+Book+of+Joy",
      },
      place: {
        type: "A hilltop viewpoint",
        reason: "Expansive views amplify positive emotions",
        benefits: "Wide open spaces enhance feelings of possibility and freedom.",
      },
    },
    excited: {
      empathyMessage:
        "Your positive energy is notable. This elevated mood state can be channeled productively toward meaningful goals and activities.",
      recommendation: {
        title: "Goal Setting Exercise",
        description:
          "Channel this energy into planning toward a personal goal. Write specific action steps. Goal-directed behavior during positive mood states increases achievement.",
        actionLabel: "Start planning",
        actionType: "journal",
      },
      quote: {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
      music: {
        title: "Good Life",
        artist: "OneRepublic",
        reason: "Amplifies positive momentum and celebrates living fully.",
        spotifyUrl: "https://open.spotify.com/search/Good%20Life%20OneRepublic",
        appleMusicUrl: "https://music.apple.com/search?term=Good%20Life%20OneRepublic",
      },
      book: {
        title: "Flow",
        author: "Mihaly Csikszentmihalyi",
        relevance: "The psychology of optimal experience and peak performance.",
        amazonUrl: "https://www.amazon.com/s?k=Flow+Csikszentmihalyi",
      },
      place: {
        type: "An inspiring creative space or museum",
        reason: "Novel environments stimulate dopamine and creative thinking",
        benefits: "New experiences channel excitement into growth and learning.",
      },
    },
  }

  return fallbacks[mood] || fallbacks.tired
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

export async function generateEmpathyRecommendations(input: EmpathyInput): Promise<EmpathyResponse> {
  // PRIORITY 1: Detect mood from symptom ratings (therapeutic questionnaire)
  let detectedMood: MoodCategory

  if (input.symptomRatings) {
    const symptomMood = detectMoodFromSymptoms(input.symptomRatings)
    if (symptomMood) {
      console.log("[empathy-agent] Mood detected from symptom ratings:", symptomMood)
      detectedMood = symptomMood
    } else {
      detectedMood = ensureValidMood(input.detectedMood)
      console.log("[empathy-agent] Using fallback mood detection:", detectedMood)
    }
  } else {
    detectedMood = ensureValidMood(input.detectedMood)
    console.log("[empathy-agent] No symptom ratings, using provided mood:", detectedMood)
  }

  const normalizedInput: EmpathyInput = {
    ...input,
    detectedMood: detectedMood,
    context: input.context ? input.context.slice(-600) : undefined,
  }

  const confidence = calculateConfidence(normalizedInput)
  const analysisSummary = buildAnalysisSummary(normalizedInput, detectedMood)
  const analysisSources = buildAnalysisSources(normalizedInput)
  const warnings: string[] = []

  try {
    console.log("[empathy-agent] Generating therapeutic recommendation for mood:", detectedMood)

    // Get OpenAI therapeutic recommendation (empathy message + main recommendation)
    const therapeuticRec = await generatePersonalizedEmpathy(normalizedInput, warnings)

    // Get fallback resources for quote/music/book/place
    const fallbackResources = getFallbackRecommendation(detectedMood)

    const response: EmpathyResponse = {
      detectedMood,
      confidence,
      analysisSummary,
      analysisSources,
      empathyMessage: therapeuticRec.empathyMessage,
      recommendation: therapeuticRec.recommendation,
      quote: fallbackResources.quote,
      music: fallbackResources.music,
      book: fallbackResources.book,
      place: fallbackResources.place,
      warnings: warnings.length ? warnings : undefined,
    }

    console.log("[empathy-agent] Successfully generated therapeutic recommendation")
    return response
  } catch (error) {
    console.error("[empathy-agent] Error generating recommendation:", error)
    warnings.push("Displayed saved recommendation because live services were unavailable.")

    const fallback = getFallbackRecommendation(detectedMood)

    return {
      detectedMood,
      confidence,
      analysisSummary,
      analysisSources,
      ...fallback,
      warnings,
    }
  }
}

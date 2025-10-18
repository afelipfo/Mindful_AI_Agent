// Empathy recommendations agent - generates personalized wellness suggestions

import { retryFetch } from "./retry"

export type MoodCategory = "anxious" | "happy" | "sad" | "tired" | "stressed" | "excited"

interface EmpathyInput {
  moodScore: number
  detectedMood: MoodCategory
  emotions: string[]
  energyLevel: number
  context?: string
  latitude?: number
  longitude?: number
  voiceTranscript?: string
  imageMood?: string
  imageConfidence?: number
  // Therapeutic questionnaire data
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
  type: "text" | "emoji" | "voice" | "photo" | "history"
  label: string
  weight: number
}

interface RecommendationSet {
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

export interface EmpathyResponse extends RecommendationSet {
  detectedMood: MoodCategory
  confidence: number
  analysisSummary: string
  analysisSources: AnalysisSource[]
  warnings?: string[]
}

interface OpenLibraryDoc {
  cover_i?: number
  author_name?: string[]
  ratings_average?: number
  title: string
}

interface OpenLibraryResponse {
  docs?: OpenLibraryDoc[]
}

interface SpotifyArtist {
  name: string
}

interface SpotifyTrack {
  name: string
  artists: SpotifyArtist[]
  external_urls: { spotify: string }
}

interface SpotifyRecommendationResponse {
  tracks: SpotifyTrack[]
}

interface FoursquarePlace {
  name?: string
  location?: {
    formatted_address?: string
    lat?: number
    lng?: number
  }
}

interface FoursquareResponse {
  results: FoursquarePlace[]
}

type QuotableRandomResponse = Array<{ content: string; author: string }>

// Detect mood category from emotions and score
export function detectMoodCategory(emotions: string[], moodScore: number): MoodCategory {
  const emotionMap: Record<string, MoodCategory> = {
    worried: "anxious",
    nervous: "anxious",
    stressed: "stressed",
    overwhelmed: "anxious",
    tense: "anxious",
    joyful: "happy",
    content: "happy",
    excited: "excited",
    grateful: "happy",
    peaceful: "happy",
    down: "sad",
    depressed: "sad",
    lonely: "sad",
    hopeless: "sad",
    disappointed: "sad",
    exhausted: "tired",
    drained: "tired",
    fatigued: "tired",
    "burnt out": "tired",
    lethargic: "tired",
    pressured: "stressed",
    frustrated: "stressed",
    irritated: "stressed",
    agitated: "stressed",
    energized: "excited",
    motivated: "excited",
    enthusiastic: "excited",
    inspired: "excited",
  }

  // Check emotions first
  for (const emotion of emotions) {
    const normalized = emotion.toLowerCase()
    if (emotionMap[normalized]) {
      return emotionMap[normalized]
    }
  }

  // Fallback to mood score
  if (moodScore >= 8) return "happy"
  if (moodScore >= 6) return "excited"
  if (moodScore >= 4) return "tired"
  if (moodScore >= 2) return "sad"
  return "anxious"
}

const textMoodKeywords: Record<MoodCategory, string[]> = {
  anxious: ["anxious", "worried", "nervous", "uneasy", "on edge", "overwhelmed", "panic"],
  happy: ["happy", "grateful", "calm", "content", "peaceful", "good", "smiling"],
  sad: ["sad", "down", "low", "blue", "lonely", "upset", "heartbroken"],
  tired: ["tired", "exhausted", "fatigued", "drained", "sleepy", "worn out", "burned out"],
  stressed: ["stressed", "pressure", "tense", "frustrated", "irritated", "rushed"],
  excited: ["excited", "energized", "pumped", "thrilled", "motivated", "inspired"],
}

const moodBaseScore: Record<MoodCategory, number> = {
  anxious: 3,
  happy: 8,
  sad: 3,
  tired: 4,
  stressed: 4,
  excited: 8,
}

export function inferMoodFromText(text: string): { mood: MoodCategory; score: number; emotions: string[] } {
  const normalized = text.toLowerCase()
  let bestMood: MoodCategory = "tired"
  let bestMatches = 0
  const matchedEmotions = new Set<string>()

  for (const mood of Object.keys(textMoodKeywords) as MoodCategory[]) {
    const keywords = textMoodKeywords[mood]
    let matches = 0
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        matches += 1
        matchedEmotions.add(keyword)
      }
    }
    if (matches > bestMatches) {
      bestMatches = matches
      bestMood = mood
    }
  }

  let score = moodBaseScore[bestMood]

  if (normalized.includes("very") || normalized.includes("really") || normalized.includes("extremely")) {
    score += 1
  }
  if (normalized.includes("slightly") || normalized.includes("kind of") || normalized.includes("a little")) {
    score -= 1
  }

  score = Math.min(10, Math.max(2, score))

  if (matchedEmotions.size === 0) {
    const fallbackMood: MoodCategory = normalized.length <= 6 ? "excited" : "happy"
    const fallbackScore = normalized.length <= 6 ? 7 : 6

    return {
      mood: fallbackMood,
      score: fallbackScore,
      emotions: [],
    }
  }

  return {
    mood: bestMood,
    score,
    emotions: Array.from(matchedEmotions).slice(0, 5),
  }
}

const moodDescriptors: Record<MoodCategory, string> = {
  anxious: "Signals suggest your nervous system is running high, pointing toward an anxious state.",
  happy: "Your tone and word choices lean warm and appreciative, suggesting a happy mood.",
  sad: "There are cues of heaviness and inward focus, consistent with a sad or reflective mood.",
  tired: "Recurring mentions of fatigue and slowed momentum hint at mental or physical tiredness.",
  stressed: "Mentions of pressure and tight timelines align with a stressed emotional profile.",
  excited: "Elevated language and momentum signal an excited, forward-looking energy.",
}

function truncate(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) {
    return normalized
  }
  return `${normalized.slice(0, maxLength - 3)}...`
}

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
  if (input.imageMood) {
    confidence += 5
  }
  // Boost confidence if therapeutic data is available
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

function buildAnalysisSummary(input: EmpathyInput, mood: MoodCategory, _confidence: number): string {
  const descriptor = moodDescriptors[mood]
  const parts: string[] = [descriptor]

  // Add presenting problem if available
  if (input.presentingProblem) {
    parts.push(`Chief concern: "${truncate(input.presentingProblem, 100)}".`)
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

  if (input.context && !input.presentingProblem) {
    parts.push(`Recent note: "${truncate(input.context, 120)}".`)
  }

  if (input.emotions.length > 0) {
    parts.push(`Emotions mentioned: ${input.emotions.slice(0, 3).join(", ")}.`)
  }

  if (typeof input.energyLevel === "number") {
    parts.push(`Energy around ${input.energyLevel}/10.`)
  }

  // Add therapy history context
  if (input.therapyHistory?.hasPreviousTherapy) {
    parts.push(`Previous therapy experience noted.`)
  }

  // Add readiness level
  if (input.patientReadiness !== undefined && input.patientReadiness >= 4) {
    parts.push(`High engagement readiness (${input.patientReadiness}/5).`)
  }

  return parts.join(" ")
}

function normalizeSources(sources: AnalysisSource[]): AnalysisSource[] {
  if (sources.length === 0) {
    return [
      {
        type: "text",
        label: "Baseline wellness model",
        weight: 100,
      },
    ]
  }

  const total = sources.reduce((sum, source) => sum + source.weight, 0)

  return sources.map((source) => ({
    ...source,
    weight: Math.round((source.weight / total) * 100),
  }))
}

function buildAnalysisSources(input: EmpathyInput): AnalysisSource[] {
  const sources: AnalysisSource[] = []

  if (input.context) {
    sources.push({ type: "text", label: "Text reflection", weight: 0.6 })
  }

  if (input.emotions.length > 0) {
    sources.push({ type: "emoji", label: "Mood tags", weight: 0.2 })
  }

  if (typeof input.moodScore === "number") {
    sources.push({ type: "history", label: "Mood score", weight: 0.15 })
  }

  if (typeof input.energyLevel === "number") {
    sources.push({ type: "history", label: "Energy level", weight: 0.1 })
  }

  if (input.voiceTranscript) {
    sources.push({ type: "voice", label: "Voice tone", weight: 0.25 })
  }

  if (input.imageMood) {
    sources.push({ type: "photo", label: "Expression analysis", weight: 0.2 })
  }

  return normalizeSources(sources)
}

// Pre-cached responses for each mood category
const empathyResponses: Record<MoodCategory, RecommendationSet> = {
  anxious: {
    empathyMessage:
      "It's completely normal to feel anxious. Your feelings are valid, and you're taking the right step by acknowledging them. Remember, anxiety is your mind trying to protect you.",
    recommendation: {
      title: "4-7-8 Breathing",
      description:
        "Try the 4-7-8 breathing technique: Inhale for 4 seconds, hold for 7, exhale for 8. Repeat 3 times. This activates your parasympathetic nervous system.",
      actionLabel: "Start breathing exercise",
      actionType: "breathing",
    },
    quote: {
      text: "You are braver than you believe, stronger than you seem, and smarter than you think.",
      author: "A.A. Milne",
    },
    music: {
      title: "Weightless",
      artist: "Marconi Union",
      reason: "Scientifically proven to reduce anxiety by 65% through carefully arranged harmonies and rhythms.",
      spotifyUrl: "https://open.spotify.com/search/Weightless%20Marconi%20Union",
      appleMusicUrl: "https://music.apple.com/search?term=Weightless%20Marconi%20Union",
    },
    book: {
      title: "The Anxiety and Phobia Workbook",
      author: "Edmund Bourne",
      relevance: "Practical CBT techniques and exercises to manage anxiety in daily life.",
      amazonUrl: "https://www.amazon.com/s?k=The+Anxiety+and+Phobia+Workbook",
    },
    place: {
      type: "A botanical garden",
      reason: "Nature exposure reduces cortisol by 21%",
      benefits: "Surrounded by greenery, gentle sounds, and fresh air to calm your nervous system.",
    },
  },
  happy: {
    empathyMessage:
      "Your positive energy is wonderful! It's beautiful that you're taking time to recognize and appreciate these moments. Savoring joy amplifies its benefits.",
    recommendation: {
      title: "Gratitude Journaling",
      description:
        "Capture this moment! Write down 3 specific things that made you feel good today. Research shows this practice increases happiness by 25%.",
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
      reason: "Uplifting melody and lyrics that match and amplify positive energy.",
      spotifyUrl: "https://open.spotify.com/search/Here%20Comes%20the%20Sun%20Beatles",
      appleMusicUrl: "https://music.apple.com/search?term=Here%20Comes%20the%20Sun%20Beatles",
    },
    book: {
      title: "The Book of Joy",
      author: "Dalai Lama & Desmond Tutu",
      relevance: "Deepens appreciation for joy and teaches how to cultivate lasting happiness.",
      amazonUrl: "https://www.amazon.com/s?k=The+Book+of+Joy",
    },
    place: {
      type: "A hilltop viewpoint",
      reason: "Expansive views amplify positive emotions",
      benefits: "Wide open spaces and elevated perspectives enhance feelings of possibility and freedom.",
    },
  },
  sad: {
    empathyMessage:
      "Sadness is a natural part of being human. Remember that it's okay not to be okay, and this feeling won't last forever. You're not alone in this.",
    recommendation: {
      title: "Reach Out",
      description:
        "Connect with someone you trust. Sometimes sharing how we feel can lighten the emotional load. Even a brief conversation can help.",
      actionLabel: "View contacts",
      actionType: "contact",
    },
    quote: {
      text: "The wound is the place where the light enters you.",
      author: "Rumi",
    },
    music: {
      title: "The Night We Met",
      artist: "Lord Huron",
      reason: "Validates melancholy feelings and provides cathartic emotional release.",
      spotifyUrl: "https://open.spotify.com/search/The%20Night%20We%20Met%20Lord%20Huron",
      appleMusicUrl: "https://music.apple.com/search?term=The%20Night%20We%20Met%20Lord%20Huron",
    },
    book: {
      title: "When Things Fall Apart",
      author: "Pema Chödrön",
      relevance: "Buddhist perspective on embracing pain and finding peace in difficult times.",
      amazonUrl: "https://www.amazon.com/s?k=When+Things+Fall+Apart",
    },
    place: {
      type: "A cozy café with natural light",
      reason: "Gentle social exposure in a warm atmosphere",
      benefits: "Soft ambient sounds, warm lighting, and the presence of others without pressure to interact.",
    },
  },
  tired: {
    empathyMessage:
      "Rest is productive too. Your body and mind are telling you something important—listen to them with kindness. Taking a break is not giving up.",
    recommendation: {
      title: "Power Rest",
      description:
        "Take a 15-minute power nap or step outside for fresh air and sunlight. Even brief rest can restore 40% of your energy.",
      actionLabel: "Set timer",
      actionType: "timer",
    },
    quote: {
      text: "Almost everything will work again if you unplug it for a few minutes, including you.",
      author: "Anne Lamott",
    },
    music: {
      title: "Clair de Lune",
      artist: "Debussy",
      reason: "Gentle, restorative classical piece that promotes relaxation without inducing sleep.",
      spotifyUrl: "https://open.spotify.com/search/Clair%20de%20Lune%20Debussy",
      appleMusicUrl: "https://music.apple.com/search?term=Clair%20de%20Lune%20Debussy",
    },
    book: {
      title: "Rest",
      author: "Alex Soojung-Kim Pang",
      relevance: "The science of productive rest and why downtime is essential for creativity.",
      amazonUrl: "https://www.amazon.com/s?k=Rest+Alex+Soojung-Kim+Pang",
    },
    place: {
      type: "A quiet park bench under trees",
      reason: "Restorative environment with nature sounds",
      benefits: "Dappled sunlight, bird songs, and gentle breeze provide sensory restoration.",
    },
  },
  stressed: {
    empathyMessage:
      "Stress is your body's response to demands, and it shows you care deeply. Acknowledging it is the first step to managing it effectively.",
    recommendation: {
      title: "Progressive Muscle Relaxation",
      description:
        "Tense and release each muscle group for 5 seconds, starting from your toes to your head. This releases physical tension stored in your body.",
      actionLabel: "Start relaxation",
      actionType: "breathing",
    },
    quote: {
      text: "You can't calm the storm, so stop trying. What you can do is calm yourself. The storm will pass.",
      author: "Timber Hawkeye",
    },
    music: {
      title: "Breathe Me",
      artist: "Sia",
      reason: "Grounding melody that facilitates emotional release and self-compassion.",
      spotifyUrl: "https://open.spotify.com/search/Breathe%20Me%20Sia",
      appleMusicUrl: "https://music.apple.com/search?term=Breathe%20Me%20Sia",
    },
    book: {
      title: "The Subtle Art of Not Giving a F*ck",
      author: "Mark Manson",
      relevance: "Perspective shift on what truly matters and letting go of unnecessary stress.",
      amazonUrl: "https://www.amazon.com/s?k=The+Subtle+Art+of+Not+Giving+a+Fck",
    },
    place: {
      type: "A nearby body of water",
      reason: "Blue spaces calm the nervous system",
      benefits: "The sound and sight of water triggers relaxation response and reduces cortisol.",
    },
  },
  excited: {
    empathyMessage:
      "Your enthusiasm is contagious! This energy is a gift—channel it into something meaningful. Excitement is your mind's way of saying you're aligned with your purpose.",
    recommendation: {
      title: "Creative Expression",
      description:
        "Harness this energy into a creative project or physical activity. Movement and creation amplify positive momentum.",
      actionLabel: "Explore ideas",
      actionType: "journal",
    },
    quote: {
      text: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
    },
    music: {
      title: "Good Life",
      artist: "OneRepublic",
      reason: "Amplifies positive momentum and celebrates the joy of living fully.",
      spotifyUrl: "https://open.spotify.com/search/Good%20Life%20OneRepublic",
      appleMusicUrl: "https://music.apple.com/search?term=Good%20Life%20OneRepublic",
    },
    book: {
      title: "Big Magic",
      author: "Elizabeth Gilbert",
      relevance: "How to harness creative energy and live a life driven by curiosity and passion.",
      amazonUrl: "https://www.amazon.com/s?k=Big+Magic+Elizabeth+Gilbert",
    },
    place: {
      type: "An art museum or gallery",
      reason: "Channel energy into inspiration and discovery",
      benefits: "Visual stimulation, creative atmosphere, and space to explore new perspectives.",
    },
  },
}

// Helper function to ensure valid mood category
function ensureValidMood(mood: string): MoodCategory {
  const validMoods: MoodCategory[] = ["anxious", "happy", "sad", "tired", "stressed", "excited"]
  if (validMoods.includes(mood as MoodCategory)) {
    return mood as MoodCategory
  }
  // Default to "tired" for neutral or unknown moods
  return "tired"
}

async function generatePersonalizedEmpathy(
  input: EmpathyInput,
  warnings?: string[],
): Promise<Pick<RecommendationSet, "empathyMessage" | "recommendation">> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured")
    }

    const systemPrompt = `You are an empathetic mental wellness companion. Generate a warm validation message (2-3 sentences) and one practical recommendation with time estimate based on the user's mood. Use 'you' pronouns. Never minimize feelings or give clinical advice. Return ONLY valid JSON with this structure:
{
  "empathyMessage": "string",
  "recommendation": {
    "title": "string",
    "description": "string (include time estimate)",
    "actionLabel": "string (call to action)",
    "actionType": "breathing" | "journal" | "timer" | "contact"
  }
}`

    const userPrompt = `Mood: ${input.detectedMood}, Score: ${input.moodScore}/10, Energy: ${input.energyLevel}/10${input.context ? `, Context: "${input.context}"` : ""}`

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
    console.error("[v0] OpenAI empathy generation error:", error)
    warnings?.push("Generated empathy message using fallback copy.")
    const fallback = empathyResponses[input.detectedMood]
    return {
      empathyMessage: fallback.empathyMessage,
      recommendation: fallback.recommendation,
    }
  }
}

async function getMusicRecommendation(detectedMood: MoodCategory, warnings?: string[]) {
  try {
    // Mood to Spotify audio features mapping
    const moodFeatures: Record<string, { valence: number; energy: number; tempo: { min: number; max: number } }> = {
      anxious: { valence: 0.3, energy: 0.35, tempo: { min: 60, max: 80 } },
      happy: { valence: 0.85, energy: 0.75, tempo: { min: 120, max: 140 } },
      sad: { valence: 0.2, energy: 0.3, tempo: { min: 50, max: 75 } },
      tired: { valence: 0.45, energy: 0.2, tempo: { min: 60, max: 90 } },
      stressed: { valence: 0.4, energy: 0.4, tempo: { min: 70, max: 100 } },
      excited: { valence: 0.9, energy: 0.85, tempo: { min: 130, max: 160 } },
    }

    const features = moodFeatures[detectedMood] || moodFeatures.anxious

    if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
      throw new Error("Spotify credentials not configured")
    }

    const tokenResponse = await retryFetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      },
      { retries: 2 },
    )

    if (!tokenResponse.ok) {
      throw new Error("Failed to get Spotify token")
    }

    const { access_token } = await tokenResponse.json()

    const recommendationsUrl = `https://api.spotify.com/v1/recommendations?limit=1&seed_genres=ambient,classical,acoustic&target_valence=${features.valence}&target_energy=${features.energy}&min_tempo=${features.tempo.min}&max_tempo=${features.tempo.max}`

    const musicResponse = await retryFetch(
      recommendationsUrl,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
      { retries: 2 },
    )

    if (!musicResponse.ok) {
      throw new Error("Failed to get music recommendations")
    }

    const data = (await musicResponse.json()) as SpotifyRecommendationResponse
    const track = data.tracks?.[0]

    if (!track) {
      throw new Error("No tracks found")
    }

    return {
      title: track.name,
      artist: track.artists[0].name,
      reason: `Selected for its ${features.valence > 0.6 ? "uplifting" : "calming"} qualities to match your mood`,
      spotifyUrl: track.external_urls.spotify,
      appleMusicUrl: `https://music.apple.com/search?term=${encodeURIComponent(`${track.name} ${track.artists[0].name}`)}`,
    }
  } catch (error) {
    console.error("[v0] Music recommendation error:", error)
    warnings?.push("Served saved music recommendation while Spotify was unavailable.")

    const fallbacks: Record<string, { title: string; artist: string; reason: string; spotifyUrl: string; appleMusicUrl: string }> = {
      anxious: {
        title: "Weightless",
        artist: "Marconi Union",
        reason: "Scientifically proven to reduce anxiety by 65%",
        spotifyUrl: "https://open.spotify.com/search/Weightless%20Marconi%20Union",
        appleMusicUrl: "https://music.apple.com/search?term=Weightless%20Marconi%20Union",
      },
      happy: {
        title: "Here Comes the Sun",
        artist: "The Beatles",
        reason: "Uplifting melody that amplifies positive energy",
        spotifyUrl: "https://open.spotify.com/search/Here%20Comes%20the%20Sun%20Beatles",
        appleMusicUrl: "https://music.apple.com/search?term=Here%20Comes%20the%20Sun%20Beatles",
      },
    }

    return fallbacks[detectedMood] ?? fallbacks.anxious
  }
}
async function getBookRecommendation(detectedMood: MoodCategory, warnings?: string[]) {
  try {
    const moodSubjects: Record<string, string[]> = {
      anxious: ["anxiety", "mindfulness", "cognitive behavioral therapy"],
      happy: ["joy", "gratitude", "positive psychology"],
      sad: ["depression", "resilience", "healing"],
      tired: ["rest", "sleep", "burnout recovery"],
      stressed: ["stress relief", "meditation", "mental health"],
      excited: ["motivation", "creativity", "personal growth"],
    }

    const subjects = moodSubjects[detectedMood] || moodSubjects.anxious
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]

    const response = await retryFetch(
      `https://openlibrary.org/search.json?subject=${encodeURIComponent(randomSubject)}&limit=20&sort=rating`,
      { next: { revalidate: 3600 } },
      { retries: 2 },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch books")
    }

    const data = (await response.json()) as OpenLibraryResponse

    const qualityBooks = data.docs?.filter(
      (book) => Boolean(book.cover_i && book.author_name?.length && book.ratings_average && book.ratings_average >= 3.8),
    )

    if (!qualityBooks || qualityBooks.length === 0) {
      throw new Error("No quality books found")
    }

    const book = qualityBooks[Math.floor(Math.random() * Math.min(5, qualityBooks.length))]

    return {
      title: book.title,
      author: book.author_name![0],
      relevance: `Recommended for ${randomSubject} - rated ${book.ratings_average!.toFixed(1)}/5`,
      amazonUrl: `https://www.amazon.com/s?k=${encodeURIComponent(book.title)}`,
      coverUrl: `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`,
    }
  } catch (error) {
    console.error("[v0] Book recommendation error:", error)
    warnings?.push("Provided saved reading suggestion due to book API issues.")

    const fallbacks: Record<string, { title: string; author: string; relevance: string; amazonUrl: string }> = {
      anxious: {
        title: "The Anxiety and Phobia Workbook",
        author: "Edmund Bourne",
        relevance: "Practical CBT techniques for managing anxiety",
        amazonUrl: "https://www.amazon.com/s?k=The+Anxiety+and+Phobia+Workbook",
      },
      happy: {
        title: "The Book of Joy",
        author: "Dalai Lama",
        relevance: "Deepens appreciation for joy and happiness",
        amazonUrl: "https://www.amazon.com/s?k=The+Book+of+Joy",
      },
    }

    return fallbacks[detectedMood] ?? fallbacks.anxious
  }
}
async function getQuoteRecommendation(detectedMood: MoodCategory, warnings?: string[]) {
  try {
    const moodTags: Record<string, string> = {
      anxious: "courage|wisdom|peace",
      happy: "happiness|success|life",
      sad: "adversity|healing|hope",
      tired: "self|rest|patience",
      stressed: "wisdom|peace|perseverance",
      excited: "inspirational|success|opportunity",
    }

    const tags = moodTags[detectedMood] || moodTags.anxious

    const response = await retryFetch(
      `https://api.quotable.io/quotes/random?tags=${tags}&maxLength=150`,
      { next: { revalidate: 3600 } },
      { retries: 2 },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch quote")
    }

    const data = (await response.json()) as QuotableRandomResponse
    const quote = data[0]

    if (!quote) {
      throw new Error("No quote found")
    }

    return {
      text: quote.content,
      author: quote.author,
    }
  } catch (error) {
    console.error("[v0] Quote recommendation error:", error)
    warnings?.push("Displayed saved quote due to quote service unavailability.")

    const fallbacks: Record<string, { text: string; author: string }> = {
      anxious: {
        text: "You are braver than you believe, stronger than you seem, and smarter than you think.",
        author: "A.A. Milne",
      },
      happy: {
        text: "Happiness is not by chance, but by choice.",
        author: "Jim Rohn",
      },
      sad: {
        text: "The wound is the place where the light enters you.",
        author: "Rumi",
      },
      tired: {
        text: "Almost everything will work again if you unplug it for a few minutes, including you.",
        author: "Anne Lamott",
      },
      stressed: {
        text: "You can't calm the storm, so stop trying. What you can do is calm yourself. The storm will pass.",
        author: "Timber Hawkeye",
      },
      excited: {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
      },
    }

    return fallbacks[detectedMood] ?? fallbacks.anxious
  }
}
async function getPlaceRecommendation(detectedMood: MoodCategory, latitude?: number, longitude?: number, warnings?: string[]) {
  try {
    const moodPlaces: Record<string, { categories: string; type: string; reason: string; benefits: string }> = {
      anxious: {
        categories: "16032",
        type: "A botanical garden",
        reason: "Nature exposure reduces cortisol by 21%",
        benefits: "Green spaces calm the nervous system and promote grounding",
      },
      happy: {
        categories: "13035",
        type: "A scenic viewpoint",
        reason: "Expansive views amplify positive emotions",
        benefits: "Height enhances feelings of possibility and freedom",
      },
      sad: {
        categories: "13035",
        type: "A cozy café with natural light",
        reason: "Gentle social exposure and warm atmosphere",
        benefits: "Soft ambient noise eases loneliness without pressure",
      },
      tired: {
        categories: "16032",
        type: "A quiet park bench under trees",
        reason: "Restorative environment with nature sounds",
        benefits: "Passive rest recharges mental energy naturally",
      },
      stressed: {
        categories: "16021",
        type: "A nearby body of water",
        reason: "Blue spaces calm the nervous system",
        benefits: "Water sounds lower blood pressure and reduce tension",
      },
      excited: {
        categories: "10027",
        type: "An art museum or gallery",
        reason: "Channel energy into inspiration",
        benefits: "Visual engagement sustains positive momentum",
      },
    }

    const placeData = moodPlaces[detectedMood] || moodPlaces.anxious

    if (latitude && longitude && process.env.FOURSQUARE_API_KEY) {
      const response = await retryFetch(
        `https://api.foursquare.com/v3/places/search?categories=${placeData.categories}&ll=${latitude},${longitude}&radius=5000&limit=1&sort=POPULARITY`,
        {
          headers: {
            Authorization: process.env.FOURSQUARE_API_KEY,
            Accept: "application/json",
          },
        },
        { retries: 2 },
      )

      if (response.ok) {
        const data = (await response.json()) as FoursquareResponse
        if (data.results && data.results.length > 0) {
          const place = data.results[0]
          return {
            type: place.name || placeData.type,
            reason: placeData.reason,
            benefits: placeData.benefits,
            address: place.location?.formatted_address,
            coordinates: place.location?.lat && place.location?.lng
              ? { lat: place.location.lat, lng: place.location.lng }
              : undefined,
          }
        }
      }
    }

    return placeData
  } catch (error) {
    console.error("[v0] Place recommendation error:", error)
    warnings?.push("Provided saved place suggestion due to place lookup failure.")

    const fallbacks: Record<string, { type: string; reason: string; benefits: string }> = {
      anxious: {
        type: "A botanical garden",
        reason: "Nature exposure reduces cortisol by 21%",
        benefits: "Green spaces calm the nervous system",
      },
      happy: {
        type: "A hilltop viewpoint",
        reason: "Expansive views amplify positive emotions",
        benefits: "Height enhances feelings of possibility",
      },
    }

    return fallbacks[detectedMood] ?? fallbacks.anxious
  }
}
export async function generateEmpathyRecommendations(input: EmpathyInput): Promise<EmpathyResponse> {
  const validMood = ensureValidMood(input.detectedMood)
  const trimmedContext = input.context ? input.context.slice(-600) : undefined
  const normalizedInput: EmpathyInput = {
    ...input,
    detectedMood: validMood,
    context: trimmedContext,
    emotions: input.emotions,
  }

  const confidence = calculateConfidence(normalizedInput)
  const analysisSummary = buildAnalysisSummary(normalizedInput, validMood, confidence)
  const analysisSources = buildAnalysisSources(normalizedInput)
  const warnings: string[] = []

  try {
    console.log("[v0] Generating empathy recommendations for mood:", validMood)

    const results = await Promise.allSettled([
      generatePersonalizedEmpathy(normalizedInput, warnings),
      getMusicRecommendation(validMood, warnings),
      getBookRecommendation(validMood, warnings),
      getQuoteRecommendation(validMood, warnings),
      getPlaceRecommendation(validMood, normalizedInput.latitude, normalizedInput.longitude, warnings),
    ])

    console.log(
      "[v0] API results status:",
      results.map((r) => r.status),
    )

    const empathyData =
      results[0].status === "fulfilled" && results[0].value
        ? results[0].value
        : {
            empathyMessage: empathyResponses[validMood].empathyMessage,
            recommendation: empathyResponses[validMood].recommendation,
          }

    const music =
      results[1].status === "fulfilled" && results[1].value ? results[1].value : empathyResponses[validMood].music

    const book =
      results[2].status === "fulfilled" && results[2].value ? results[2].value : empathyResponses[validMood].book

    const quote =
      results[3].status === "fulfilled" && results[3].value ? results[3].value : empathyResponses[validMood].quote

    const place =
      results[4].status === "fulfilled" && results[4].value ? results[4].value : empathyResponses[validMood].place

    const response: EmpathyResponse = {
      detectedMood: validMood,
      confidence,
      analysisSummary,
      analysisSources,
      empathyMessage: empathyData.empathyMessage || empathyResponses[validMood].empathyMessage,
      recommendation: empathyData.recommendation || empathyResponses[validMood].recommendation,
      quote: quote || empathyResponses[validMood].quote,
      music: music || empathyResponses[validMood].music,
      book: book || empathyResponses[validMood].book,
      place: place || empathyResponses[validMood].place,
      warnings: warnings.length ? warnings : undefined,
    }

    console.log("[v0] Successfully generated empathy recommendations")
    return response
  } catch (error) {
    console.error("[v0] Error generating empathy recommendations:", error)
    warnings.push("Displayed saved recommendations because live services were unavailable.")
    return {
      detectedMood: validMood,
      confidence,
      analysisSummary,
      analysisSources,
      ...empathyResponses[validMood],
      warnings,
    }
  }
}

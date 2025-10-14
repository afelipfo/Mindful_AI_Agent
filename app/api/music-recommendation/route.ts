import { type NextRequest, NextResponse } from "next/server"

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

export async function POST(request: NextRequest) {
  const parsedBody: Partial<{ detectedMood: string }> = await request
    .json()
    .catch(() => ({ detectedMood: "anxious" }))

  const detectedMoodKey = parsedBody.detectedMood ?? "anxious"

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

    const features = moodFeatures[detectedMoodKey] || moodFeatures.anxious

    // Get Spotify access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })

    if (!tokenResponse.ok) {
      throw new Error("Failed to get Spotify token")
    }

    const { access_token } = await tokenResponse.json()

    // Get music recommendations
    const recommendationsUrl = `https://api.spotify.com/v1/recommendations?limit=1&seed_genres=ambient,classical,acoustic&target_valence=${features.valence}&target_energy=${features.energy}&min_tempo=${features.tempo.min}&max_tempo=${features.tempo.max}`

    const musicResponse = await fetch(recommendationsUrl, {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!musicResponse.ok) {
      throw new Error("Failed to get music recommendations")
    }

    const data = (await musicResponse.json()) as SpotifyRecommendationResponse
    const track = data.tracks?.[0]

    if (!track) {
      throw new Error("No tracks found")
    }

    return NextResponse.json({
      title: track.name,
      artist: track.artists[0].name,
      reason: `Selected for its ${features.valence > 0.6 ? "uplifting" : "calming"} qualities to match your mood`,
      spotifyUrl: track.external_urls.spotify,
      appleMusicUrl: `https://music.apple.com/search?term=${encodeURIComponent(`${track.name} ${track.artists[0].name}`)}`,
    })
  } catch (error) {
    console.error("[v0] Music recommendation error:", error)

    // Fallback recommendations
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

    return NextResponse.json(fallbacks[detectedMoodKey] ?? fallbacks.anxious)
  }
}

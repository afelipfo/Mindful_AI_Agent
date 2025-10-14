import { type NextRequest, NextResponse } from "next/server"

interface FoursquarePlace {
  name?: string
  location?: {
    formatted_address?: string
  }
}

interface FoursquareResponse {
  results: FoursquarePlace[]
}

export async function POST(request: NextRequest) {
  const parsedBody: Partial<{ detectedMood: string; latitude: number; longitude: number }> = await request
    .json()
    .catch(() => ({}))

  const detectedMoodKey = parsedBody.detectedMood ?? "anxious"
  const latitude = typeof parsedBody.latitude === "number" ? parsedBody.latitude : undefined
  const longitude = typeof parsedBody.longitude === "number" ? parsedBody.longitude : undefined

  try {

    // Mood to place type mapping
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

    const placeData = moodPlaces[detectedMoodKey] || moodPlaces.anxious

    // If coordinates provided, try Foursquare API
    if (latitude && longitude && process.env.FOURSQUARE_API_KEY) {
      const response = await fetch(
        `https://api.foursquare.com/v3/places/search?categories=${placeData.categories}&ll=${latitude},${longitude}&radius=5000&limit=1&sort=POPULARITY`,
        {
          headers: {
            Authorization: process.env.FOURSQUARE_API_KEY,
            Accept: "application/json",
          },
        },
      )

      if (response.ok) {
        const data = (await response.json()) as FoursquareResponse
        if (data.results && data.results.length > 0) {
          const place = data.results[0]
          return NextResponse.json({
            type: place.name || placeData.type,
            reason: placeData.reason,
            benefits: placeData.benefits,
            address: place.location?.formatted_address,
          })
        }
      }
    }

    // Return generic recommendation
    return NextResponse.json(placeData)
  } catch (error) {
    console.error("[v0] Place recommendation error:", error)

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

    return NextResponse.json(fallbacks[detectedMoodKey] ?? fallbacks.anxious)
  }
}

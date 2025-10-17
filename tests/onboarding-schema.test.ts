import test from "node:test"
import assert from "node:assert/strict"

import { onboardingRequestSchema } from "../lib/validations/onboarding"

const baseMoodEntry = {
  moodScore: 6,
  energyLevel: 5,
  emotions: ["calm"],
  triggers: ["work"],
  coping: ["walk"],
  entryType: "text" as const,
}

test("onboarding request schema accepts minimal valid payload", () => {
  const parsed = onboardingRequestSchema.parse({
    responses: [
      {
        step: 1,
        stepTitle: "Context",
        response: "Feeling pretty balanced today.",
      },
    ],
    moodEntry: baseMoodEntry,
    summary: {
      analysisSummary: "Balanced mood detected.",
      confidence: 60,
      detectedMood: "calm",
    },
  })

  assert.equal(parsed.moodEntry.moodScore, 6)
  assert.equal(parsed.responses?.length, 1)
})

test("onboarding request schema rejects invalid step index", () => {
  assert.throws(() =>
    onboardingRequestSchema.parse({
      responses: [
        {
          step: 0,
          stepTitle: "Invalid",
          response: "this should fail",
        },
      ],
      moodEntry: baseMoodEntry,
    }),
  )
})

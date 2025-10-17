import test from "node:test"
import assert from "node:assert/strict"

import { empathyRecommendationSchema } from "../lib/validations/empathy"
import { detectMoodCategory } from "../lib/empathy-agent"

test("empathy recommendation schema allows minimal payload", () => {
  const payload = {
    context: "Feeling a little overwhelmed after meetings.",
    moodScore: 4,
    energyLevel: 3,
    emotions: ["stressed"],
  }

  const parsed = empathyRecommendationSchema.parse(payload)
  assert.equal(parsed.moodScore, 4)
  assert.equal(parsed.emotions?.[0], "stressed")
})

test("detectMoodCategory prioritises explicit emotions", () => {
  const mood = detectMoodCategory(["Excited", "Motivated"], 5)
  assert.equal(mood, "excited")
})

import test from "node:test"
import assert from "node:assert/strict"
import {
  aggregateEnergyByEntries,
  normalizeCopingEffectiveness,
  normalizeTriggerFrequency,
} from "../lib/analytics"
import type { MoodEntry } from "../types/wellness"

const sampleEntries: MoodEntry[] = [
  {
    id: "1",
    date: "2024-10-10",
    mood: 7,
    energy: 6,
    emotions: ["calm"],
    triggers: ["poor sleep"],
    coping: ["meditation"],
    type: "text",
    createdAt: "2024-10-10T08:15:00Z",
  },
  {
    id: "2",
    date: "2024-10-11",
    mood: 5,
    energy: 4,
    emotions: ["anxious"],
    triggers: ["work"],
    coping: ["walk"],
    type: "text",
    createdAt: "2024-10-11T19:45:00Z",
  },
  {
    id: "3",
    date: "2024-10-11",
    mood: 6,
    energy: 8,
    emotions: ["focused"],
    triggers: ["work"],
    coping: ["walk"],
    type: "text",
    createdAt: "2024-10-11T13:00:00Z",
  },
]

test("normalizeTriggerFrequency aggregates occurrences", () => {
  const result = normalizeTriggerFrequency(sampleEntries)
  assert.equal(result["poor sleep"], 1)
  assert.equal(result["work"], 2)
})

test("normalizeCopingEffectiveness averages mood per strategy", () => {
  const result = normalizeCopingEffectiveness(sampleEntries)
  assert.equal(result["meditation"], 7)
  assert.equal(result["walk"], 5.5)
})

test("aggregateEnergyByEntries buckets by day and period", () => {
  const buckets = aggregateEnergyByEntries(sampleEntries)
  const lookup: Record<string, number> = {}
  buckets.forEach((bucket) => {
    lookup[`${bucket.day}-${bucket.hour}`] = bucket.energy
  })
  assert.equal(lookup["Thu-8"], 6)
  assert.equal(lookup["Fri-14"], 8)
  assert.equal(lookup["Fri-20"], 4)
})

import test from "node:test"
import assert from "node:assert/strict"

import { signupSchema, signinSchema } from "../lib/validations/auth"

test("signup schema requires email and password", () => {
  const valid = signupSchema.parse({
    email: "user@example.com",
    password: "supersecret",
    fullName: "User",
  })
  assert.equal(valid.email, "user@example.com")
})

test("signin schema rejects blank password", () => {
  assert.throws(() => signinSchema.parse({ email: "user@example.com", password: "" }))
})

import test from "node:test"
import assert from "node:assert/strict"

import { reducer } from "../components/ui/use-toast"

test("toast reducer adds and dismisses notifications", () => {
  const state = { toasts: [] as Array<{ id: string; open?: boolean }> }
  const added = reducer(state, {
    type: "ADD_TOAST",
    toast: { id: "1", title: "Saved", open: true },
  })
  assert.equal(added.toasts.length, 1)
  assert.equal(added.toasts[0].id, "1")

  const dismissed = reducer(added, {
    type: "DISMISS_TOAST",
    toastId: "1",
  })
  assert.equal(dismissed.toasts[0].open, false)
})

test("toast reducer removes toast", () => {
  const populated = {
    toasts: [
      { id: "a", open: true },
      { id: "b", open: true },
    ],
  }

  const result = reducer(populated, {
    type: "REMOVE_TOAST",
    toastId: "a",
  })

  assert.equal(result.toasts.length, 1)
  assert.equal(result.toasts[0].id, "b")
})

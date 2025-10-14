import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const client = tryCreateAdminClient()
  if (!client) {
    throw new Error("Supabase admin credentials are not configured")
  }
  return client
}

export function tryCreateAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}

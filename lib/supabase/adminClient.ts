import "server-only"

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type SupabaseAdminEnv = {
  url: string
  serviceRoleKey: string
}

let adminClient: SupabaseClient | null = null

const getEnv = (): SupabaseAdminEnv => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error("Supabase URL is not configured")
  }

  if (!serviceRoleKey) {
    throw new Error("Supabase service role key is not configured")
  }

  return { url, serviceRoleKey }
}

export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!adminClient) {
    const env = getEnv()

    adminClient = createClient(env.url, env.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch,
      },
    })
  }

  return adminClient
}

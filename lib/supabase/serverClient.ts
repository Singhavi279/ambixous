import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type CookieStore = ReturnType<typeof cookies>

type ServerClient = SupabaseClient

type ServiceRoleClient = SupabaseClient

const getEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

const getServiceEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    return null
  }

  return { url, serviceRoleKey }
}

const createCookieAdapter = (store: CookieStore) => {
  return {
    get(name: string) {
      return store.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        store.set({ name, value, ...options })
      } catch (error) {
        console.error("Failed to set Supabase auth cookie", error)
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        store.set({ name, value: "", ...options, maxAge: 0 })
      } catch (error) {
        console.error("Failed to remove Supabase auth cookie", error)
      }
    },
  }
}

export const getSupabaseServerClient = (): ServerClient | null => {
  const env = getEnv()
  if (!env) {
    return null
  }

  const store = cookies()
  return createServerClient(env.url, env.anonKey, {
    cookies: createCookieAdapter(store),
  })
}

let serviceRoleClient: ServiceRoleClient | null = null

export const getSupabaseServiceRoleClient = (): ServiceRoleClient | null => {
  if (serviceRoleClient) {
    return serviceRoleClient
  }

  const env = getServiceEnv()
  if (!env) {
    return null
  }

  serviceRoleClient = createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch,
    },
  })

  return serviceRoleClient
}

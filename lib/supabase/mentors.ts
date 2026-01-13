import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Mentor {
  id: string
  name: string
  linkedin_url: string
  brand_name: string
  category: "Founders" | "Growth & Marketing" | "Professionals"
  created_at: string
}

export async function getAllMentors(): Promise<Mentor[]> {
  const { data, error } = await supabase.from("mentors").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching mentors:", error)
    return []
  }

  return data || []
}

export async function searchMentors(query: string): Promise<Mentor[]> {
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .or(`name.ilike.%${query}%,brand_name.ilike.%${query}%`)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error searching mentors:", error)
    return []
  }

  return data || []
}

export async function getMentorsByCategory(category: string): Promise<Mentor[]> {
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .eq("category", category)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching mentors by category:", error)
    return []
  }

  return data || []
}

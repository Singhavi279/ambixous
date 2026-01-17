import { supabase } from "./supabase"

export interface Certificate {
    id: string
    candidate_name: string
    designation: string
    domain: string
    tenure_start: string
    tenure_end: string
    issued_at: string
    created_by: string
    created_at?: string
}

export async function getAllCertificates(): Promise<Certificate[]> {
    const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching certificates:", error)
        return []
    }

    return data || []
}

export async function getCertificateById(id: string): Promise<Certificate | null> {
    const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("id", id)
        .single()

    if (error) {
        console.error("Error fetching certificate:", error)
        return null
    }

    return data
}

export async function saveCertificate(certificate: Certificate): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from("certificates")
        .insert([certificate])

    if (error) {
        console.error("Error saving certificate:", error)
        if (error.code === "23505") {
            return { success: false, error: "Certificate ID already exists" }
        }
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function isDuplicateId(id: string): Promise<boolean> {
    const { data, error } = await supabase
        .from("certificates")
        .select("id")
        .eq("id", id)
        .maybeSingle()

    if (error) {
        console.error("Error checking duplicate:", error)
        return false
    }
    return !!data
}

export async function generateCertificateId(): Promise<string> {
    const now = new Date()
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const month = months[now.getMonth()]
    const year = String(now.getFullYear()).slice(-2)
    const prefix = `AMBX${month}${year}`

    // Retry logic to handle race conditions
    const maxRetries = 5
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        // Get the latest certificate with this prefix
        const { data } = await supabase
            .from("certificates")
            .select("id")
            .like("id", `${prefix}%`)
            .order("id", { ascending: false })
            .limit(1)

        let nextNum = 1
        if (data && data.length > 0) {
            const lastId = data[0].id
            const lastNum = parseInt(lastId.slice(-4)) || 0
            nextNum = lastNum + 1 + attempt // Add attempt offset for retries
        }

        const candidateId = `${prefix}${String(nextNum).padStart(4, "0")}`

        // Check if this ID already exists (race condition check)
        const isDuplicate = await isDuplicateId(candidateId)
        if (!isDuplicate) {
            return candidateId
        }
    }

    // Fallback: generate with timestamp suffix if all retries fail
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}${timestamp}`
}

export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    })
}

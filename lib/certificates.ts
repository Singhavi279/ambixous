import { getDb } from "@/lib/db"

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

function rowToCertificate(row: Record<string, unknown>): Certificate {
    return {
        id: String(row.id),
        candidate_name: String(row.candidate_name),
        designation: String(row.designation),
        domain: String(row.domain),
        tenure_start: String(row.tenure_start ?? ""),
        tenure_end: String(row.tenure_end ?? ""),
        issued_at: String(row.issued_at),
        created_by: String(row.created_by),
        created_at: String(row.created_at),
    }
}

export async function getAllCertificates(): Promise<Certificate[]> {
    const db = await getDb()
    const result = await db.execute("SELECT * FROM certificates ORDER BY created_at DESC")
    return result.rows.map((r) => rowToCertificate(r as unknown as Record<string, unknown>))
}

export async function getCertificateById(id: string): Promise<Certificate | null> {
    const db = await getDb()
    const result = await db.execute({ sql: "SELECT * FROM certificates WHERE id = ?", args: [id] })
    return result.rows[0] ? rowToCertificate(result.rows[0] as unknown as Record<string, unknown>) : null
}

export async function saveCertificate(certificate: Certificate): Promise<{ success: boolean; error?: string }> {
    const db = await getDb()
    const result = await db.execute({
        sql: `INSERT OR IGNORE INTO certificates
            (id, candidate_name, designation, domain, tenure_start, tenure_end, issued_at, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            certificate.id,
            certificate.candidate_name,
            certificate.designation,
            certificate.domain,
            certificate.tenure_start,
            certificate.tenure_end,
            certificate.issued_at,
            certificate.created_by,
            certificate.created_at || new Date().toISOString(),
        ],
    })
    if (result.rowsAffected === 0) {
        return { success: false, error: "Certificate ID already exists" }
    }
    return { success: true }
}

export async function isDuplicateId(id: string): Promise<boolean> {
    return (await getCertificateById(id)) !== null
}

export async function generateCertificateId(): Promise<string> {
    const now = new Date()
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const month = months[now.getMonth()]
    const year = String(now.getFullYear()).slice(-2)
    const prefix = `AMBX${month}${year}`

    const db = await getDb()
    const result = await db.execute({
        sql: "SELECT id FROM certificates WHERE id LIKE ?",
        args: [`${prefix}%`],
    })

    const maxNum = result.rows
        .map((r) => String(r.id).match(/^AMBX[A-Z]{3}\d{2}(\d{4})$/))
        .reduce((max, m) => (m ? Math.max(max, parseInt(m[1])) : max), 0)

    return `${prefix}${String(maxNum + 1).padStart(4, "0")}`
}

export function formatDate(dateStr: string | Date): string {
    const d =
        typeof dateStr === "string"
            ? (() => {
                  const [y, m, day] = dateStr.split("-")
                  return new Date(+y, +m - 1, +day)
              })()
            : dateStr
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    })
}

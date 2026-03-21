import * as fs from "fs"
import * as path from "path"

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

interface CertificatesData {
    certificates: Certificate[]
}

const DATA_PATH = path.join(process.cwd(), "data", "certificates.json")

function readData(): CertificatesData {
    const raw = fs.readFileSync(DATA_PATH, "utf-8")
    return JSON.parse(raw) as CertificatesData
}

function writeData(data: CertificatesData): void {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8")
}

export function getAllCertificates(): Certificate[] {
    const { certificates } = readData()
    // Sort by created_at desc (newest first)
    return certificates.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
    })
}

export function getCertificateById(id: string): Certificate | null {
    const { certificates } = readData()
    return certificates.find((c) => c.id === id) || null
}

export function saveCertificate(certificate: Certificate): { success: boolean; error?: string } {
    const data = readData()

    // Check for duplicate
    if (data.certificates.some((c) => c.id === certificate.id)) {
        return { success: false, error: "Certificate ID already exists" }
    }

    data.certificates.push({
        ...certificate,
        created_at: certificate.created_at || new Date().toISOString(),
    })

    writeData(data)
    return { success: true }
}

export function isDuplicateId(id: string): boolean {
    const { certificates } = readData()
    return certificates.some((c) => c.id === id)
}

export function generateCertificateId(): string {
    const now = new Date()
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const month = months[now.getMonth()]
    const year = String(now.getFullYear()).slice(-2)
    const prefix = `AMBX${month}${year}`

    const { certificates } = readData()

    // Find existing certificates with this prefix
    const matching = certificates
        .filter((c) => c.id.startsWith(prefix))
        .map((c) => parseInt(c.id.slice(-4)) || 0)

    const maxNum = matching.length > 0 ? Math.max(...matching) : 0
    const nextNum = maxNum + 1

    return `${prefix}${String(nextNum).padStart(4, "0")}`
}

export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    })
}

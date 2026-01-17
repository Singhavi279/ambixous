import fs from "fs"
import path from "path"

export interface Certificate {
    id: string
    candidateName: string
    designation: string
    domain: string
    tenureStart: string
    tenureEnd: string
    issuedAt: string
    createdBy: string
}

const DATA_FILE = path.join(process.cwd(), "data", "certificates.json")

// Ensure data directory and file exist
function ensureDataFile() {
    const dir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]), "utf-8")
    }
}

export function getAllCertificates(): Certificate[] {
    ensureDataFile()
    const data = fs.readFileSync(DATA_FILE, "utf-8")
    return JSON.parse(data)
}

export function getCertificateById(id: string): Certificate | null {
    const certificates = getAllCertificates()
    return certificates.find((cert) => cert.id === id) || null
}

export function saveCertificate(certificate: Certificate): { success: boolean; error?: string } {
    const certificates = getAllCertificates()

    // Check for duplicate ID
    if (certificates.some((cert) => cert.id === certificate.id)) {
        return { success: false, error: "Certificate ID already exists" }
    }

    certificates.push(certificate)
    fs.writeFileSync(DATA_FILE, JSON.stringify(certificates, null, 2), "utf-8")
    return { success: true }
}

export function generateCertificateId(): string {
    const certificates = getAllCertificates()
    const now = new Date()

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const month = months[now.getMonth()]
    const year = String(now.getFullYear()).slice(-2)
    const prefix = `AMBX${month}${year}`

    // Find highest number for this month/year
    const matching = certificates.filter((c) => c.id.startsWith(prefix))
    const maxNum = matching.length > 0
        ? Math.max(...matching.map((c) => parseInt(c.id.slice(-4)) || 0))
        : 0

    const nextNum = String(maxNum + 1).padStart(4, "0")
    return `${prefix}${nextNum}`
}

export function isValidCertificateId(id: string): boolean {
    // Format: AMBXJAN260001
    const regex = /^AMBX(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d{2}\d{4}$/
    return regex.test(id)
}

export function isDuplicateId(id: string): boolean {
    const certificates = getAllCertificates()
    return certificates.some((cert) => cert.id === id)
}

export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date
    return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    })
}

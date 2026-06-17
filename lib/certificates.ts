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

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main"
const GITHUB_FILE_PATH = "data/certificates.json"

async function readData(): Promise<{ data: CertificatesData; sha: string }> {
    if (GITHUB_TOKEN && GITHUB_REPO) {
        const res = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`,
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: "application/vnd.github+json",
                },
                cache: "no-store",
            }
        )
        if (!res.ok) throw new Error(`GitHub API read failed: ${res.status}`)
        const json = await res.json()
        const content = Buffer.from(json.content, "base64").toString("utf-8")
        return { data: JSON.parse(content) as CertificatesData, sha: json.sha }
    }
    // Local dev fallback
    const raw = fs.readFileSync(DATA_PATH, "utf-8")
    return { data: JSON.parse(raw) as CertificatesData, sha: "" }
}

async function writeData(data: CertificatesData, sha: string, commitMessage: string): Promise<void> {
    if (GITHUB_TOKEN && GITHUB_REPO) {
        const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64")
        const res = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: "application/vnd.github+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content,
                    sha,
                    branch: GITHUB_BRANCH,
                }),
            }
        )
        if (!res.ok) {
            const err = await res.json()
            throw new Error(`GitHub API write failed: ${err.message}`)
        }
        return
    }
    // Local dev fallback
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8")
}

export async function getAllCertificates(): Promise<Certificate[]> {
    const { data } = await readData()
    return data.certificates.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
    })
}

export async function getCertificateById(id: string): Promise<Certificate | null> {
    const { data } = await readData()
    return data.certificates.find((c) => c.id === id) || null
}

export async function saveCertificate(certificate: Certificate): Promise<{ success: boolean; error?: string }> {
    const { data, sha } = await readData()

    if (data.certificates.some((c) => c.id === certificate.id)) {
        return { success: false, error: "Certificate ID already exists" }
    }

    data.certificates.push({
        ...certificate,
        created_at: certificate.created_at || new Date().toISOString(),
    })

    await writeData(data, sha, `Add certificate ${certificate.id}`)
    return { success: true }
}

export async function isDuplicateId(id: string): Promise<boolean> {
    const { data } = await readData()
    return data.certificates.some((c) => c.id === id)
}

export async function generateCertificateId(): Promise<string> {
    const now = new Date()
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const month = months[now.getMonth()]
    const year = String(now.getFullYear()).slice(-2)
    const prefix = `AMBX${month}${year}`

    const { data } = await readData()

    const matching = data.certificates
        .filter((c) => c.id.startsWith(prefix))
        .map((c) => {
            const match = c.id.match(/^AMBX[A-Z]{3}\d{2}(\d{4})$/)
            return match ? parseInt(match[1]) : 0
        })

    const maxNum = matching.length > 0 ? Math.max(...matching) : 0
    const nextNum = maxNum + 1

    return `${prefix}${String(nextNum).padStart(4, "0")}`
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

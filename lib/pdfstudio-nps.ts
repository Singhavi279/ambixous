import * as fs from "node:fs"
import * as path from "node:path"

export const NPS_REASONS = [
  "ease-of-use",
  "editing-quality",
  "privacy",
  "missing-feature",
  "performance",
] as const

export type NpsReason = (typeof NPS_REASONS)[number]

export interface PdfStudioNpsResponse {
  submissionId: string
  score: number
  reason: NpsReason | null
  timestamp: string
  pageCount: number | null
  editCount: number
  featuresUsed: string[]
  release: string | null
  privacyVersion: 1
}

interface NpsData {
  responses: PdfStudioNpsResponse[]
}

const LOCAL_DATA_PATH = path.join(process.cwd(), "data", "pdfstudionps.json")
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_FILE_PATH = "data/pdfstudionps.json"
const GITHUB_BRANCH = process.env.PDFSTUDIO_NPS_BRANCH || "pdfstudio-nps-data"

export function isNpsStorageConfigured(): boolean {
  return Boolean(GITHUB_TOKEN && GITHUB_REPO)
}

export async function savePdfStudioNps(response: PdfStudioNpsResponse): Promise<void> {
  if (!isNpsStorageConfigured()) {
    saveLocally(response)
    return
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, sha } = await readFromGitHub()
    if (data.responses.some((item) => item.submissionId === response.submissionId)) return

    data.responses.push(response)
    const result = await writeToGitHub(data, sha)
    if (result === "saved") return
  }

  throw new Error("NPS storage was updated concurrently; retry the submission")
}

async function readFromGitHub(): Promise<{ data: NpsData; sha: string }> {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}?ref=${encodeURIComponent(GITHUB_BRANCH)}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    },
  )

  if (!response.ok) throw new Error(`NPS storage read failed: ${response.status}`)
  const payload = await response.json()
  const content = Buffer.from(payload.content, "base64").toString("utf8")
  return { data: parseData(content), sha: payload.sha }
}

async function writeToGitHub(data: NpsData, sha: string): Promise<"saved" | "conflict"> {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        message: "Record PDF Studio NPS response",
        content: Buffer.from(`${JSON.stringify(data, null, 2)}\n`).toString("base64"),
        sha,
        branch: GITHUB_BRANCH,
      }),
    },
  )

  if (response.ok) return "saved"
  if (response.status === 409 || response.status === 422) return "conflict"
  throw new Error(`NPS storage write failed: ${response.status}`)
}

function saveLocally(response: PdfStudioNpsResponse): void {
  const data = parseData(fs.readFileSync(LOCAL_DATA_PATH, "utf8"))
  if (data.responses.some((item) => item.submissionId === response.submissionId)) return
  data.responses.push(response)
  fs.writeFileSync(LOCAL_DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8")
}

function parseData(content: string): NpsData {
  const parsed = JSON.parse(content) as Partial<NpsData>
  if (!Array.isArray(parsed.responses)) throw new Error("Invalid PDF Studio NPS data file")
  return { responses: parsed.responses }
}

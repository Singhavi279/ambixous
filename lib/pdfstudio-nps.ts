import { getDb, isDbConfigured } from "@/lib/db"

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

export function isNpsStorageConfigured(): boolean {
  return isDbConfigured()
}

export async function savePdfStudioNps(response: PdfStudioNpsResponse): Promise<void> {
  const db = await getDb()
  await db.execute({
    sql: `INSERT OR IGNORE INTO pdfstudio_nps
      (submission_id, score, reason, timestamp, page_count, edit_count, features_used, release, privacy_version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      response.submissionId,
      response.score,
      response.reason,
      response.timestamp,
      response.pageCount,
      response.editCount,
      JSON.stringify(response.featuresUsed),
      response.release,
      response.privacyVersion,
    ],
  })
}

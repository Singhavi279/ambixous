import { NextRequest, NextResponse } from "next/server"
import {
  isNpsStorageConfigured,
  NPS_REASONS,
  savePdfStudioNps,
  type NpsReason,
  type PdfStudioNpsResponse,
} from "@/lib/pdfstudio-nps"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BODY_BYTES = 4_096
const ALLOWED_FEATURES = new Set([
  "text",
  "existing-text",
  "image",
  "signature",
  "shape",
  "annotation",
  "whiteout",
  "link",
  "form",
  "freehand",
  "object-capture",
])

export async function GET() {
  return NextResponse.json(
    {
      ready: isNpsStorageConfigured(),
      storage: isNpsStorageConfigured() ? "turso" : "local-sqlite",
      privacy: "anonymous-no-network-or-device-identifiers",
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }

  try {
    const body = await request.json()
    const score = Number(body.score)
    const reason = body.reason === null || body.reason === undefined ? null : String(body.reason)
    const submissionId = String(body.submissionId || "")

    if (!Number.isInteger(score) || score < 0 || score > 10) {
      return NextResponse.json({ error: "Score must be an integer from 0 to 10" }, { status: 400 })
    }
    if (reason !== null && !NPS_REASONS.includes(reason as NpsReason)) {
      return NextResponse.json({ error: "Invalid reason" }, { status: 400 })
    }
    if (!/^[a-zA-Z0-9-]{16,64}$/.test(submissionId)) {
      return NextResponse.json({ error: "Invalid submission identifier" }, { status: 400 })
    }

    const origin = request.headers.get("origin")
    if (origin && !isAllowedOrigin(origin)) {
      return NextResponse.json({ error: "Origin not allowed" }, { status: 403 })
    }

    const featuresUsed: string[] = Array.isArray(body.featuresUsed)
      ? [...new Set<string>((body.featuresUsed as unknown[]).map(String).filter((item) => ALLOWED_FEATURES.has(item)))].slice(0, 12)
      : []

    const entry: PdfStudioNpsResponse = {
      submissionId,
      score,
      reason: reason as NpsReason | null,
      timestamp: new Date().toISOString(),
      pageCount: normalizeInteger(body.pageCount, 1, 10_000),
      editCount: normalizeInteger(body.editCount, 0, 100_000) || 0,
      featuresUsed,
      release: process.env.VERCEL_GIT_COMMIT_SHA || null,
      privacyVersion: 1,
    }

    await savePdfStudioNps(entry)
    return NextResponse.json({ saved: true }, { status: 201, headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("PDF Studio NPS submission failed", error)
    return NextResponse.json({ error: "Feedback could not be saved" }, { status: 503 })
  }
}

function normalizeInteger(value: unknown, minimum: number, maximum: number): number | null {
  const number = Number(value)
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : null
}

function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    return url.hostname === "ambixous.in" || url.hostname === "www.ambixous.in" || url.hostname === "localhost" || url.hostname === "127.0.0.1"
  } catch {
    return false
  }
}

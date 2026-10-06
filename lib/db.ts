import { createClient, type Client } from "@libsql/client"
import * as fs from "node:fs"
import * as path from "node:path"

// Production: Turso (TURSO_DATABASE_URL + TURSO_AUTH_TOKEN).
// Local dev without env vars: a SQLite file at data/local.db (gitignored).
function resolveUrl(): string {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL
  if (process.env.VERCEL) return ""
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true })
  return `file:${path.join(process.cwd(), "data", "local.db")}`
}

const url = resolveUrl()

let client: Client | null = null
let ready: Promise<void> | null = null

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    candidate_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    domain TEXT NOT NULL,
    tenure_start TEXT NOT NULL DEFAULT '',
    tenure_end TEXT NOT NULL DEFAULT '',
    issued_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS pdfstudio_nps (
    submission_id TEXT PRIMARY KEY,
    score INTEGER NOT NULL,
    reason TEXT,
    timestamp TEXT NOT NULL,
    page_count INTEGER,
    edit_count INTEGER NOT NULL DEFAULT 0,
    features_used TEXT NOT NULL DEFAULT '[]',
    release TEXT,
    privacy_version INTEGER NOT NULL DEFAULT 1
  )`,
]

export function isDbConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL)
}

export async function getDb(): Promise<Client> {
  if (!url) throw new Error("TURSO_DATABASE_URL is not set")
  if (!client) {
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  }
  if (!ready) {
    const c = client
    ready = c.batch(SCHEMA, "write").then(() => undefined)
    ready.catch(() => {
      ready = null
    })
  }
  await ready
  return client
}

// One-off: copy data/certificates.json and data/pdfstudionps.json into the database.
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/import-json-to-db.mjs
import { createClient } from "@libsql/client"
import { readFileSync } from "node:fs"
import path from "node:path"

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), "data", "local.db")}`
const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
const read = (f) => JSON.parse(readFileSync(path.join(process.cwd(), "data", f), "utf8"))

await db.batch([
  `CREATE TABLE IF NOT EXISTS certificates (id TEXT PRIMARY KEY, candidate_name TEXT NOT NULL, designation TEXT NOT NULL, domain TEXT NOT NULL, tenure_start TEXT NOT NULL DEFAULT '', tenure_end TEXT NOT NULL DEFAULT '', issued_at TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS pdfstudio_nps (submission_id TEXT PRIMARY KEY, score INTEGER NOT NULL, reason TEXT, timestamp TEXT NOT NULL, page_count INTEGER, edit_count INTEGER NOT NULL DEFAULT 0, features_used TEXT NOT NULL DEFAULT '[]', release TEXT, privacy_version INTEGER NOT NULL DEFAULT 1)`,
], "write")

const certs = read("certificates.json").certificates
const nps = read("pdfstudionps.json").responses

await db.batch([
  ...certs.map((c) => ({
    sql: `INSERT OR IGNORE INTO certificates VALUES (?,?,?,?,?,?,?,?,?)`,
    args: [c.id, c.candidate_name, c.designation, c.domain, c.tenure_start || "", c.tenure_end || "", c.issued_at, c.created_by, c.created_at || new Date().toISOString()],
  })),
  ...nps.map((r) => ({
    sql: `INSERT OR IGNORE INTO pdfstudio_nps VALUES (?,?,?,?,?,?,?,?,?)`,
    args: [r.submissionId, r.score, r.reason, r.timestamp, r.pageCount, r.editCount, JSON.stringify(r.featuresUsed || []), r.release, r.privacyVersion ?? 1],
  })),
], "write")

console.log(`Imported ${certs.length} certificates, ${nps.length} NPS responses into ${url.split("?")[0]}`)

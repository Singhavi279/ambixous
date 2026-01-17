import { NextResponse } from "next/server"
import { generateCertificateId } from "@/lib/certificates"

// GET /api/certificates/generate-id - Generate next certificate ID
export async function GET() {
    const id = generateCertificateId()
    return NextResponse.json({ id })
}

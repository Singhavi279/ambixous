import { NextRequest, NextResponse } from "next/server"
import { getCertificateById } from "@/lib/certificates"

// GET /api/certificates/[id] - Get single certificate (public)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const certificate = getCertificateById(id)

    if (!certificate) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    return NextResponse.json({ certificate })
}

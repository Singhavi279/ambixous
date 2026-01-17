import { NextRequest, NextResponse } from "next/server"
import { getCertificateById } from "@/lib/certificates"

// GET /api/certificates/[id] - Fetch single certificate (public)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const certificate = await getCertificateById(id)

    if (!certificate) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    // Transform snake_case to camelCase for frontend
    return NextResponse.json({
        certificate: {
            id: certificate.id,
            candidateName: certificate.candidate_name,
            designation: certificate.designation,
            domain: certificate.domain,
            tenureStart: certificate.tenure_start,
            tenureEnd: certificate.tenure_end,
            issuedAt: certificate.issued_at,
            createdBy: certificate.created_by,
        },
    })
}

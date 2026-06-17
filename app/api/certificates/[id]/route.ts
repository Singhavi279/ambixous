import { NextRequest, NextResponse } from "next/server"
import { getCertificateById } from "@/lib/certificates"

export const dynamic = "force-dynamic"

// GET /api/certificates/[id] - Fetch single certificate (public)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    // Reject obviously invalid IDs early
    if (!id || !/^AMBX[A-Z]{3}\d{6}$/.test(id)) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    const certificate = await getCertificateById(id)

    if (!certificate) {
        return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

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

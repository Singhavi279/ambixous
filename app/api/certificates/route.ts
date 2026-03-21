import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdmin } from "@/lib/auth"
import { getAllCertificates, saveCertificate, isDuplicateId, Certificate } from "@/lib/certificates"

export const dynamic = "force-dynamic"

// GET /api/certificates - List all certificates (admin only)
export async function GET() {
    const session = await getServerSession(authOptions)
    if (process.env.NODE_ENV !== "development" && (!session || !isAdmin(session.user?.email))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const certificates = getAllCertificates()

    // Transform snake_case to camelCase for frontend
    const transformed = certificates.map(cert => ({
        id: cert.id,
        candidateName: cert.candidate_name,
        designation: cert.designation,
        domain: cert.domain,
        tenureStart: cert.tenure_start,
        tenureEnd: cert.tenure_end,
        issuedAt: cert.issued_at,
        createdBy: cert.created_by,
    }))

    return NextResponse.json({ certificates: transformed })
}

// POST /api/certificates - Create new certificate (admin only)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (process.env.NODE_ENV !== "development" && (!session || !isAdmin(session.user?.email))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, candidateName, designation, domain, tenureStart, tenureEnd, issuedAt, createdBy, createdAt } = body
        
        // Validate required fields
        if (!id || !candidateName || !designation || !domain) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Check for duplicate
        if (isDuplicateId(id)) {
            return NextResponse.json({ error: "Certificate ID already exists" }, { status: 409 })
        }

        const certificate: Certificate = {
            id,
            candidate_name: candidateName,
            designation,
            domain,
            tenure_start: tenureStart || "",
            tenure_end: tenureEnd || "",
            issued_at: issuedAt || new Date().toISOString().split("T")[0],
            created_by: createdBy || session?.user?.email || "admin",
            created_at: createdAt || new Date().toISOString(),
        }

        const result = saveCertificate(certificate)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({ success: true, certificate })
    } catch (error: any) {
        console.error("Error creating certificate:", error)
        return NextResponse.json({ 
            error: "Failed to process request", 
            message: error.message,
            code: error.code
        }, { status: 400 })
    }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdmin } from "@/lib/auth"
import { getAllCertificates, saveCertificate, isDuplicateId, Certificate } from "@/lib/certificates"

// GET /api/certificates - List all certificates (admin only)
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session || !isAdmin(session.user?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const certificates = getAllCertificates()
    return NextResponse.json({ certificates })
}

// POST /api/certificates - Create new certificate (admin only)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session || !isAdmin(session.user?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, candidateName, designation, domain, tenureStart, tenureEnd, issuedAt } = body

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
            candidateName,
            designation,
            domain,
            tenureStart: tenureStart || "",
            tenureEnd: tenureEnd || "",
            issuedAt: issuedAt || new Date().toISOString(),
            createdBy: session.user?.email || "admin",
        }

        const result = saveCertificate(certificate)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        return NextResponse.json({ success: true, certificate })
    } catch (error) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
}

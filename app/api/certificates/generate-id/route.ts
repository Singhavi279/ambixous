import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, isAdmin } from "@/lib/auth"
import { generateCertificateId } from "@/lib/certificates"

export const dynamic = "force-dynamic"

// GET /api/certificates/generate-id - Generate next certificate ID (admin only)
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session || !isAdmin(session.user?.email)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = generateCertificateId()
    return NextResponse.json({ id })
}

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { signPdf, nowInIST } from "@/lib/pdf-signer"
import { sendSignedAgreementMail } from "@/lib/mailer"

export const runtime = "nodejs"

// The static documents everyone signs (served from /public).
const DOCUMENTS = [
    { file: "/agreements/ACF_C1_ParticipantAgreement.pdf", out: "ACF_C1_ParticipantAgreement-signed.pdf" },
    { file: "/agreements/ACF_C1_Brochure.pdf", out: "ACF_C1_Brochure-signed.pdf" },
]

/** Resolve the public base URL for fetching static assets, host-agnostic. */
function getBaseUrl(req: Request): string {
    if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "")
    const url = new URL(req.url)
    return `${url.protocol}//${url.host}`
}

export async function POST(req: Request) {
    // Must be logged in
    const session = await getServerSession(authOptions)
    const sessionEmail = session?.user?.email
    if (!sessionEmail) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let body: {
        name?: string
        phone?: string
        signatureDataUrl?: string
    }
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const name = body.name?.trim()
    const phone = body.phone?.trim()
    const signatureDataUrl = body.signatureDataUrl

    if (!name || !phone || !signatureDataUrl) {
        return NextResponse.json(
            { error: "Name, phone and signature are required" },
            { status: 400 }
        )
    }
    if (!/^data:image\/(png|jpe?g);base64,/.test(signatureDataUrl)) {
        return NextResponse.json(
            { error: "Signature must be a PNG or JPEG image" },
            { status: 400 }
        )
    }

    const signedAtIST = nowInIST()

    try {
        const baseUrl = getBaseUrl(req)
        const attachments = await Promise.all(
            DOCUMENTS.map(async (doc) => {
                const res = await fetch(`${baseUrl}${doc.file}`)
                if (!res.ok) {
                    throw new Error(`Could not load ${doc.file} (${res.status})`)
                }
                const sourceBytes = new Uint8Array(await res.arrayBuffer())
                const content = await signPdf(sourceBytes, {
                    signerName: name,
                    signerEmail: sessionEmail,
                    signerPhone: phone,
                    signedAtIST,
                    signatureDataUrl,
                })
                return {
                    filename: doc.out,
                    content,
                    contentType: "application/pdf",
                }
            })
        )

        await sendSignedAgreementMail({
            signerName: name,
            signerEmail: sessionEmail,
            signerPhone: phone,
            signedAtIST,
            attachments,
        })

        return NextResponse.json({ ok: true, signedAtIST })
    } catch (err) {
        console.error("sign-and-send error:", err)
        return NextResponse.json(
            { error: "Failed to sign and send documents" },
            { status: 500 }
        )
    }
}

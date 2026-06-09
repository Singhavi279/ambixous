import nodemailer from "nodemailer"

export function getTransport() {
    const user = process.env.GMAIL_USER
    const pass = process.env.GMAIL_APP_PASSWORD

    if (!user || !pass) {
        throw new Error(
            "GMAIL_USER and GMAIL_APP_PASSWORD must be set in the environment"
        )
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    })
}

export interface MailAttachment {
    filename: string
    content: Buffer
    contentType?: string
}

export async function sendSignedAgreementMail(opts: {
    signerName: string
    signerEmail: string
    signerPhone: string
    signedAtIST: string
    attachments: MailAttachment[]
}) {
    const { signerName, signerEmail, signerPhone, signedAtIST, attachments } =
        opts
    const transport = getTransport()
    const from = process.env.GMAIL_USER!

    const html = `
        <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
            <h2 style="margin-bottom: 4px;">Ambixous Creator Fellowship — Signed Documents</h2>
            <p style="color:#555; margin-top:0;">Cohort 1 · Graduation Agreement</p>
            <table style="border-collapse: collapse; margin-top: 16px;">
                <tr><td style="padding:4px 12px 4px 0;"><strong>Name</strong></td><td>${escapeHtml(
                    signerName
                )}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;"><strong>Email</strong></td><td>${escapeHtml(
                    signerEmail
                )}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;"><strong>Phone</strong></td><td>${escapeHtml(
                    signerPhone
                )}</td></tr>
                <tr><td style="padding:4px 12px 4px 0;"><strong>Signed at</strong></td><td>${escapeHtml(
                    signedAtIST
                )}</td></tr>
            </table>
            <p style="margin-top:20px; color:#555; font-size: 13px;">
                The signed documents are attached. A digital signature image and an
                IST timestamp have been applied to the footer of every page, and the
                signer consented electronically.
            </p>
        </div>
    `

    return transport.sendMail({
        from: `Ambixous <${from}>`,
        to: "hi.ambixous@gmail.com",
        cc: signerEmail,
        replyTo: signerEmail,
        subject: `Signed Graduation Agreement — ${signerName}`,
        html,
        attachments,
    })
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
}

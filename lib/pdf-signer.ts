import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export interface SignOptions {
    signerName: string
    signerEmail: string
    signerPhone: string
    signedAtIST: string
    // Data URL: "data:image/png;base64,...." (png or jpeg)
    signatureDataUrl: string
}

/**
 * Stamps a digital signature image + IST timestamp onto the footer of every
 * page of the given PDF and returns the new PDF bytes.
 *
 * Takes the source PDF as raw bytes (rather than a filesystem path) so it works
 * in serverless environments where /public files are not on the function disk.
 */
export async function signPdf(
    pdfBytes: Uint8Array | ArrayBuffer,
    opts: SignOptions
): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBytes)

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Embed signature image
    const { mime, bytes } = parseDataUrl(opts.signatureDataUrl)
    const sigImage =
        mime === "image/png"
            ? await pdfDoc.embedPng(bytes)
            : await pdfDoc.embedJpg(bytes)

    // Scale signature to a max height while preserving aspect ratio
    const SIG_MAX_HEIGHT = 28
    const sigScale = SIG_MAX_HEIGHT / sigImage.height
    const sigW = sigImage.width * sigScale
    const sigH = sigImage.height * sigScale

    const pages = pdfDoc.getPages()
    pages.forEach((page) => {
        const { width } = page.getSize()
        const margin = 36
        const footerY = 24

        // Footer separator line
        page.drawLine({
            start: { x: margin, y: footerY + sigH + 6 },
            end: { x: width - margin, y: footerY + sigH + 6 },
            thickness: 0.5,
            color: rgb(0.7, 0.7, 0.7),
        })

        // Signature image (left)
        page.drawImage(sigImage, {
            x: margin,
            y: footerY,
            width: sigW,
            height: sigH,
        })

        // Label under signature
        page.drawText("Digitally signed", {
            x: margin,
            y: footerY - 9,
            size: 6,
            font,
            color: rgb(0.45, 0.45, 0.45),
        })

        // Signer details (right)
        const lines = [
            opts.signerName,
            opts.signerEmail,
            `Signed: ${opts.signedAtIST}`,
        ]
        const rightX = width - margin
        lines.forEach((line, i) => {
            const isName = i === 0
            const usedFont = isName ? fontBold : font
            const size = isName ? 8 : 7
            const textWidth = usedFont.widthOfTextAtSize(line, size)
            page.drawText(line, {
                x: rightX - textWidth,
                y: footerY + sigH - 4 - i * 9,
                size,
                font: usedFont,
                color: rgb(0.2, 0.2, 0.2),
            })
        })
    })

    // Embed signer metadata into the PDF (acts as an audit trail)
    pdfDoc.setSubject(
        `Signed by ${opts.signerName} (${opts.signerEmail}, ${opts.signerPhone}) at ${opts.signedAtIST} IST`
    )
    pdfDoc.setKeywords([
        `signer:${opts.signerEmail}`,
        `phone:${opts.signerPhone}`,
        `signedAt:${opts.signedAtIST}`,
    ])
    pdfDoc.setModificationDate(new Date())
    pdfDoc.setProducer("Ambixous e-Sign")

    const out = await pdfDoc.save()
    return Buffer.from(out)
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } {
    const match = /^data:(image\/(png|jpe?g));base64,(.+)$/i.exec(dataUrl)
    if (!match) {
        throw new Error("Signature must be a base64 PNG or JPEG data URL")
    }
    const mime = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase()
    const bytes = Buffer.from(match[3], "base64")
    return { mime: mime === "image/jpeg" ? "image/jpeg" : "image/png", bytes }
}

/** Returns current time formatted in IST, e.g. "10 Jun 2026, 03:45:12 PM IST". */
export function nowInIST(): string {
    const fmt = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    })
    return `${fmt.format(new Date())} IST`
}

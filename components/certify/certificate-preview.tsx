"use client"

import { Download } from "lucide-react"
import { generateCertificatePDF } from "@/lib/pdf-generator"
import { useState } from "react"

interface CertificatePreviewProps {
    id: string
    candidateName: string
    designation: string
    domain: string
    tenureStart?: string
    tenureEnd?: string
    issueDate?: string
    showDownload?: boolean
}

function formatDisplayDate(dateStr: string | undefined): string {
    if (!dateStr) return "Date"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).toUpperCase()
}

// Inline styles for consistent PDF rendering
const styles = {
    container: {
        width: "100%",
        maxWidth: "595px",
        aspectRatio: "210/297",
        backgroundColor: "#0F172A",
        position: "relative" as const,
        overflow: "hidden",
        margin: "0 auto",
        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
    },
    whiteArea: {
        position: "absolute" as const,
        top: "12px",
        left: "12px",
        right: "12px",
        bottom: "12px",
        backgroundColor: "#ffffff",
    },
    goldBorder: {
        position: "absolute" as const,
        top: "8px",
        left: "8px",
        right: "8px",
        bottom: "8px",
        border: "1px solid #D4AF37",
        pointerEvents: "none" as const,
    },
    cornerOrnament: {
        width: "14px",
        height: "14px",
        backgroundColor: "#D4AF37",
        position: "absolute" as const,
    },
    content: {
        height: "100%",
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        textAlign: "center" as const,
        padding: "28px 40px 20px 40px",
    },
    logo: {
        height: "50px",
        objectFit: "contain" as const,
        marginBottom: "16px",
    },
    title: {
        fontSize: "42px",
        fontWeight: 700,
        color: "#0F172A",
        letterSpacing: "0.1em",
        marginBottom: "4px",
        fontFamily: "'Cinzel', serif",
    },
    subtitle: {
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.35em",
        color: "#D4AF37",
        textTransform: "uppercase" as const,
        marginBottom: "20px",
        fontFamily: "'Montserrat', sans-serif",
    },
    divider: {
        width: "100%",
        maxWidth: "320px",
        height: "1px",
        backgroundColor: "#E2E8F0",
        marginBottom: "20px",
    },
    presentedTo: {
        fontStyle: "italic",
        fontSize: "16px",
        color: "#64748B",
        marginBottom: "10px",
        fontFamily: "'Cormorant Garamond', serif",
    },
    name: {
        fontSize: "44px",
        fontWeight: 700,
        fontStyle: "italic",
        color: "#D4AF37",
        marginBottom: "20px",
        fontFamily: "'Playfair Display', serif",
        lineHeight: 1.1,
    },
    bodyText: {
        fontSize: "12px",
        color: "#475569",
        lineHeight: 1.7,
        maxWidth: "380px",
        marginBottom: "20px",
        fontFamily: "'Montserrat', sans-serif",
    },
    bold: {
        fontWeight: 700,
        color: "#0F172A",
    },
    tenureLabel: {
        fontSize: "9px",
        color: "#94A3B8",
        letterSpacing: "0.3em",
        textTransform: "uppercase" as const,
        marginBottom: "8px",
        fontFamily: "'Montserrat', sans-serif",
    },
    tenureBox: {
        display: "inline-block",
        padding: "8px 24px",
        border: "2px solid #D4AF37",
        borderRadius: "50px",
        marginBottom: "24px",
    },
    tenureText: {
        fontSize: "12px",
        fontWeight: 700,
        color: "#0F172A",
        letterSpacing: "0.05em",
        fontFamily: "'Cinzel', serif",
    },
    signaturesGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "60px",
        width: "100%",
        maxWidth: "320px",
        marginBottom: "16px",
        marginTop: "auto",
    },
    signatureContainer: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
    },
    signatureImg: {
        height: "40px",
        objectFit: "contain" as const,
        marginBottom: "4px",
    },
    signatureLine: {
        width: "100%",
        height: "1px",
        backgroundColor: "#1E293B",
        marginBottom: "4px",
    },
    signatureName: {
        fontSize: "10px",
        fontWeight: 700,
        color: "#0F172A",
        letterSpacing: "0.05em",
        fontFamily: "'Cinzel', serif",
    },
    signatureTitle: {
        fontSize: "8px",
        color: "#64748B",
        fontWeight: 600,
        textTransform: "uppercase" as const,
        letterSpacing: "0.1em",
        fontFamily: "'Montserrat', sans-serif",
    },
    footer: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "9px",
        color: "#64748B",
        letterSpacing: "0.05em",
        marginBottom: "4px",
        fontFamily: "'Montserrat', sans-serif",
    },
    footerBold: {
        fontWeight: 700,
        color: "#0F172A",
    },
    footerSeparator: {
        color: "#CBD5E1",
    },
    verifyUrl: {
        fontSize: "9px",
        color: "#D4AF37",
        letterSpacing: "0.03em",
        marginBottom: "12px",
        fontFamily: "'Montserrat', sans-serif",
        textDecoration: "none",
    },
    bottomDecor: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    decorLine: {
        width: "24px",
        height: "1px",
        backgroundColor: "#D4AF37",
    },
    decorDot: {
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        backgroundColor: "#D4AF37",
    },
}

export function CertificatePreview({
    id,
    candidateName,
    designation,
    domain,
    tenureStart,
    tenureEnd,
    issueDate,
    showDownload = true,
}: CertificatePreviewProps) {
    const [isGenerating, setIsGenerating] = useState(false)
    const verificationUrl = `https://ambixous.in/certify/${id || "XXXX"}`

    const handleDownload = async () => {
        setIsGenerating(true)
        await generateCertificatePDF({
            elementId: "certificate-preview",
            filename: `certificate-${id || "preview"}`,
        })
        setIsGenerating(false)
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Certificate Preview - A4 Portrait */}
            <div id="certificate-preview" style={styles.container}>
                {/* White inner area */}
                <div style={styles.whiteArea}>
                    {/* Gold inner border */}
                    <div style={styles.goldBorder} />

                    {/* Corner ornaments */}
                    <div style={{ ...styles.cornerOrnament, top: "4px", left: "4px" }} />
                    <div style={{ ...styles.cornerOrnament, top: "4px", right: "4px" }} />
                    <div style={{ ...styles.cornerOrnament, bottom: "4px", left: "4px" }} />
                    <div style={{ ...styles.cornerOrnament, bottom: "4px", right: "4px" }} />

                    {/* Content */}
                    <div style={styles.content}>
                        {/* Logo */}
                        <img
                            src="/certificate-logo.png"
                            alt="Ambixous Logo"
                            style={styles.logo}
                        />

                        {/* CERTIFICATE Title */}
                        <div style={styles.title}>CERTIFICATE</div>
                        <div style={styles.subtitle}>Of Completion</div>

                        {/* Divider */}
                        <div style={styles.divider} />

                        {/* Presented to */}
                        <div style={styles.presentedTo}>This is proudly presented to</div>

                        {/* Name */}
                        <div style={styles.name}>
                            {candidateName || "Candidate Name"}
                        </div>

                        {/* Body Text */}
                        <div style={styles.bodyText}>
                            For successfully completing the tenure as a{" "}
                            <span style={styles.bold}>{designation || "Designation"}</span> with the Ambixous
                            Community. Demonstrated exceptional professionalism and dedication in{" "}
                            <span style={styles.bold}>{domain || "Domain"}</span>.
                        </div>

                        {/* Active Tenure Section */}
                        <div style={styles.tenureLabel}>Active Tenure</div>
                        <div style={styles.tenureBox}>
                            <div style={styles.tenureText}>
                                {formatDisplayDate(tenureStart)} — {formatDisplayDate(tenureEnd)}
                            </div>
                        </div>

                        {/* Signatures Grid */}
                        <div style={styles.signaturesGrid}>
                            {/* Signature 1 - Avnish */}
                            <div style={styles.signatureContainer}>
                                <img
                                    src="/signature-avnish.png"
                                    alt="Avnish Singh"
                                    style={styles.signatureImg}
                                />
                                <div style={styles.signatureLine} />
                                <div style={styles.signatureName}>AVNISH SINGH</div>
                                <div style={styles.signatureTitle}>Co-Founder</div>
                            </div>

                            {/* Signature 2 - Riti */}
                            <div style={styles.signatureContainer}>
                                <img
                                    src="/signature-riti.png"
                                    alt="Riti Gupta"
                                    style={styles.signatureImg}
                                />
                                <div style={styles.signatureLine} />
                                <div style={styles.signatureName}>RITI GUPTA</div>
                                <div style={styles.signatureTitle}>Co-Founder</div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={styles.footer}>
                            <span>ID: <span style={styles.footerBold}>{id || "AMBXJAN260001"}</span></span>
                            <span style={styles.footerSeparator}>|</span>
                            <span>ISSUED: <span style={styles.footerBold}>{formatDisplayDate(issueDate)}</span></span>
                        </div>

                        {/* Verification URL */}
                        <a
                            href={verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.verifyUrl}
                        >
                            Verify: {verificationUrl}
                        </a>

                        {/* Bottom decorative element */}
                        <div style={styles.bottomDecor}>
                            <div style={styles.decorLine} />
                            <div style={styles.decorDot} />
                            <div style={styles.decorLine} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Download Button */}
            {showDownload && (
                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="mt-4 flex items-center justify-center gap-2
                   px-6 py-3 rounded-xl font-medium
                   bg-signal-blue/20 text-signal-blue border border-signal-blue/30
                   hover:bg-signal-blue/30 hover:border-signal-blue/50
                   transition-all duration-300
                   disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={18} />
                    {isGenerating ? "Generating PDF..." : "Download as PDF"}
                </button>
            )}
        </div>
    )
}

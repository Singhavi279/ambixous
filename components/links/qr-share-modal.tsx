"use client"

import { useRef, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import { X, Download, Share2 } from "lucide-react"
import { toast } from "sonner"
import html2canvas from "html2canvas"

const PAGE_URL = "https://ambixous.in/links"

interface QrShareModalProps {
    open: boolean
    onClose: () => void
}

export function QrShareModal({ open, onClose }: QrShareModalProps) {
    const qrRef = useRef<HTMLDivElement>(null)

    const handleDownload = useCallback(async () => {
        if (!qrRef.current) return
        try {
            const canvas = await html2canvas(qrRef.current, {
                backgroundColor: "#010409",
                scale: 3,
            })
            const url = canvas.toDataURL("image/png")
            const a = document.createElement("a")
            a.href = url
            a.download = "ambixous-links-qr.png"
            a.click()
            toast.success("QR code downloaded!")
        } catch {
            toast.error("Failed to download QR code")
        }
    }, [])

    const handleShare = useCallback(async () => {
        if (!qrRef.current) return
        try {
            const canvas = await html2canvas(qrRef.current, {
                backgroundColor: "#010409",
                scale: 3,
            })
            canvas.toBlob(async (blob) => {
                if (!blob) return
                const file = new File([blob], "ambixous-links-qr.png", { type: "image/png" })
                if (navigator.share && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: "Ambixous Links",
                        text: "Scan this QR code to find all Ambixous links!",
                        files: [file],
                    })
                } else {
                    // Fallback — download
                    handleDownload()
                }
            })
        } catch {
            toast.error("Failed to share QR code")
        }
    }, [handleDownload])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm mx-4 mb-0 sm:mb-0 bg-[#0d1117] border border-white/[0.1] rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-gray hover:text-warm-white transition-colors"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-warm-white">Share via QR Code</h3>
                    <p className="text-xs text-slate-gray mt-1">Scan to open all Ambixous links</p>
                </div>

                {/* QR Code with centered text */}
                <div className="flex justify-center mb-6">
                    <div
                        ref={qrRef}
                        className="relative p-5 bg-white rounded-2xl"
                    >
                        <QRCodeSVG
                            value={PAGE_URL}
                            size={200}
                            level="H"
                            bgColor="#FFFFFF"
                            fgColor="#010409"
                        />
                        {/* Centered text overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span
                                className="text-[8px] font-bold tracking-tight leading-none px-1.5 py-0.5 bg-white text-[#010409] font-mono"
                                style={{ textShadow: "none" }}
                            >
                                ambixous.in/links
                            </span>
                        </div>
                    </div>
                </div>

                {/* URL preview */}
                <p className="text-center text-xs text-slate-gray mb-5 font-mono">
                    {PAGE_URL}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-warm-white text-sm font-medium hover:bg-ambixous-neon/10 hover:border-ambixous-neon/30 hover:text-ambixous-neon transition-all duration-300"
                    >
                        <Download size={16} />
                        Download
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-ambixous-neon text-electric-ink text-sm font-bold hover:bg-ambixous-neon/90 transition-all duration-300 shadow-lg hover:shadow-ambixous-neon/25"
                    >
                        <Share2 size={16} />
                        Share
                    </button>
                </div>
            </div>
        </div>
    )
}

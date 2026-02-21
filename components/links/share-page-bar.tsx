"use client"

import { useState } from "react"
import { Share2, Copy, QrCode } from "lucide-react"
import { toast } from "sonner"
import { QrShareModal } from "./qr-share-modal"

const PAGE_URL = "https://ambixous.in/links"

export function SharePageBar() {
    const [qrOpen, setQrOpen] = useState(false)

    const handleShareLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Ambixous Links — Connect With Us",
                    text: "All our links in one place. Follow Ambixous across LinkedIn, Instagram, YouTube, Twitter, and explore our flagship product ACE.",
                    url: PAGE_URL,
                })
            } catch {
                // User cancelled
            }
        } else {
            copyToClipboard(PAGE_URL)
            toast.success("Link copied to clipboard!")
        }
    }

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
        } else {
            const textarea = document.createElement("textarea")
            textarea.value = text
            textarea.style.position = "fixed"
            textarea.style.opacity = "0"
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand("copy")
            document.body.removeChild(textarea)
        }
    }

    const handleCopyUrl = async () => {
        copyToClipboard(PAGE_URL)
        toast.success("Link copied!", {
            description: PAGE_URL,
            duration: 2000,
        })
    }

    return (
        <>
            <section className="w-full max-w-lg mx-auto px-4 py-6">
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {/* Share Link */}
                    <button
                        onClick={handleShareLink}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-warm-white text-xs sm:text-sm font-medium hover:bg-ambixous-neon/10 hover:border-ambixous-neon/30 hover:text-ambixous-neon transition-all duration-300"
                    >
                        <Share2 size={14} />
                        <span>Share</span>
                    </button>

                    {/* Copy URL */}
                    <button
                        onClick={handleCopyUrl}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-warm-white text-xs sm:text-sm font-medium hover:bg-signal-blue/10 hover:border-signal-blue/30 hover:text-signal-blue transition-all duration-300"
                    >
                        <Copy size={14} />
                        <span>Copy URL</span>
                    </button>

                    {/* Share as QR */}
                    <button
                        onClick={() => setQrOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-warm-white text-xs sm:text-sm font-medium hover:bg-ambixous-neon/10 hover:border-ambixous-neon/30 hover:text-ambixous-neon transition-all duration-300"
                    >
                        <QrCode size={14} />
                        <span>QR Code</span>
                    </button>
                </div>
            </section>

            <QrShareModal open={qrOpen} onClose={() => setQrOpen(false)} />
        </>
    )
}

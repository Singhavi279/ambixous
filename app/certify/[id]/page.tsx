"use client"

import { useEffect, useState } from "react"
import { CertificatePreview } from "@/components/certify/certificate-preview"
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Certificate {
    id: string
    candidateName: string
    designation: string
    domain: string
    tenureStart: string
    tenureEnd: string
    issuedAt: string
    createdBy: string
}

export default function VerifyCertificatePage() {
    const params = useParams()
    const id = params.id as string

    const [certificate, setCertificate] = useState<Certificate | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        async function fetchCertificate() {
            try {
                const res = await fetch(`/api/certificates/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setCertificate(data.certificate)
                } else {
                    setError(true)
                }
            } catch {
                setError(true)
            }
            setLoading(false)
        }

        if (id) {
            fetchCertificate()
        }
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-electric-ink flex items-center justify-center">
                <div className="text-warm-white">Verifying certificate...</div>
            </div>
        )
    }

    if (error || !certificate) {
        return (
            <div className="min-h-screen bg-electric-ink flex items-center justify-center">
                <div className="max-w-md w-full mx-4 text-center">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                        <XCircle className="mx-auto text-red-500 mb-4" size={64} />
                        <h1 className="text-2xl font-bold text-warm-white mb-2">
                            Certificate Not Found
                        </h1>
                        <p className="text-slate-gray mb-6">
                            The certificate with ID <code className="text-red-400">{id}</code> does not exist
                            or may have been removed.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                       bg-ambixous-neon text-electric-ink font-bold
                       hover:bg-ambixous-neon/90 transition-all duration-200"
                        >
                            <ArrowLeft size={18} />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-electric-ink">
            {/* Verification Badge */}
            <div className="bg-green-500/10 border-b border-green-500/30">
                <div className="container-width section-padding py-4">
                    <div className="flex items-center justify-center gap-3">
                        <CheckCircle className="text-green-500" size={24} />
                        <span className="text-green-400 font-semibold">
                            Certificate Verified
                        </span>
                    </div>
                </div>
            </div>

            {/* Header */}
            <header className="border-b border-white/10">
                <div className="container-width section-padding py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-slate-gray hover:text-warm-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Home
                    </Link>
                    <span className="text-sm text-slate-gray font-mono">
                        ID: {certificate.id}
                    </span>
                </div>
            </header>

            {/* Certificate */}
            <main className="container-width section-padding py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                        <CertificatePreview
                            id={certificate.id}
                            candidateName={certificate.candidateName}
                            designation={certificate.designation}
                            domain={certificate.domain}
                            tenureStart={certificate.tenureStart}
                            tenureEnd={certificate.tenureEnd}
                            issueDate={certificate.issuedAt}
                            showDownload={true}
                        />
                    </div>

                    {/* Certificate Details */}
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-slate-gray mb-1">Candidate</p>
                            <p className="text-warm-white font-semibold">{certificate.candidateName}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-slate-gray mb-1">Designation</p>
                            <p className="text-warm-white font-semibold">{certificate.designation}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <p className="text-xs text-slate-gray mb-1">Issued</p>
                            <p className="text-warm-white font-semibold">
                                {new Date(certificate.issuedAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

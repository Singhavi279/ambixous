"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CertificateForm } from "@/components/certify/certificate-form"
import { CertificatePreview } from "@/components/certify/certificate-preview"
import { LogOut, Shield } from "lucide-react"

interface CertificateFormData {
    id: string
    candidateName: string
    designation: string
    domain: string
    tenureStart: string
    tenureEnd: string
    issueDate: string
}

export default function CertifyPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [formData, setFormData] = useState<CertificateFormData>({
        id: "",
        candidateName: "",
        designation: "",
        domain: "",
        tenureStart: "",
        tenureEnd: "",
        issueDate: new Date().toISOString().split("T")[0],
    })
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/certify/sign-in")
        }
    }, [status, router])

    const handleSave = async () => {
        setIsSaving(true)
        setSaveError(null)
        setSaveSuccess(false)

        try {
            const res = await fetch("/api/certificates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: formData.id,
                    candidateName: formData.candidateName,
                    designation: formData.designation,
                    domain: formData.domain,
                    tenureStart: formData.tenureStart,
                    tenureEnd: formData.tenureEnd,
                    issuedAt: formData.issueDate,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setSaveError(data.error || "Failed to save certificate")
            } else {
                setSaveSuccess(true)
                // Reset form with new ID after successful save
                setTimeout(() => {
                    setFormData({
                        id: "",
                        candidateName: "",
                        designation: "",
                        domain: "",
                        tenureStart: "",
                        tenureEnd: "",
                        issueDate: new Date().toISOString().split("T")[0],
                    })
                    setSaveSuccess(false)
                }, 2000)
            }
        } catch (error) {
            setSaveError("Network error. Please try again.")
        }

        setIsSaving(false)
    }

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-electric-ink flex items-center justify-center">
                <div className="text-warm-white">Loading...</div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    return (
        <div className="min-h-screen bg-electric-ink">
            {/* Header */}
            <header className="border-b border-white/10 bg-electric-ink/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="container-width section-padding py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="text-ambixous-neon" size={24} />
                        <h1 className="text-xl font-bold text-warm-white">
                            Certificate <span className="text-ambixous-neon">Admin</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-gray hidden sm:block">
                            {session.user?.email}
                        </span>
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg
                       bg-white/5 border border-white/10
                       text-slate-gray hover:text-warm-white hover:border-white/20
                       transition-all duration-200"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Sign out</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container-width section-padding py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Form */}
                    <div className="lg:col-span-4 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto">
                        <CertificateForm
                            formData={formData}
                            onFormChange={setFormData}
                            onSave={handleSave}
                            isSaving={isSaving}
                            saveError={saveError}
                            saveSuccess={saveSuccess}
                        />
                    </div>

                    {/* Preview */}
                    <div className="lg:col-span-8">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-warm-white mb-6">Live Preview</h2>
                            <CertificatePreview
                                id={formData.id}
                                candidateName={formData.candidateName}
                                designation={formData.designation}
                                domain={formData.domain}
                                tenureStart={formData.tenureStart}
                                tenureEnd={formData.tenureEnd}
                                issueDate={formData.issueDate}
                                showDownload={true}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

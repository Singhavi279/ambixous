"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useRef, useState } from "react"
import { FcGoogle } from "react-icons/fc"
import { CheckCircle2, FileText, Loader2, LogOut, UploadCloud } from "lucide-react"

const DOCUMENTS = [
    { title: "Participant Agreement", src: "/agreements/ACF_C1_ParticipantAgreement.pdf" },
    { title: "Programme Brochure", src: "/agreements/ACF_C1_Brochure.pdf" },
]

export default function GraduationAgreementPage() {
    const { data: session, status } = useSession()

    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
    const [agreed, setAgreed] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const email = session?.user?.email ?? ""

    const handleSignature = (file: File | undefined) => {
        setError(null)
        if (!file) return
        if (!/image\/(png|jpe?g)/.test(file.type)) {
            setError("Signature must be a PNG or JPG image.")
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Signature image must be under 5 MB.")
            return
        }
        const reader = new FileReader()
        reader.onload = () => setSignatureDataUrl(reader.result as string)
        reader.onerror = () => setError("Could not read that image.")
        reader.readAsDataURL(file)
    }

    const phoneValid = /^[0-9+\-\s()]{7,15}$/.test(phone.trim())
    const canSubmit =
        name.trim().length > 1 && phoneValid && !!signatureDataUrl && agreed && !submitting

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)
        if (!canSubmit) return
        setSubmitting(true)
        try {
            const res = await fetch("/api/sign-and-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), phone: phone.trim(), signatureDataUrl }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Something went wrong")
            setSuccess(data.signedAtIST)
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to submit")
        } finally {
            setSubmitting(false)
        }
    }

    // ---- Loading ----
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#010409]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            </div>
        )
    }

    // ---- Login gate ----
    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#010409] px-4">
                <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
                    <h1 className="text-2xl font-bold text-white">
                        Creator Fellowship — Graduation Agreement
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Sign in with Google to review and sign your documents.
                    </p>
                    <button
                        onClick={() => signIn("google", { callbackUrl: window.location.href })}
                        className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-6 py-4 font-medium text-gray-800 transition hover:bg-gray-100"
                    >
                        <FcGoogle size={24} /> Sign in with Google
                    </button>
                </div>
            </div>
        )
    }

    // ---- Success ----
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#010409] px-4">
                <div className="max-w-md w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
                    <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
                    <h1 className="mt-4 text-2xl font-bold text-white">Documents signed</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Signed at <strong>{success}</strong>.
                    </p>
                    <p className="mt-3 text-sm text-slate-400">
                        A copy of both signed documents has been emailed to Ambixous, with a
                        copy sent to <strong>{email}</strong>.
                    </p>
                </div>
            </div>
        )
    }

    // ---- Main flow ----
    return (
        <div className="min-h-screen bg-[#010409] px-4 py-10 text-white">
            <div className="mx-auto max-w-3xl">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold sm:text-3xl">Graduation Agreement</h1>
                    <button
                        onClick={() => signOut({ callbackUrl: window.location.href })}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
                    >
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                    Signed in as {email}. Please review both documents below, then complete the
                    signing form.
                </p>

                {/* Documents */}
                <div className="mt-8 space-y-6">
                    {DOCUMENTS.map((doc) => (
                        <div key={doc.src} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 font-medium">
                                    <FileText size={18} className="text-emerald-400" /> {doc.title}
                                </div>
                                <a
                                    href={doc.src}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-sm text-emerald-400 hover:underline"
                                >
                                    Open in new tab
                                </a>
                            </div>
                            <object data={doc.src} type="application/pdf" className="h-[420px] w-full rounded-lg bg-white">
                                <iframe src={doc.src} className="h-[420px] w-full rounded-lg" title={doc.title} />
                            </object>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
                    <h2 className="text-lg font-semibold">Your details</h2>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm text-slate-400">Full name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="As it should appear on the agreement"
                                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-400"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-slate-400">Phone</label>
                            <input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. +91 98765 43210"
                                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-400"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm text-slate-400">Email (from your Google account)</label>
                            <input
                                value={email}
                                readOnly
                                className="mt-1 w-full cursor-not-allowed rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Signature upload */}
                    <div className="mt-5">
                        <label className="text-sm text-slate-400">Upload your signature (PNG or JPG)</label>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={(e) => handleSignature(e.target.files?.[0])}
                        />
                        {signatureDataUrl ? (
                            <div className="mt-2 flex items-center gap-4 rounded-lg border border-white/10 bg-white p-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={signatureDataUrl} alt="signature preview" className="h-16 object-contain" />
                                <button
                                    onClick={() => { setSignatureDataUrl(null); if (fileRef.current) fileRef.current.value = "" }}
                                    className="text-sm text-red-500 hover:underline"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-black/20 py-6 text-slate-400 hover:border-emerald-400 hover:text-white"
                            >
                                <UploadCloud size={20} /> Click to upload signature
                            </button>
                        )}
                    </div>

                    {/* Consent */}
                    <label className="mt-5 flex items-start gap-3 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 h-4 w-4 accent-emerald-400"
                        />
                        <span>
                            I have read both documents and agree to sign them electronically. I
                            understand my signature, name, email and an IST timestamp will be
                            embedded into the documents.
                        </span>
                    </label>

                    {error && (
                        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" /> Signing & sending…
                            </>
                        ) : (
                            "Sign & submit"
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}

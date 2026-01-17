"use client"

import { useState, useEffect } from "react"
import { Check, AlertTriangle, RefreshCw, Calendar } from "lucide-react"

interface CertificateFormData {
    id: string
    candidateName: string
    designation: string
    domain: string
    tenureStart: string
    tenureEnd: string
    issueDate: string
}

interface CertificateFormProps {
    formData: CertificateFormData
    onFormChange: (data: CertificateFormData) => void
    onSave: () => Promise<void>
    isSaving: boolean
    saveError: string | null
    saveSuccess: boolean
}

export function CertificateForm({
    formData,
    onFormChange,
    onSave,
    isSaving,
    saveError,
    saveSuccess,
}: CertificateFormProps) {
    const [duplicateWarning, setDuplicateWarning] = useState(false)
    const [isGeneratingId, setIsGeneratingId] = useState(false)

    const generateNewId = async () => {
        setIsGeneratingId(true)
        try {
            const res = await fetch("/api/certificates/generate-id")
            const data = await res.json()
            onFormChange({ ...formData, id: data.id })
            setDuplicateWarning(false)
        } catch (error) {
            console.error("Failed to generate ID")
        }
        setIsGeneratingId(false)
    }

    const checkDuplicate = async (id: string) => {
        if (!id) return
        try {
            const res = await fetch(`/api/certificates/${id}`)
            setDuplicateWarning(res.ok)
        } catch {
            setDuplicateWarning(false)
        }
    }

    useEffect(() => {
        if (formData.id) {
            const timeout = setTimeout(() => checkDuplicate(formData.id), 500)
            return () => clearTimeout(timeout)
        }
    }, [formData.id])

    // Generate ID and set today's date on mount
    useEffect(() => {
        if (!formData.id) {
            generateNewId()
        }
        if (!formData.issueDate) {
            const today = new Date().toISOString().split("T")[0]
            onFormChange({ ...formData, issueDate: today })
        }
    }, [])

    const updateField = (field: keyof CertificateFormData, value: string) => {
        onFormChange({ ...formData, [field]: value })
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-full overflow-y-auto">
            <h2 className="text-xl font-bold text-warm-white mb-6">Certificate Details</h2>

            <div className="space-y-4">
                {/* Certificate ID */}
                <div>
                    <label className="block text-sm font-medium text-slate-gray mb-2">
                        Certificate ID
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={formData.id}
                                onChange={(e) => updateField("id", e.target.value.toUpperCase())}
                                placeholder="AMBXJAN260001"
                                className={`
                  w-full px-4 py-3 rounded-lg bg-white/5 border 
                  ${duplicateWarning ? "border-red-500" : "border-white/10"}
                  text-warm-white placeholder-slate-gray
                  focus:outline-none focus:border-ambixous-neon/50
                  transition-all duration-200 font-mono text-sm
                `}
                            />
                            {duplicateWarning && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <AlertTriangle className="text-red-500" size={18} />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={generateNewId}
                            disabled={isGeneratingId}
                            className="px-3 py-3 rounded-lg bg-white/5 border border-white/10 
                       text-slate-gray hover:text-ambixous-neon hover:border-ambixous-neon/50
                       transition-all duration-200"
                            title="Generate new ID"
                        >
                            <RefreshCw size={18} className={isGeneratingId ? "animate-spin" : ""} />
                        </button>
                    </div>
                    {duplicateWarning && (
                        <p className="mt-2 text-sm text-red-400">⚠️ This ID already exists!</p>
                    )}
                </div>

                {/* Candidate Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-gray mb-2">
                        Candidate Name
                    </label>
                    <input
                        type="text"
                        value={formData.candidateName}
                        onChange={(e) => updateField("candidateName", e.target.value)}
                        placeholder="Sanskriti Gupta"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                     text-warm-white placeholder-slate-gray
                     focus:outline-none focus:border-ambixous-neon/50
                     transition-all duration-200"
                    />
                </div>

                {/* Designation */}
                <div>
                    <label className="block text-sm font-medium text-slate-gray mb-2">
                        Designation
                    </label>
                    <input
                        type="text"
                        value={formData.designation}
                        onChange={(e) => updateField("designation", e.target.value)}
                        placeholder="Team Member"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                     text-warm-white placeholder-slate-gray
                     focus:outline-none focus:border-ambixous-neon/50
                     transition-all duration-200"
                    />
                </div>

                {/* Domain/Skills */}
                <div>
                    <label className="block text-sm font-medium text-slate-gray mb-2">
                        Domain / Skills
                    </label>
                    <textarea
                        value={formData.domain}
                        onChange={(e) => updateField("domain", e.target.value)}
                        placeholder="Community Fundraising, Strategic Outreach, and Membership Expansion"
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                     text-warm-white placeholder-slate-gray
                     focus:outline-none focus:border-ambixous-neon/50
                     transition-all duration-200 resize-none"
                    />
                </div>

                {/* Tenure Dates */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-gray mb-2">
                            Tenure Start
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={formData.tenureStart}
                                onChange={(e) => updateField("tenureStart", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                         text-warm-white
                         focus:outline-none focus:border-ambixous-neon/50
                         transition-all duration-200"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-gray mb-2">
                            Tenure End
                        </label>
                        <input
                            type="date"
                            value={formData.tenureEnd}
                            onChange={(e) => updateField("tenureEnd", e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                       text-warm-white
                       focus:outline-none focus:border-ambixous-neon/50
                       transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Issue Date */}
                <div>
                    <label className="block text-sm font-medium text-slate-gray mb-2">
                        Issue Date
                    </label>
                    <input
                        type="date"
                        value={formData.issueDate}
                        onChange={(e) => updateField("issueDate", e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 
                     text-warm-white
                     focus:outline-none focus:border-ambixous-neon/50
                     transition-all duration-200"
                    />
                    <p className="mt-1 text-xs text-slate-gray">Auto-set to today, editable</p>
                </div>

                {/* Error Message */}
                {saveError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {saveError}
                    </div>
                )}

                {/* Success Message */}
                {saveSuccess && (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                        ✓ Certificate saved successfully!
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={onSave}
                    disabled={isSaving || duplicateWarning || !formData.candidateName || !formData.designation || !formData.domain}
                    className={`
            w-full flex items-center justify-center gap-2
            px-6 py-4 rounded-xl font-bold
            bg-ambixous-neon text-electric-ink
            hover:bg-ambixous-neon/90
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-ambixous-neon/25
          `}
                >
                    <Check size={20} />
                    {isSaving ? "Saving..." : "Save Certificate"}
                </button>
            </div>
        </div>
    )
}

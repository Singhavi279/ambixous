"use client"

import { useEffect, useState } from "react"
import { ExternalLink, RefreshCw, Search } from "lucide-react"

interface IssuedCertificate {
    id: string
    candidateName: string
    designation: string
    domain: string
    issuedAt: string
    createdBy: string
}

export function IssuedCertificates({ refreshKey }: { refreshKey: number }) {
    const [certificates, setCertificates] = useState<IssuedCertificate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [query, setQuery] = useState("")
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)
        fetch("/api/certificates", { cache: "no-store" })
            .then(async (res) => {
                if (!res.ok) throw new Error()
                const data = await res.json()
                if (!cancelled) setCertificates(data.certificates)
            })
            .catch(() => {
                if (!cancelled) setError("Could not load issued certificates")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [refreshKey, reloadKey])

    const q = query.trim().toLowerCase()
    const filtered = q
        ? certificates.filter((c) =>
              [c.id, c.candidateName, c.designation, c.domain].some((v) => v.toLowerCase().includes(q))
          )
        : certificates

    return (
        <section className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-warm-white">
                    Issued Certificates{" "}
                    <span className="text-sm font-normal text-slate-gray">({certificates.length})</span>
                </h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-gray" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search name, ID, domain"
                            className="pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-warm-white placeholder:text-slate-gray focus:outline-none focus:border-white/30"
                        />
                    </div>
                    <button
                        onClick={() => setReloadKey((k) => k + 1)}
                        aria-label="Refresh list"
                        className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-gray hover:text-warm-white hover:border-white/20 transition-all duration-200"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {error ? (
                <p className="text-sm text-red-400">{error}</p>
            ) : filtered.length === 0 ? (
                <p className="text-sm text-slate-gray">
                    {loading ? "Loading..." : q ? "No certificates match your search." : "No certificates issued yet."}
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="text-slate-gray border-b border-white/10">
                                <th className="py-2 pr-4 font-medium">Certificate ID</th>
                                <th className="py-2 pr-4 font-medium">Candidate</th>
                                <th className="py-2 pr-4 font-medium hidden md:table-cell">Designation</th>
                                <th className="py-2 pr-4 font-medium hidden lg:table-cell">Domain</th>
                                <th className="py-2 pr-4 font-medium">Issued</th>
                                <th className="py-2 font-medium text-right">Public page</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id} className="border-b border-white/5 text-warm-white">
                                    <td className="py-3 pr-4 font-mono text-xs">{c.id}</td>
                                    <td className="py-3 pr-4">{c.candidateName}</td>
                                    <td className="py-3 pr-4 hidden md:table-cell">{c.designation}</td>
                                    <td className="py-3 pr-4 hidden lg:table-cell text-slate-gray">{c.domain}</td>
                                    <td className="py-3 pr-4 whitespace-nowrap">{c.issuedAt}</td>
                                    <td className="py-3 text-right">
                                        <a
                                            href={`/certify/${c.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-ambixous-neon hover:underline"
                                        >
                                            Open <ExternalLink size={14} />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}

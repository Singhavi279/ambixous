"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { FcGoogle } from "react-icons/fc"

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSignIn = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await signIn("google", {
                callbackUrl: "/certify",
                redirect: true
            })
        } catch (err) {
            setError("Failed to sign in. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-electric-ink flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
                    {/* Logo/Title */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-warm-white mb-2">
                            Certificate <span className="text-ambixous-neon">Admin</span>
                        </h1>
                        <p className="text-slate-gray">
                            Sign in to manage certificates
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Access Notice */}
                    <div className="mb-6 p-4 bg-ambixous-neon/10 border border-ambixous-neon/30 rounded-lg">
                        <p className="text-sm text-ambixous-neon">
                            ⚠️ Admin access only
                        </p>
                        <p className="text-xs text-slate-gray mt-1">
                            Only authorized email addresses can sign in
                        </p>
                    </div>

                    {/* Sign In Button */}
                    <button
                        onClick={handleSignIn}
                        disabled={isLoading}
                        className={`
              w-full flex items-center justify-center gap-3
              px-6 py-4 rounded-xl font-medium
              bg-white text-gray-800
              hover:bg-gray-100
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
                    >
                        <FcGoogle size={24} />
                        {isLoading ? "Signing in..." : "Sign in with Google"}
                    </button>

                    {/* Back Link */}
                    <a
                        href="/"
                        className="block mt-6 text-sm text-slate-gray hover:text-warm-white transition-colors"
                    >
                        ← Back to home
                    </a>
                </div>
            </div>
        </div>
    )
}

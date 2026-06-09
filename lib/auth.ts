import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { getServerSession } from "next-auth"

// Authorized admin emails
const ADMIN_EMAILS = [
    "t20avnish@gmail.com",
    "hi.ambixous@gmail.com",
]

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn() {
            // Allow any Google account to sign in.
            // Admin-only features are gated separately via isAdmin() at the
            // page/API level (e.g. /certify and /api/certificates/*).
            return true
        },
        async session({ session }) {
            // Expose admin flag to the client so admin-only UIs can gate access.
            if (session.user) {
                ;(session.user as { isAdmin?: boolean }).isAdmin = isAdmin(
                    session.user.email
                )
            }
            return session
        },
    },
    pages: {
        signIn: "/certify/sign-in",
        error: "/certify/sign-in",
    },
}

export async function getAuthSession() {
    return await getServerSession(authOptions)
}

export function isAdmin(email: string | null | undefined): boolean {
    return ADMIN_EMAILS.includes(email || "")
}

export { ADMIN_EMAILS }

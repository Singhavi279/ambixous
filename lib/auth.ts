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
        async signIn({ user }) {
            // Only allow admin emails to sign in
            return ADMIN_EMAILS.includes(user.email || "")
        },
        async session({ session }) {
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

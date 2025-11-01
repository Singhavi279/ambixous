import { getServerSession, type NextAuthOptions } from "next-auth/next";
import type { DefaultSession, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) {
        return false;
      }

      return isAdminEmail(profile.email);
    },
    async session({ session }) {
      if (session.user?.email) {
        session.user.isAdmin = isAdminEmail(session.user.email);
      }

      return session;
    },
  },
};

export function isAdminEmail(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export async function getAuthSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function requireAuthSession(): Promise<Session> {
  const session = await getAuthSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireAdminSession(): Promise<Session> {
  const session = await requireAuthSession();

  if (!isAdminEmail(session.user?.email)) {
    throw new Error("Forbidden");
  }

  return session;
}

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      isAdmin?: boolean;
    };
  }
}

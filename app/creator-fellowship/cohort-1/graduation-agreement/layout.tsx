import type { Metadata } from "next"
import { AuthProvider } from "@/components/auth-provider"

// Signed-in form for Cohort 01 fellows only: keep it out of search results.
export const metadata: Metadata = {
  title: "Cohort 01 Graduation Agreement",
  robots: { index: false, follow: false },
}

export default function GraduationAgreementLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

import { AuthProvider } from "@/components/auth-provider"

/**
 * Certificate typefaces, used only by components/certify/certificate-preview.tsx.
 * Scoped to /certify so the rest of the site doesn't load a render-blocking
 * stylesheet it never uses. React hoists these into <head> and, because of
 * `precedence`, still waits for the stylesheet before revealing the certificate,
 * so previews and PDF captures render with the right fonts.
 *
 * The next-auth session provider is scoped here too (and to the graduation
 * agreement), the only routes that sign people in, so public pages don't
 * ship next-auth or request /api/auth/session on every load.
 */
export default function CertifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        precedence="default"
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Montserrat:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap"
      />
      <AuthProvider>{children}</AuthProvider>
    </>
  )
}

import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  href?: string
  className?: string
  /** Preload only where the logo is in the first viewport (the header). */
  priority?: boolean
}

export function Logo({ size = "md", href = "/", className = "", priority = false }: LogoProps) {
  const sizes = {
    sm: { width: 100, height: 32 },
    md: { width: 150, height: 48 },
    lg: { width: 240, height: 80 },
  }

  const { width, height } = sizes[size]

  const logoImage = (
    <Image
      src="/logo.webp"
      alt="Ambixous"
      width={width}
      height={height}
      priority={priority}
      className={`object-contain hover:scale-105 transition-transform duration-200 ${className}`}
    />
  )

  if (href) {
    return (
      <Link href={href} className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ambixous-neon focus-visible:ring-offset-2 focus-visible:ring-offset-electric-ink">
        {logoImage}
      </Link>
    )
  }

  return logoImage
}

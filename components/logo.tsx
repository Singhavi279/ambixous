import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  href?: string
  className?: string
}

export function Logo({ size = "md", href = "/", className = "" }: LogoProps) {
  const sizes = {
    sm: { width: 100, height: 32 },
    md: { width: 150, height: 48 },
    lg: { width: 240, height: 80 },
  }

  const { width, height } = sizes[size]

  const logoImage = (
    <Image
      src="/logo.png"
      alt="Ambixous"
      width={width}
      height={height}
      priority={size === "sm"}
      loading={size === "sm" ? undefined : "lazy"}
      quality={85}
      className={`object-contain hover:scale-105 transition-transform duration-200 ${className}`}
    />
  )

  if (href) {
    return (
      <Link href={href} className="flex items-center">
        {logoImage}
      </Link>
    )
  }

  return logoImage
}

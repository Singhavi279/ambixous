import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/serverClient"

const navigation = [
  { href: "/(admin)/events", label: "Events" },
  { href: "/(admin)/events/new", label: "Create event" },
]

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    redirect("/")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-64 border-r border-white/10 bg-slate-950/80 px-6 py-10 lg:block">
        <div className="mb-10">
          <Link href="/(admin)/events" className="text-lg font-semibold tracking-tight">
            Ambixous Admin
          </Link>
          <p className="mt-1 text-sm text-slate-400">Manage events and content</p>
        </div>
        <nav className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-sm font-medium text-slate-400">Signed in as</p>
            <p className="text-sm font-semibold text-white">{user.email}</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-sky-400 transition hover:text-sky-300">
            View site
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-8">{children}</main>
      </div>
    </div>
  )
}

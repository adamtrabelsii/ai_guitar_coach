"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Mic, Target, User } from "lucide-react"

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/session/new", label: "Record", icon: Mic },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/profile", label: "Profile", icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-center bg-stone-950 border-t border-stone-800">
      <div className="w-full max-w-[420px] grid grid-cols-4 h-16">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/session/new"
              ? pathname === "/session/new"
              : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? "text-amber-500" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

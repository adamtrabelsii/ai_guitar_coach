import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { formatDuration } from "@/lib/utils"
import type { Session } from "@/types"
import SignOutButton from "./SignOutButton"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth")

  const { data: sessions } = (await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })) as { data: Session[] | null }

  const s = sessions ?? []
  const withFeedback = s.filter((x) => x.feedback)

  const totalSessions = s.length
  const avgScore =
    withFeedback.length > 0
      ? Math.round(
          withFeedback.reduce((acc, x) => acc + x.feedback!.overallScore, 0) /
            withFeedback.length
        )
      : null
  const bestScore =
    withFeedback.length > 0
      ? Math.max(...withFeedback.map((x) => x.feedback!.overallScore))
      : null
  const totalSeconds = s.reduce((acc, x) => acc + (x.duration_seconds ?? 0), 0)

  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const initials = (user.email ?? "?")[0].toUpperCase()

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* Avatar + identity */}
      <div className="bg-stone-900 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-bold truncate">{user.email}</p>
          <p className="font-mono text-[10px] text-stone-500 mt-0.5">
            Member since {memberSince}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div>
        <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mb-2">
          Your stats
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Sessions", value: totalSessions },
            { label: "Avg score", value: avgScore ?? "—" },
            { label: "Best score", value: bestScore ?? "—" },
            {
              label: "Total practice",
              value: totalSeconds > 0 ? formatDuration(totalSeconds) : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-stone-900 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wide mt-1">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Account section */}
      <div>
        <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mb-2">
          Account
        </p>
        <div className="bg-stone-900 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-800">
            <span className="text-sm">Email</span>
            <span className="text-sm text-stone-400 truncate max-w-[180px]">
              {user.email}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-800">
            <span className="text-sm">Plan</span>
            <span className="text-xs bg-amber-500/20 text-amber-400 rounded-full px-2.5 py-0.5 font-mono">
              Free
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm">Version</span>
            <span className="font-mono text-xs text-stone-500">1.0.0</span>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <SignOutButton />

      {/* Footer */}
      <p className="text-center font-mono text-[10px] text-stone-700 mt-2">
        Built by a guitarist, for guitarists.
      </p>
    </div>
  )
}

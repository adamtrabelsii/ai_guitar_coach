import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import type { Session } from "@/types"
import { formatDuration } from "@/lib/utils"
import ScoreTrendChart from "@/components/ScoreTrendChart"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function computeStreak(sessions: Session[]): { days: number; week: boolean[] } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sessionDates = new Set(
    sessions.map((s) => {
      const d = new Date(s.created_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )
  let streak = 0
  const check = new Date(today)
  while (sessionDates.has(check.getTime())) {
    streak++
    check.setDate(check.getDate() - 1)
  }
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return sessionDates.has(d.getTime())
  })
  return { days: streak, week }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: sessions } = (await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(50)) as { data: Session[] | null }

  const s = sessions ?? []

  if (s.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-4rem)] gap-4 px-6 text-center">
        <p className="text-5xl">🎸</p>
        <h2 className="text-xl font-bold">Record your first session</h2>
        <p className="text-stone-400 text-sm">Play something and get instant AI feedback</p>
        <Link
          href="/session/new"
          className="bg-amber-500 hover:bg-amber-400 text-white rounded-full px-6 py-3 font-semibold transition-colors"
        >
          Start playing →
        </Link>
      </div>
    )
  }

  const withFeedback = s.filter((x) => x.feedback)
  const avgScore =
    withFeedback.length > 0
      ? Math.round(
          withFeedback.reduce((acc, x) => acc + x.feedback!.overallScore, 0) /
            withFeedback.length
        )
      : 0

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const hoursThisWeek =
    Math.round(
      (s
        .filter((x) => new Date(x.created_at) > weekAgo)
        .reduce((acc, x) => acc + (x.duration_seconds ?? 0), 0) /
        3600) *
        10
    ) / 10

  const { days: streak, week } = computeStreak(s)

  const last7 = s.slice(0, 7).reverse()
  const scoreTrend = last7.map((x, i) => ({
    label: i === last7.length - 1 ? "Today" : DAYS[new Date(x.created_at).getDay()],
    score: x.feedback?.overallScore ?? 0,
    isLatest: i === last7.length - 1,
  }))

  const recent = s.slice(0, 3)

  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-400">Welcome back,</p>
          <h1 className="text-2xl font-bold">Your progress 🎸</h1>
        </div>
        <div className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center text-sm font-bold">
          {user?.email?.[0]?.toUpperCase() ?? "?"}
        </div>
      </div>

      {/* Streak banner */}
      <div className="bg-stone-900 rounded-2xl p-4 flex items-center gap-4">
        <div className="text-center shrink-0">
          <p className="text-3xl font-bold text-amber-500">{streak}</p>
          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wider">
            Day streak
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-1.5 mb-1.5">
            {week.map((practiced, i) => (
              <div
                key={i}
                className={`flex-1 h-6 rounded-md ${
                  practiced
                    ? i === 6
                      ? "bg-amber-500 ring-2 ring-offset-1 ring-offset-stone-900 ring-stone-100"
                      : "bg-amber-500"
                    : "bg-stone-800"
                }`}
              />
            ))}
          </div>
          <p className="text-stone-400 text-xs">
            {streak > 0
              ? `${streak} days strong — keep it up!`
              : "Play today to start a streak!"}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "avg score", value: avgScore || "—" },
          { label: "sessions", value: s.length },
          { label: "hrs / week", value: hoursThisWeek || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-stone-900 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wide mt-0.5">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Score trend */}
      {scoreTrend.length > 1 && (
        <div>
          <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mb-1">
            Score trend
          </p>
          <ScoreTrendChart data={scoreTrend} />
        </div>
      )}

      {/* Recent sessions */}
      <div className="pb-2">
        <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mb-2">
          Recent sessions
        </p>
        <div className="flex flex-col">
          {recent.map((session, i) => {
            const score = session.feedback?.overallScore
            const isLast = i === recent.length - 1
            return (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className={`flex items-center justify-between py-3 ${
                  !isLast ? "border-b border-stone-800" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{session.title ?? "Untitled"}</p>
                  <p className="font-mono text-[10px] text-stone-500 mt-0.5">
                    {new Date(session.created_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {session.duration_seconds
                      ? ` · ${formatDuration(session.duration_seconds)}`
                      : ""}
                  </p>
                </div>
                {score != null && (
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      score >= 90
                        ? "bg-amber-500 text-white"
                        : "bg-stone-800 text-stone-100"
                    }`}
                  >
                    {score}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Check } from "lucide-react"
import type { Goal } from "@/types"

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [draftDate, setDraftDate] = useState("")
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    setGoals((data as Goal[]) ?? [])
  }

  async function saveGoal() {
    if (!draft.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from("goals").insert({
      user_id: user!.id,
      description: draft.trim(),
      target_date: draftDate || null,
    })
    setSaving(false)
    if (error) { toast.error("Failed to save goal"); return }
    setDraft("")
    setDraftDate("")
    setAddOpen(false)
    loadGoals()
  }

  async function toggleGoal(goal: Goal) {
    await supabase.from("goals").update({ completed: !goal.completed }).eq("id", goal.id)
    loadGoals()
  }

  const active = goals.filter((g) => !g.completed)
  const completed = goals.filter((g) => g.completed)

  return (
    <>
      <div className="flex flex-col gap-4 px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Goals</h1>
          <button
            onClick={() => setAddOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-white rounded-full px-4 py-1.5 text-sm font-bold transition-colors"
          >
            + Add goal
          </button>
        </div>

        {/* In progress */}
        {active.length > 0 && (
          <div>
            <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mb-2">
              In progress
            </p>
            <div className="flex flex-col gap-2">
              {active.map((goal) => {
                const daysLeft = goal.target_date
                  ? Math.ceil(
                      (new Date(goal.target_date).getTime() - Date.now()) / 86400000
                    )
                  : null
                return (
                  <div key={goal.id} className="bg-stone-900 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <button
                        onClick={() => toggleGoal(goal)}
                        className="font-bold text-sm flex-1 text-left"
                      >
                        {goal.description}
                      </button>
                      {goal.target_date && (
                        <span className="font-mono text-[10px] text-stone-500 shrink-0">
                          {new Date(goal.target_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden mb-1.5">
                      <div className="h-full bg-amber-500 rounded-full w-[40%]" />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500 text-xs">In progress</span>
                      {daysLeft != null && (
                        <span className="font-mono text-[10px] text-stone-500">
                          {daysLeft <= 0
                            ? "Due!"
                            : daysLeft === 1
                            ? "1 day left!"
                            : `${daysLeft} days left`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <p className="font-mono text-[10px] text-stone-500 uppercase tracking-wider mb-2">
              Completed
            </p>
            <div className="flex flex-col">
              {completed.map((goal, i) => (
                <div
                  key={goal.id}
                  className={`flex items-center gap-3 py-3 opacity-50 ${
                    i < completed.length - 1 ? "border-b border-stone-800" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleGoal(goal)}
                    className="w-5 h-5 rounded bg-stone-100 flex items-center justify-center shrink-0"
                  >
                    <Check size={12} className="text-stone-950" strokeWidth={3} />
                  </button>
                  <span className="text-sm line-through">{goal.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <p className="text-4xl">🎯</p>
            <p className="text-stone-400 text-sm">No goals yet. Set your first practice goal.</p>
          </div>
        )}
      </div>

      {/* Bottom sheet add modal */}
      {addOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setAddOpen(false)}
          />
          <div className="fixed bottom-0 inset-x-0 flex justify-center z-50">
            <div className="w-full max-w-[420px] bg-stone-900 border border-stone-800 rounded-t-3xl p-4 pb-10">
              <div className="w-9 h-1 rounded-full bg-stone-700 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-4">New goal</h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-stone-400">
                    What do you want to achieve?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Learn Hotel California"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveGoal()}
                    className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm text-stone-400">Target date</label>
                  <input
                    type="date"
                    value={draftDate}
                    onChange={(e) => setDraftDate(e.target.value)}
                    className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setAddOpen(false)}
                  className="flex-1 bg-stone-800 hover:bg-stone-700 rounded-full py-3 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveGoal}
                  disabled={!draft.trim() || saving}
                  className="flex-[2] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white rounded-full py-3 font-bold text-sm transition-colors"
                >
                  {saving ? "Saving…" : "Save goal →"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    if (mode === "signup") {
      toast.success("Account created! Check your email to confirm.")
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center font-bold text-lg">
            G
          </div>
          <span className="text-xl font-bold">GuitarAI</span>
        </div>

        {/* Tab switcher */}
        <div className="flex border border-stone-800 rounded-lg overflow-hidden">
          {(["signup", "login"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === m
                  ? "bg-stone-100 text-stone-950"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {m === "signup" ? "Sign up" : "Log in"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-stone-400">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-stone-900 border border-stone-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm text-stone-400">Password</label>
              {mode === "login" && (
                <button type="button" className="text-xs text-amber-400 hover:text-orange-300">
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-stone-900 border border-stone-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full py-3 font-semibold text-sm transition-colors mt-1"
          >
            {loading
              ? "Loading..."
              : mode === "signup"
              ? "Create account"
              : "Sign in →"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-stone-800" />
          <span className="text-sm text-stone-600">or</span>
          <hr className="flex-1 border-stone-800" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="bg-stone-900 border border-stone-800 hover:bg-stone-800 text-stone-100 rounded-full py-3 text-sm font-semibold transition-colors"
        >
          Continue with Google
        </button>

        <p className="text-center text-sm text-stone-500">
          {mode === "login" ? "No account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-amber-400 hover:text-orange-300 font-medium"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Upload, Square, Pause, Trash2, ArrowLeft } from "lucide-react"
import { analyzeAudio } from "@/lib/audio-analysis"
import type { AudioMetrics } from "@/types"

type Phase = "idle" | "recording" | "review" | "analyzing"

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`
}

export default function NewSessionPage() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState("")
  const [duration, setDuration] = useState(0)
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(12).fill(25))

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (waveRef.current) clearInterval(waveRef.current)
    }
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
        if (waveRef.current) { clearInterval(waveRef.current); waveRef.current = null }
        setPhase("review")
      }

      startTimeRef.current = Date.now()
      mediaRecorder.start()
      setPhase("recording")

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      waveRef.current = setInterval(() => {
        setWaveHeights(Array.from({ length: 12 }, () => 15 + Math.random() * 85))
      }, 100)
    } catch {
      toast.error("Could not access microphone. Please allow microphone access.")
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (waveRef.current) { clearInterval(waveRef.current); waveRef.current = null }
  }

  function discardRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (waveRef.current) { clearInterval(waveRef.current); waveRef.current = null }
    setAudioBlob(null)
    setDuration(0)
    setPhase("idle")
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioBlob(file)
    setTitle(file.name.replace(/\.[^/.]+$/, ""))
    setPhase("review")
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith("audio/")) return
    setAudioBlob(file)
    setTitle(file.name.replace(/\.[^/.]+$/, ""))
    setPhase("review")
  }

  async function analyzeSession() {
    if (!audioBlob) return
    setPhase("analyzing")
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth"); return }

      const filename = `${user.id}/${Date.now()}.webm`
      const { error: uploadError } = await supabase.storage
        .from("audio-clips")
        .upload(filename, audioBlob)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("audio-clips")
        .getPublicUrl(filename)

      const metrics: AudioMetrics = await analyzeAudio(audioBlob)

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics,
          audioUrl: publicUrl,
          userId: user.id,
          title: title || "Untitled Session",
        }),
      })

      if (!res.ok) throw new Error("Analysis failed")
      const { sessionId } = await res.json()
      router.push(`/session/${sessionId}`)
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong. Please try again.")
      setPhase("review")
    }
  }

  // Analyzing state — Wireframe Feedback B loading view
  if (phase === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-4rem)] gap-5 px-6">
        <div
          className="w-20 h-20 rounded-full border-2 border-dashed border-amber-500 flex items-center justify-center animate-spin"
          style={{ animationDuration: "3s" }}
        >
          <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center text-2xl">
            ♪
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">Analyzing your playing…</h2>
          <p className="text-stone-400 text-sm mt-1">Detecting pitch, timing & dynamics</p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {[
            { label: "Audio uploaded", done: true },
            { label: "Pitch detected", done: true },
            { label: "AI coach reviewing…", done: false, active: true },
            { label: "Building practice plan", done: false, active: false },
          ].map(({ label, done, active }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  done
                    ? "bg-amber-500"
                    : active
                    ? "border-2 border-dashed border-amber-500"
                    : "border-2 border-stone-700"
                }`}
              >
                {done && <span className="text-white font-bold text-[10px]">✓</span>}
              </div>
              <span
                className={`text-sm ${
                  done || active ? "text-stone-100" : "text-stone-600"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-stone-600 text-xs">Takes about 10–15 seconds</p>
      </div>
    )
  }

  // Recording state — Wireframe New Session B (active recording)
  if (phase === "recording") {
    return (
      <div className="flex flex-col items-center px-4 pt-6">
        {/* Step indicator */}
        <div className="flex gap-1.5 w-full mb-6">
          <div className="flex-1 h-1 bg-amber-500 rounded-full" />
          <div className="flex-1 h-1 bg-stone-800 rounded-full" />
          <div className="flex-1 h-1 bg-stone-800 rounded-full" />
        </div>

        <p className="font-mono text-xs tracking-wider text-stone-500 uppercase mb-2">
          Step 1 · Record
        </p>
        <h1 className="text-2xl font-bold mb-6">Play something!</h1>

        {/* Live waveform */}
        <div className="w-full mb-4">
          <div className="flex items-center gap-0.5 h-16">
            {waveHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-75"
                style={{
                  height: `${h}%`,
                  backgroundColor:
                    h > 70 ? "#ef4444" : h > 35 ? "#f59e0b" : "#44403c",
                }}
              />
            ))}
          </div>
          <p className="text-stone-500 text-xs italic text-center mt-1">
            live waveform as you play
          </p>
        </div>

        {/* Timer */}
        <p className="font-mono text-4xl font-bold mb-1">{formatTime(duration)}</p>
        <p className="text-red-500 font-bold text-sm mb-8">● Recording…</p>

        {/* Controls */}
        <div className="flex items-center gap-8">
          <button className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center text-stone-500">
            <Pause size={16} />
          </button>
          <button
            onClick={stopRecording}
            className="rounded-full bg-red-500 border-2 border-stone-100 flex items-center justify-center"
            style={{ width: 72, height: 72 }}
          >
            <Square size={20} className="text-stone-100" />
          </button>
          <button
            onClick={discardRecording}
            className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center text-stone-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <p className="text-stone-500 text-xs italic mt-4">tap square to stop & review</p>
      </div>
    )
  }

  // Idle / Review state — Wireframe New Session A
  return (
    <div className="flex flex-col gap-4 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 border border-stone-800 rounded-md flex items-center justify-center"
        >
          <ArrowLeft size={16} />
        </button>
        <h1 className="text-xl font-bold">New Session</h1>
      </div>

      {phase === "review" && audioBlob ? (
        /* Review: recording saved card */
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Recording saved</p>
            <p className="font-mono text-[10px] text-stone-500">
              {formatTime(duration)} · ready to analyze
            </p>
          </div>
          <button
            onClick={() => {
              setPhase("idle")
              setAudioBlob(null)
              setDuration(0)
            }}
            className="text-stone-500 hover:text-stone-300 text-sm transition-colors px-2"
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          {/* Upload zone */}
          <div
            className="border-2 border-dashed border-stone-700 rounded-2xl p-8 text-center bg-amber-500/5 cursor-pointer hover:border-stone-600 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-11 h-11 border border-stone-700 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Upload size={20} className="text-stone-400" />
            </div>
            <p className="font-bold text-sm mb-1">Drop your recording</p>
            <p className="font-mono text-xs text-stone-500">.mp3 · .wav · .ogg · .m4a</p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              className="mt-4 bg-stone-800 hover:bg-stone-700 rounded-full px-5 py-2 text-sm font-medium transition-colors"
            >
              Browse files
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <hr className="flex-1 border-stone-800" />
            <span className="text-sm text-stone-500">or record now</span>
            <hr className="flex-1 border-stone-800" />
          </div>

          {/* Record button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={startRecording}
              className="w-16 h-16 rounded-full border-2 border-stone-600 flex items-center justify-center hover:border-stone-400 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-red-500" />
            </button>
            <p className="text-stone-500 text-xs italic">tap to record</p>
          </div>
        </>
      )}

      <hr className="border-stone-800" />

      {/* Session name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-stone-400">Session name (optional)</label>
        <input
          type="text"
          placeholder="e.g. Pentatonic practice"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-stone-900 border border-stone-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Analyze button */}
      <button
        onClick={analyzeSession}
        disabled={!audioBlob}
        className={`rounded-full py-3 font-bold text-sm transition-colors ${
          audioBlob
            ? "bg-amber-500 hover:bg-amber-400 text-white"
            : "bg-amber-500/30 text-white/30 cursor-not-allowed"
        }`}
      >
        Analyze →
      </button>
      {!audioBlob && (
        <p className="text-center text-stone-500 text-xs -mt-2">
          Add a recording to enable analysis
        </p>
      )}
    </div>
  )
}

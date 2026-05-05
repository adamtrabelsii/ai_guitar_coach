import { NextRequest, NextResponse } from "next/server"
import { groq } from "@/lib/groq"
import { createClient } from "@/lib/supabase/server"
import type { AudioMetrics, Feedback } from "@/types"

export async function POST(req: NextRequest) {
  try {
    const { metrics, audioUrl, userId, title } = await req.json() as {
      metrics: AudioMetrics
      audioUrl: string
      userId: string
      title: string
    }

    const hasPitch = metrics.averagePitch > 0
    const hasBPM = metrics.estimatedBPM > 0
    const hasStability = metrics.pitchStability > 0

    const metricsDescription = [
      `- Session duration: ${metrics.duration} seconds`,
      hasBPM
        ? `- Estimated tempo: ${metrics.estimatedBPM} BPM`
        : `- Tempo: could not be detected (possibly ambient noise or very slow playing)`,
      hasStability
        ? `- Pitch stability score: ${metrics.pitchStability}/100 (${
            metrics.pitchStability >= 80
              ? "very consistent intonation"
              : metrics.pitchStability >= 60
              ? "moderate pitch consistency"
              : "noticeable pitch inconsistency — intonation needs work"
          })`
        : `- Pitch stability: not detected`,
      hasPitch
        ? `- Average detected pitch: ${metrics.averagePitch.toFixed(1)} Hz (${
            metrics.averagePitch < 200
              ? "low register, likely bass strings"
              : metrics.averagePitch < 500
              ? "mid register"
              : "high register / lead playing"
          })`
        : `- Pitch: no clear notes detected`,
      metrics.dynamicRange > 0
        ? `- Dynamic range score: ${metrics.dynamicRange}/100 (${
            metrics.dynamicRange >= 60
              ? "good variation between soft and loud"
              : "fairly uniform volume — try varying dynamics"
          })`
        : `- Dynamics: not measured`,
    ].join("\n")

    const prompt = `You are an experienced guitar coach. A student just recorded a practice session and you are reviewing the audio analysis data. Give specific, encouraging, and actionable feedback based on what the numbers actually reveal.

${metricsDescription}

Important coaching context:
- A pitch stability score above 80 means the student has solid intonation
- BPM around 60–80 suggests careful, deliberate practice; above 140 suggests fast runs or strumming
- If metrics are mostly undetected, the recording may be very short, very quiet, or mostly percussive

Respond ONLY with valid JSON — no markdown, no extra text:
{
  "overallScore": <number 0-100, weighted heavily by pitch stability and whether the session showed real engagement>,
  "summary": "<2-3 sentences referencing the actual numbers — be specific, not generic>",
  "strengths": ["<specific strength based on the data>", "<another strength>"],
  "improvements": ["<specific area to work on, tied to the metrics>", "<another improvement>"],
  "practiceExercises": [
    { "name": "<exercise name>", "description": "<clear instructions>", "duration": "<X minutes>" },
    { "name": "<exercise name>", "description": "<clear instructions>", "duration": "<X minutes>" }
  ],
  "nextSessionFocus": "<one concrete thing to focus on next time, based on the weakest metric>"
}`

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })

    const text = completion.choices[0]?.message?.content
    if (!text) throw new Error("Empty response from Groq")

    const feedback: Feedback = JSON.parse(text)

    const supabase = await createClient()
    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        audio_url: audioUrl,
        duration_seconds: metrics.duration,
        feedback,
        title,
      })
      .select("id")
      .single()

    if (error) throw error

    return NextResponse.json({ sessionId: session.id, feedback })
  } catch (err) {
    console.error("Analyze error:", err)
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 })
  }
}

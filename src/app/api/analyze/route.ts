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

    const prompt = `You are an expert guitar coach analyzing a student's playing session.

Audio session metrics:
- Duration: ${metrics.duration} seconds
- Estimated BPM: ${metrics.estimatedBPM > 0 ? metrics.estimatedBPM : "not detected"}
- Pitch Stability Score: ${metrics.pitchStability > 0 ? `${metrics.pitchStability}/100` : "not detected"}
- Average Pitch: ${metrics.averagePitch > 0 ? `${metrics.averagePitch.toFixed(1)} Hz` : "not detected"}
- Dynamic Range: ${metrics.dynamicRange > 0 ? metrics.dynamicRange : "not detected"}

The student is a guitarist. Based on the available metrics and session duration, provide thoughtful, actionable coaching feedback.

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>"],
  "practiceExercises": [
    { "name": "<exercise name>", "description": "<how to do it>", "duration": "<X minutes>" },
    { "name": "<exercise name>", "description": "<how to do it>", "duration": "<X minutes>" }
  ],
  "nextSessionFocus": "<one key thing to focus on next time>"
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

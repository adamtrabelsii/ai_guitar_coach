export type Session = {
  id: string
  user_id: string
  created_at: string
  audio_url: string | null
  duration_seconds: number | null
  feedback: Feedback | null
  title: string | null
  notes: string | null
}

export type Feedback = {
  overallScore: number
  summary: string
  strengths: string[]
  improvements: string[]
  practiceExercises: PracticeExercise[]
  nextSessionFocus: string
}

export type PracticeExercise = {
  name: string
  description: string
  duration: string
}

export type Goal = {
  id: string
  user_id: string
  description: string
  target_date: string | null
  completed: boolean
}

export type AudioMetrics = {
  averagePitch: number
  pitchStability: number
  estimatedBPM: number
  dynamicRange: number
  duration: number
}

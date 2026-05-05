# Guitar Coach — Project Overview

## What it is
**Guitar Coach** is a web app that gives guitarists instant, AI-generated feedback on their playing. A user records a clip in the browser (or uploads one), the app extracts musical metrics from the audio client-side, and an LLM returns a structured coaching report — score, strengths, areas to improve, and tailored practice exercises.

Tagline (from the landing page): *"Get instant feedback on your playing — record yourself, hit analyze, and receive detailed coaching on your pitch, timing, and technique."*

It's positioned as a portfolio/showcase project — built by a guitarist-developer to demonstrate fullstack ownership end-to-end (auth, storage, audio DSP, AI integration, UI, deployment).

## Core user flow
1. **Sign up / log in** via Supabase Auth.
2. **Record or upload** an audio clip on `/session/new` (MediaRecorder API + drag-and-drop).
3. **Visualize** the waveform with WaveSurfer.js.
4. **Analyze** — pitch detection (Pitchy), tempo/onset detection, dynamic range, and pitch-stability scoring all run in the browser.
5. **Get AI feedback** — metrics are POSTed to `/api/analyze`, which calls an LLM and returns a structured JSON verdict.
6. **Track progress** on `/dashboard` (streak, session history, score trend chart) and `/goals`.

## Tech stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth + DB + Storage | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Audio recording | Browser `MediaRecorder` |
| Waveform UI | wavesurfer.js |
| Pitch detection | pitchy |
| Charts | recharts |
| Toasts | sonner |
| AI feedback | Groq (`llama-3.3-70b-versatile` via groq-sdk) |
| Icons | lucide-react |
| Deploy target | Vercel |

## Repository layout
```
src/
├── app/
│   ├── (auth)/auth/page.tsx          ← login / signup
│   ├── (app)/
│   │   ├── layout.tsx                ← protected shell
│   │   ├── dashboard/page.tsx
│   │   ├── session/new/page.tsx      ← record + upload + analyze
│   │   ├── session/[id]/page.tsx     ← past session detail
│   │   └── goals/page.tsx
│   ├── api/
│   │   ├── analyze/route.ts          ← LLM call lives here
│   │   └── auth/signout/route.ts
│   ├── layout.tsx                    ← root, fonts, Toaster
│   └── page.tsx                      ← landing page
├── lib/
│   ├── supabase/{client,server}.ts
│   ├── groq.ts                       ← Groq client (llama-3.3-70b-versatile)
│   └── utils.ts
├── types/index.ts                    ← Session, Feedback, Goal, AudioMetrics
└── middleware.ts                     ← route protection
supabase/schema.sql                   ← sessions + goals tables
AI_GUITAR_COACH_PLAN.md               ← 7-day build plan / spec
```

## Data model (`supabase/schema.sql`)
- **`sessions`** — `id`, `user_id`, `created_at`, `audio_url`, `duration_seconds`, `feedback` (JSONB), `title`, `notes`.
- **`goals`** — `id`, `user_id`, `description`, `target_date`, `completed`.

Domain types in [src/types/index.ts](src/types/index.ts): `Session`, `Feedback` (overallScore, summary, strengths, improvements, practiceExercises, nextSessionFocus), `PracticeExercise`, `Goal`, `AudioMetrics` (averagePitch, pitchStability, estimatedBPM, dynamicRange, duration).

## Notes
- **Next.js 16.** Per [AGENTS.md](AGENTS.md), this version has breaking changes — read `node_modules/next/dist/docs/` before writing any Next.js-specific code.
- **Status.** The scaffolding is in place (auth pages, app shell, session routes, analyze API, dashboard, goals) but the working tree shows these as untracked — the repo is at "Initial commit from Create Next App" plus a large set of unstaged/new feature files.

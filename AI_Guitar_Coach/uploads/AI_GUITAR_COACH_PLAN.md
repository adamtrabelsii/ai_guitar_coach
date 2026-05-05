# AI Guitar Coach — 7-Day Build Plan

## The Pitch
A web app where guitarists record or upload a playing clip and receive instant AI-powered feedback: timing accuracy, pitch detection, technique notes, and personalized practice suggestions. Built by a guitarist, for guitarists.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Fullstack in one repo, easy Vercel deploy |
| Language | TypeScript | Signals professionalism |
| Styling | Tailwind CSS + shadcn/ui | Fast, polished UI |
| Auth + DB | Supabase | Auth, Postgres, file storage in one |
| Audio Viz | WaveSurfer.js | Waveform rendering, no heavy lifting |
| Pitch Detection | Pitchy (browser) | Lightweight, accurate pitch analysis |
| AI Feedback | Claude API (claude-sonnet-4-6) | Structured, musical feedback |
| Deployment | Vercel | One-click, free tier |

---

## Database Schema

```sql
-- Users handled by Supabase Auth

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  audio_url TEXT,
  duration_seconds FLOAT,
  feedback JSONB,         -- AI response stored as JSON
  title TEXT,
  notes TEXT
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  description TEXT,
  target_date DATE,
  completed BOOLEAN DEFAULT FALSE
);
```

---

## App Pages & Features

```
/                   → Landing page (hero, demo, CTA)
/auth               → Sign up / Login
/dashboard          → Session history, streak, progress charts
/session/new        → Record or upload audio → get AI feedback
/session/[id]       → Past session detail + feedback
/goals              → Set and track practice goals
```

---

## Day-by-Day Schedule

### Day 1 — Foundation
**Goal:** Project boots, auth works, you can log in.

- [ ] `npx create-next-app@latest guitar-coach --typescript --tailwind --app`
- [ ] Install dependencies: `shadcn/ui`, `supabase-js`, `wavesurfer.js`, `pitchy`, `@anthropic-ai/sdk`
- [ ] Set up Supabase project — create tables, enable storage bucket `audio-clips`
- [ ] Wire up Supabase auth (email/password + Google OAuth)
- [ ] Build auth pages: `/auth` with sign up / login tabs
- [ ] Protect routes with middleware
- [ ] Deploy skeleton to Vercel (set env vars)

**End of Day 1 checkpoint:** Live URL exists, you can sign up and log in.

---

### Day 2 — Audio Engine
**Goal:** User can record in the browser or upload a file, see a waveform, play it back.

- [ ] Build `/session/new` page
- [ ] Implement browser recording via `MediaRecorder` API
  - Start / Stop / Pause controls
  - Live timer display
- [ ] Implement file upload (drag & drop + click) — accept `.mp3`, `.wav`, `.ogg`, `.m4a`
- [ ] Render waveform with WaveSurfer.js
- [ ] Upload audio blob to Supabase Storage, save URL to DB
- [ ] Basic playback controls (play/pause, scrub)

**End of Day 2 checkpoint:** You can record yourself, see the waveform, and the file is stored in Supabase.

---

### Day 3 — Audio Analysis
**Goal:** Extract meaningful musical data from the recording client-side.

- [ ] Run pitch detection with Pitchy on the recorded audio buffer
  - Detect dominant pitches over time → build pitch timeline
  - Calculate average pitch stability (variance = timing/intonation score)
- [ ] Detect tempo/BPM using onset detection (track amplitude spikes)
- [ ] Calculate metrics:
  - `averagePitch` (Hz)
  - `pitchStability` (0–100 score)
  - `estimatedBPM`
  - `dynamicRange` (quiet vs loud passages)
  - `totalDuration`
- [ ] Package metrics as JSON payload, ready to send to AI

**End of Day 3 checkpoint:** Console logs a JSON object of musical metrics from your playing.

---

### Day 4 — AI Feedback Integration
**Goal:** Claude analyzes the metrics and returns structured, useful feedback.

- [ ] Create API route: `POST /api/analyze`
- [ ] Build the Claude prompt:

```
You are an expert guitar coach analyzing a student's playing session.

Audio metrics:
- Duration: {duration}s
- Estimated BPM: {bpm}
- Pitch Stability Score: {stability}/100
- Dynamic Range: {range}

Provide feedback in this exact JSON format:
{
  "overallScore": number (0-100),
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "practiceExercises": [
    { "name": "exercise name", "description": "how to do it", "duration": "X minutes" }
  ],
  "nextSessionFocus": "one key thing to focus on next time"
}
```

- [ ] Call Claude API with `claude-sonnet-4-6`, parse JSON response
- [ ] Save feedback to `sessions.feedback` column in Supabase
- [ ] Display feedback on the session page:
  - Score ring (big number, color-coded)
  - Strengths / Improvements as cards
  - Practice exercises as checklist
- [ ] Add loading state with musical animation while AI processes

**End of Day 4 checkpoint:** Full flow works — record → analyze → get real AI feedback on screen.

---

### Day 5 — Dashboard & History
**Goal:** Users can track progress over time.

- [ ] Build `/dashboard`:
  - Practice streak counter
  - Total sessions count
  - Average score over last 7 sessions (line chart with recharts)
  - Recent sessions list (date, duration, score)
- [ ] Build `/session/[id]` — view any past session with full feedback
- [ ] Build `/goals` page:
  - Add goals with target date
  - Mark complete
  - Simple list view
- [ ] Add delete session functionality

**End of Day 5 checkpoint:** Dashboard shows real data, progress is visible over multiple sessions.

---

### Day 6 — Polish & UX
**Goal:** It looks and feels professional. No rough edges.

- [ ] Landing page (`/`):
  - Strong headline: "Get instant AI feedback on your guitar playing"
  - How it works: 3-step visual (Record → Analyze → Improve)
  - Demo screenshot / GIF
  - CTA button → auth
- [ ] Loading skeletons on all data-fetching pages
- [ ] Empty states: "Record your first session to get started"
- [ ] Toast notifications for success/error actions
- [ ] Mobile responsive layout (test on phone)
- [ ] Dark mode support (Tailwind dark: classes)
- [ ] Smooth page transitions
- [ ] Favicon + meta tags (title, description, og:image)

**End of Day 6 checkpoint:** Show it to a non-technical friend — they understand it immediately.

---

### Day 7 — Ship & Showcase
**Goal:** It's live, documented, and in front of recruiters.

- [ ] Final Vercel deploy, confirm all env vars set
- [ ] Test full flow end-to-end in production
- [ ] Write `README.md`:
  - Project description + screenshot
  - Live demo link (prominent)
  - Tech stack badges
  - How to run locally
  - Architecture diagram (simple)
- [ ] Record a 60-second Loom demo video
- [ ] Update LinkedIn:
  - Post with the demo link + brief story ("I'm a guitarist and dev, so I built...")
  - Add to Featured section
- [ ] Add to portfolio website
- [ ] Pin repo on GitHub

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Folder Structure

```
guitar-coach/
├── app/
│   ├── (auth)/
│   │   └── auth/page.tsx
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── session/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── goals/page.tsx
│   ├── api/
│   │   └── analyze/route.ts       ← Claude API call lives here
│   ├── layout.tsx
│   └── page.tsx                   ← Landing page
├── components/
│   ├── AudioRecorder.tsx
│   ├── WaveformPlayer.tsx
│   ├── FeedbackCard.tsx
│   ├── ScoreRing.tsx
│   └── ProgressChart.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── anthropic.ts               ← Claude client setup
│   └── audio-analysis.ts         ← Pitchy pitch detection logic
└── types/
    └── index.ts
```

---

## Recruiter Talking Points

When asked about this project, hit these points:

1. **Problem**: "Guitar students get zero feedback between lessons — I wanted to change that."
2. **Technical depth**: "I built a client-side audio analysis pipeline using the Web Audio API and Pitchy for real-time pitch detection, then structured that data into a prompt for Claude to generate musical feedback."
3. **Fullstack ownership**: "I own everything — auth, file storage, the AI integration, the frontend, and deployment."
4. **Personal angle**: "I'm a guitarist myself, so I actually use this. I know exactly what good feedback looks like."

---

## Stretch Features (if ahead of schedule)

- MIDI input support (plug in guitar interface)
- Specific song mode — upload a target song, compare your playing to it
- Weekly email digest of practice stats
- Social: share your score card as an image
- Mobile app (React Native + same Supabase backend)

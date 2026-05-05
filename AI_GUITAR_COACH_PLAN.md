# AI Guitar Coach — Build Plan (Mobile-First PWA)

## The Pitch
A web app where guitarists record or upload a playing clip and receive instant AI-powered feedback: timing accuracy, pitch detection, technique notes, and personalized practice suggestions. Built by a guitarist, for guitarists.

**Form factor:** mobile-first Progressive Web App. Same Next.js codebase serves desktop and mobile browsers, but the UI is constrained to a centered mobile-width container (max ~420px) so it always *feels* like a phone app. Users can "Add to Home Screen" on iOS/Android for a near-native experience — no app store, no second codebase.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | Fullstack in one repo, easy Vercel deploy. ⚠️ Breaking changes vs. Next 14 — see [AGENTS.md](AGENTS.md), read `node_modules/next/dist/docs/` before writing routing/cache code |
| Language | TypeScript | — |
| Styling | Tailwind CSS v4 | — |
| Auth + DB + Storage | Supabase (`@supabase/ssr`) | Auth, Postgres, file storage in one |
| Audio recording | Browser `MediaRecorder` API | Native, no deps. Works on iOS Safari 14.3+ |
| Waveform UI | wavesurfer.js | — |
| Pitch detection | pitchy | Lightweight FFT-based pitch detection in the browser |
| Charts | recharts | — |
| Toasts | sonner | — |
| AI feedback | Groq (`llama-3.3-70b-versatile` via `groq-sdk`) | Fast + cheap; structured JSON output |
| Icons | lucide-react | — |
| PWA | `manifest.json` + icons + theme-color | "Add to Home Screen", standalone display mode |
| Deployment | Vercel | — |

---

## Why PWA, not React Native

| | Mobile-first PWA (chosen) | React Native |
|---|---|---|
| Codebase | One (Next.js) | Two (web + native) |
| Build time | Days | Weeks |
| Distribution | URL — instant updates | App stores — review delays |
| Audio recording | MediaRecorder ✓ | Native APIs ✓ |
| Install | "Add to Home Screen" | App store |
| Push notifications | iOS 16.4+ only | Yes |
| Offline | Service worker (basic) | Yes |

**Trade-offs accepted:** no push notifications on older iOS, no background recording, fullscreen status bar styling needs care. For a portfolio project where users record short clips on demand, none of those matter.

---

## Layout Strategy

Every screen renders inside a **`max-w-[420px] mx-auto`** column on a neutral page background. On desktop this looks like a phone-shaped panel centered on the page. On mobile it fills the viewport.

```tsx
// Used by both (app) and (auth) groups
<main className="min-h-dvh flex justify-center bg-zinc-950">
  <div className="w-full max-w-[420px] flex flex-col">
    {children}
  </div>
</main>
```

The `(app)` group also gets a fixed bottom nav (Home / Record / Goals / Profile) and a screen-content area with `pb-20` to clear it.

---

## Wireframe Picks (from `AI_Guitar_Coach/AI Guitar Coach Wireframes.html`)

For each screen, **Option A** is the build target. Option B variants are kept as references for later polish.

| Screen | Picked | Why |
|---|---|---|
| Landing | **A — Hero scroll** | Conventional, scannable, gives room for a demo screenshot |
| Auth | **A — Tab switcher** | Single page handles both signup and login; matches Supabase's flow |
| Dashboard | **A — Streak banner + cards** | Stats-forward, clearer at a glance; B's journal style is a v2 idea |
| New Session | **A — Upload-first** with B's recording state as a sub-state | When user taps record, transition to B's "active recording" view |
| Feedback | **A — Score ring + cards** | B (loading) is the *transient state* shown while `/api/analyze` runs |
| Goals | **A — list + bottom-sheet add modal from B** | Best of both: list view + B's add-goal bottom sheet |

**Visual language from the wireframes** (apply consistently):
- Background: `zinc-950` (near-black)
- Surfaces: `zinc-900` / `zinc-800`
- Accent: `orange-500` (`#e8891a`) — CTAs, scores, streak indicators
- Mono accents: `font-mono` for timestamps/labels (Space Mono in wireframes; Geist Mono in app is fine)
- Score ring: SVG with stroke-dasharray (see wireframe Feedback A)
- Streak: large numeral + small day-dot row
- Waveform: WaveSurfer.js with orange progress, dimmed unplayed bars

---

## Database Schema (already in `supabase/schema.sql`)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  audio_url TEXT,
  duration_seconds FLOAT,
  feedback JSONB,
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

## App Routes

```
/                   → Landing (Wireframe Landing A)
/auth               → Sign up / Login tabs (Wireframe Auth A)
/dashboard          → Streak + stats + recent sessions (Wireframe Dashboard A)
/session/new        → Record or upload → analyze (Wireframe New Session A→B)
/session/[id]       → Past session detail + feedback (Wireframe Feedback A)
/goals              → Goal list + add-goal bottom sheet (Wireframe Goals A+B mix)
```

---

## Current State (as of 2026-05-04)

Already scaffolded (untracked in git, on top of the initial Next.js commit):
- ✅ Next.js 16 + Tailwind v4 + TypeScript boot
- ✅ Supabase auth wiring (`src/lib/supabase/{client,server}.ts`, `src/middleware.ts`)
- ✅ Auth page at `src/app/(auth)/auth/page.tsx`
- ✅ App-group routes: dashboard, session/new, session/[id], goals
- ✅ Groq client at `src/lib/groq.ts`
- ✅ `/api/analyze` route — accepts metrics, prompts Groq, parses JSON, persists to Supabase
- ✅ Domain types in `src/types/index.ts`
- ✅ Landing page (basic version, needs Wireframe A polish)

What's left: PWA shell, mobile-width container, polish each screen to match wireframes, audio analysis pipeline, deployment.

---

## Day-by-Day Plan

### Day 1 — Foundation polish (mostly already done)
- [x] Next.js + Tailwind + TS scaffold
- [x] Supabase auth, route protection middleware
- [x] Auth page (signup/login tabs)
- [ ] Run `supabase/schema.sql` against the project
- [ ] Wrap `(app)` and `(auth)` layouts with `max-w-[420px]` mobile container
- [ ] Commit current scaffolding (working tree has tons of untracked files)
- [ ] Deploy skeleton to Vercel, set env vars

### Day 2 — Audio Engine
- [ ] `/session/new` → Wireframe **New Session A** layout (upload zone + record button)
- [ ] Record via `MediaRecorder` — start/stop/pause, live timer, transition to **B**'s active-recording state when recording
- [ ] File upload (drag & drop + click) — `.mp3 .wav .ogg .m4a`
- [ ] WaveSurfer.js waveform render
- [ ] Upload blob to Supabase Storage bucket `audio-clips`, save URL

**Checkpoint:** record on phone in Chrome/Safari, see waveform, file lands in Supabase.

### Day 3 — Audio Analysis (client-side)
- [ ] Run Pitchy on the recorded `AudioBuffer`, build pitch timeline
- [ ] Calculate `pitchStability` (variance score 0–100)
- [ ] Onset detection → estimated BPM
- [ ] Compute `dynamicRange`, `averagePitch`, `totalDuration`
- [ ] Package as `AudioMetrics` JSON, log to console

**Checkpoint:** play A minor pentatonic, get sensible BPM and stability numbers.

### Day 4 — AI Feedback (mostly already done)
- [x] `POST /api/analyze` route exists, calls Groq, persists to Supabase
- [ ] Wire `/session/new` → call `/api/analyze` → redirect to `/session/[id]`
- [ ] Show Wireframe **Feedback B** loading state while waiting (4-step progress list)
- [ ] Render Wireframe **Feedback A** when done: score ring (SVG, orange stroke-dasharray), metric pills, waveform playback bar, strengths/work-on/next-practice cards

**Checkpoint:** full flow record → upload → analyze → see real feedback rendered.

### Day 5 — Dashboard, History, Goals
- [ ] `/dashboard` → Wireframe **Dashboard A**:
  - Greeting header + avatar
  - Dark streak banner with day-dot row
  - Stats row (avg score, sessions, hours this week)
  - Score-trend bar chart (recharts, last 7 sessions)
  - Recent sessions list with score badge
- [ ] `/session/[id]` — same UI as the post-analysis page
- [ ] `/goals` → Wireframe **Goals A**:
  - In-progress cards with progress bars + days-left
  - Completed list
  - "+ Add goal" → bottom-sheet modal (from Wireframe Goals B)
- [ ] Bottom nav (Home / Record / Goals / Profile) — fixed, in `(app)` layout
- [ ] Delete session action

### Day 6 — PWA + Polish
- [ ] **PWA setup:**
  - `public/manifest.json` (name, short_name, icons 192/512, theme_color `#e8891a`, background `#0a0a0a`, display `standalone`, start_url `/dashboard`)
  - App icons (192×192, 512×512, maskable variant)
  - `<meta name="theme-color">` and Apple-specific meta tags in `app/layout.tsx`
  - Optional: minimal service worker for offline shell (Next.js + Workbox or hand-rolled)
- [ ] Landing page → Wireframe **Landing A** with real screenshot
- [ ] Loading skeletons on data-fetched pages
- [ ] Empty states ("Record your first session…")
- [ ] Toast notifications via sonner (already wired)
- [ ] Test PWA install on actual iPhone + Android — verify "Add to Home Screen" works, standalone mode looks right
- [ ] Favicon + meta tags + og:image

**Checkpoint:** install on a phone home screen, launch full-screen, complete the full flow.

### Day 7 — Ship & Showcase
- [ ] Final Vercel deploy, all env vars set
- [ ] End-to-end test in production on a real phone
- [ ] Write `README.md` (description + screenshots + live URL + tech stack badges + run-locally instructions + architecture diagram)
- [ ] Record 60-second Loom demo (record → score reveal → dashboard)
- [ ] LinkedIn post + portfolio site + GitHub repo pin

---

## Build Prompts (for Claude Sonnet 4.6)

Each prompt is self-contained — paste it into a fresh Sonnet session and it has everything needed to build that screen with no prior context. **Run them in order.** All screens use mock data; real Supabase/Groq wiring is a separate pass after every visual is built.

### Shared Context (prepend to every prompt)

```
You're building a screen for "Guitar Coach", a mobile-first PWA in Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript. The full project plan is in AI_GUITAR_COACH_PLAN.md and the wireframes are in AI_Guitar_Coach/AI Guitar Coach Wireframes.html (each screen has 2 options; we always build Option A unless stated).

⚠️ Next.js 16 has breaking changes vs. Next 14. Read node_modules/next/dist/docs/ before writing routing, caching, or server-action code. Don't trust Next 13/14 patterns from training data.

Visual language (apply consistently, NEVER use the wireframes' sketchy/Caveat aesthetic):
- Page bg: zinc-950. Surfaces: zinc-900 / zinc-800. Borders: zinc-800.
- Text: zinc-100 primary, zinc-400 secondary, zinc-500 muted.
- Accent: orange-500 for CTAs, scores, streaks, active states. orange-400 on hover.
- Font: inherit Geist sans (already set in root layout). Use font-mono for timestamps, durations, eyebrows.
- Mobile-width: every (app) screen sits inside max-w-[420px] (provided by the (app) layout — don't re-wrap).
- Icons: lucide-react.
- Use Tailwind utility classes — no CSS modules, no styled-components.
- Toasts: sonner (already wired in root layout, just import { toast }).

Domain types live in src/types/index.ts: Session, Feedback, PracticeExercise, Goal, AudioMetrics. Import from "@/types".

Use mock data only. Do NOT query Supabase or call /api/analyze in this pass — that's wired up in a later phase.
```

---

### Prompt 1: Mobile shell + bottom nav (foundation)

```
[paste Shared Context]

Goal: Replace the desktop top-nav layout in the (app) route group with a mobile shell — phone-width column + fixed bottom nav.

Files:
- Rewrite src/app/(app)/layout.tsx
- Create src/components/BottomNav.tsx

Requirements:
- Preserve the existing auth check: getUser() → redirect to /auth if null
- Wrap children in <main className="min-h-dvh flex justify-center bg-zinc-950"> with an inner <div className="w-full max-w-[420px] flex flex-col pb-20"> column
- BottomNav is a client component (uses usePathname). Tabs:
    Home    → /dashboard       icon: Home
    Record  → /session/new     icon: Mic
    Goals   → /goals           icon: Target
    Profile → /profile         icon: User
  Active tab when pathname starts with the route. Active = orange-500. Inactive = zinc-500. Hover = zinc-300.
- BottomNav: fixed bottom-0, centered, max-w-[420px], h-16, border-t border-zinc-800, bg-zinc-950, grid-cols-4
- Each tab: flex-col items-center justify-center gap-1, icon size-5, text-[10px] uppercase tracking-wider
- Remove the old horizontal top nav entirely — each page renders its own header

Out of scope: don't modify any page files. /profile route can 404 for now.

Done when: navigating /dashboard, /session/new, /goals shows the fixed bottom nav with correct active highlighting on a 420px-wide centered column.
```

---

### Prompt 2: Landing page

```
[paste Shared Context]

Goal: Build the landing page per Wireframe "Landing — Option A (Hero scroll)".

File: replace src/app/page.tsx

Layout (top to bottom, all inside a max-w-md mx-auto column on a zinc-950 page):
1. Top bar (sticky): small circular outline logo + "GuitarAI" wordmark left; "Log in" pill (bg-zinc-900, rounded-full, px-4 py-1.5) right → links to /auth
2. Hero (centered, py-12):
   - Eyebrow: "AI GUITAR COACH" — font-mono text-xs tracking-[0.15em] text-orange-500
   - H1: "Get real feedback on your playing" — text-4xl font-bold leading-tight, two lines
   - Sub: "Record yourself. Get instant AI analysis of your pitch, timing & technique." — text-zinc-400
   - CTA: "Start for free →" — bg-orange-500 hover:bg-orange-400 text-white rounded-full px-6 py-3 font-semibold, links to /auth
3. <hr className="border-zinc-800" />
4. "How it works" section:
   - Section badge: small uppercase font-mono "HOW IT WORKS" with text-zinc-500
   - 3 numbered rows. Each: 28px circular border-zinc-700 rounded-full with the digit, then a column with bold title + zinc-400 subtitle.
     1. Record or upload / Any device, any clip
     2. AI analyzes it / Pitch, timing, dynamics
     3. Get your score / Exercises tailored to you
5. Demo placeholder: dashed border-zinc-700 rounded-lg h-48 flex items-center justify-center, text-zinc-600 font-mono text-xs "[ demo screenshot ]"
6. Footer: text-zinc-500 text-xs text-center "Built by a guitarist, for guitarists."

Constraints: NOT inside the (app) layout — uses the root layout directly. No bottom nav here. Use Link from next/link.

Done when: page scrolls cleanly, CTA goes to /auth, no Caveat font, palette is consistent.
```

---

### Prompt 3: Auth page polish

```
[paste Shared Context]

Goal: Polish the existing auth page to match Wireframe "Auth — Option A (Tab switcher)". The file already exists with working Supabase logic — keep the logic, replace the visual structure.

File: src/app/(auth)/auth/page.tsx (rewrite UI, preserve handleSubmit logic)

Layout (centered column, max-w-sm):
1. Logo block: 40px circular border-zinc-700 with "G" inside, then "GuitarAI" text-xl font-bold below.
2. Segmented tab control (border border-zinc-800 rounded-lg overflow-hidden flex):
   - Two equal halves: "Sign up" / "Log in"
   - Active half: bg-zinc-100 text-zinc-950. Inactive: text-zinc-500.
   - Clicking switches `mode` state (already exists)
3. Form (flex-col gap-3):
   - Each field: small zinc-400 label above, then input. Inputs: bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:border-orange-500 outline-none.
   - Email field, Password field
4. Submit button: bg-orange-500 hover:bg-orange-400 disabled:opacity-50 rounded-full py-3 font-semibold. Label: "Create account" or "Sign in" based on mode. Loading state shows "Loading...".
5. Divider with "or": <hr className="flex-1 border-zinc-800"/> "or" <hr className="flex-1 border-zinc-800"/>
6. Google OAuth button: bg-zinc-900 border-zinc-800 rounded-full py-3 font-semibold "Continue with Google" — wire to supabase.auth.signInWithOAuth({ provider: 'google' }) on click.

Don't break: the existing useState, handleSubmit, toast calls, router.push("/dashboard").

Done when: tabs swap mode, both flows still work against Supabase, Google button initiates OAuth.
```

---

### Prompt 4: Dashboard

```
[paste Shared Context]

Goal: Build the dashboard per Wireframe "Dashboard — Option A (Streak + cards)" with mock data.

File: rewrite src/app/(app)/dashboard/page.tsx (server component is fine, no Supabase queries yet)

Mock data (declare at top of file):
- user: { firstName: "Alex" }
- streak: { days: 7, lastWeek: [true, true, true, true, true, true, true] } // last is today
- stats: { avgScore: 84, sessions: 23, hoursThisWeek: 4 }
- scoreTrend: [
    { day: "Mon", score: 72 }, { day: "Tue", score: 78 },
    { day: "Wed", score: 75 }, { day: "Thu", score: 81 },
    { day: "Fri", score: 85 }, { day: "Sat", score: 83 },
    { day: "Today", score: 92 }
  ]
- recent: [
    { id: "1", title: "Pentatonic run", durationSec: 192, score: 92, createdAt: "Today" },
    { id: "2", title: "Barre chord practice", durationSec: 340, score: 78, createdAt: "Yesterday" },
    { id: "3", title: "Fingerpicking", durationSec: 125, score: 71, createdAt: "Sat" },
  ]

Sections (px-4 gap-3 flex-col, top to bottom):
1. Header row: "Good morning," (zinc-400 text-sm) + "{firstName} 👋" (text-2xl font-bold) on left; 34px circular avatar (bg-zinc-800) on right
2. Streak banner: bg-zinc-900 rounded-2xl p-4 flex gap-4
   - Left: text-3xl font-bold text-orange-500 "{days}" + tiny mono "DAY STREAK" below
   - Right: row of 7 day-dots (size-6 rounded-md). Practiced day = bg-orange-500. Today gets ring-2 ring-zinc-100. Below: orange-400 text-xs "Today is day {days} — don't break it!"
3. Stats row (grid grid-cols-3 gap-2):
   - 3 cards: bg-zinc-900 rounded-lg p-3 text-center. Big number (text-2xl font-bold), small mono label below (text-[10px] text-zinc-500)
4. Score trend section:
   - Section badge "SCORE TREND" (uppercase mono text-xs text-zinc-500)
   - Bar chart using recharts (BarChart, Bar) — height 80px. Bars: zinc-700 default, orange-500 for the last (today). XAxis with day labels.
5. Recent sessions:
   - Section badge "RECENT SESSIONS"
   - List of rows (Link to /session/{id}): flex justify-between, py-3, border-b border-zinc-800 (last has no border)
   - Left: title (text-sm font-medium) + meta "{createdAt} · {mm:ss}" (font-mono text-[10px] text-zinc-500)
   - Right: score badge — if score >= 90: bg-orange-500 text-white. Else bg-zinc-800 text-zinc-100. Pill: rounded-full px-3 py-1 text-sm font-bold

Helpers (top of file): formatDuration(sec) → "Xm Ys".

Done when: page renders the full mocked dashboard, score trend chart shows correctly, recent sessions are clickable links (404 is fine for now).
```

---

### Prompt 5: New Session (record + upload)

```
[paste Shared Context]

Goal: Build the New Session page per Wireframe "New Session — Option A (Upload-first)" with state transitions to Wireframe Option B (Active recording state) when recording.

File: rewrite src/app/(app)/session/new/page.tsx — must be a "use client" component.

State: { phase: "idle" | "recording" | "review", audioBlob: Blob | null, durationSec: number, sessionTitle: string }

UI for phase === "idle":
1. Header: back arrow (← lucide ArrowLeft) + "New Session" (text-xl font-bold)
2. Upload zone: dashed border-2 border-zinc-700 rounded-2xl p-8 text-center bg-orange-500/5
   - Icon: lucide Upload size-8 in a rounded square
   - "Drop your recording" (font-bold)
   - Mono text-xs ".mp3 · .wav · .ogg · .m4a"
   - "Browse files" pill button (bg-zinc-800 rounded-full px-5 py-2)
   - Accepts drag-drop and click → triggers hidden <input type="file" accept="audio/*">
   - On file: setAudioBlob, setPhase("review")
3. Divider: <hr/> "or record now" <hr/>
4. Big record button: 64px circular border-2 border-zinc-100 with a 24px red-500 dot inside. Below: "tap to record" (text-orange-400 text-xs italic)
   - On click: setPhase("recording"), start MediaRecorder
5. Session name input (label + bg-zinc-900 input)
6. Analyze button at bottom: bg-orange-500 rounded-full py-3 font-bold. Disabled (opacity-40) until audioBlob is set. On click: setPhase("processing") and (for now) just toast.success("Analysis would start here").

UI for phase === "recording":
1. Header: 3-step progress bar (3 equal segments, segment 1 = orange-500, others zinc-800, h-1 rounded-full)
2. Eyebrow mono "STEP 1 · RECORD" + "Play something!" (text-2xl font-bold) centered
3. Live waveform — fake it: 12 vertical bars, varying heights animated with Math.sin(Date.now()) — bg-orange-500. Use a useEffect + setInterval to re-render every 100ms. Annotation below: "live waveform as you play" (orange italic xs)
4. Timer: font-mono text-3xl font-bold (use mm:ss format, increments via setInterval while recording)
5. Status: "● Recording…" red-500 font-bold
6. Controls row: pause icon (zinc-500 circle) + 72px red-500 stop button (square inside) + trash icon (zinc-500 circle)
   - Stop click → MediaRecorder.stop(), set audioBlob, setPhase("review")
   - Trash → setPhase("idle"), reset state

UI for phase === "review":
- Same as idle BUT upload zone is replaced by a small card: "Recording saved · Xs" with a "× clear" button. Analyze button enabled.

MediaRecorder requirements:
- Request mic via navigator.mediaDevices.getUserMedia({ audio: true })
- Handle permission denial with toast.error
- Use mimeType: 'audio/webm' (default; works on iOS 14.3+)
- Stop all tracks on cleanup

Out of scope: actual upload to Supabase Storage, actual analysis. Analyze button just toasts for now.

Done when: can record from mic, see timer count, stop and see "review" state. Can also drag-drop an audio file. Analyze button enables only when audio exists.
```

---

### Prompt 6: Feedback / Session detail

```
[paste Shared Context]

Goal: Build the session feedback page per Wireframe "Feedback — Option A (Score ring + cards)". Use mock data; Wireframe Option B (loading state) is a sub-component used while data is "loading".

File: rewrite src/app/(app)/session/[id]/page.tsx — client component.

State: { loading: boolean }. Default true. After 1500ms via setTimeout, flip to false (simulates the Groq round-trip).

Mock data (declare at top):
- session: { id: params.id, title: "Pentatonic run", durationSec: 192, createdAt: "Today" }
- feedback: Feedback object (use the type from @/types):
    overallScore: 92,
    summary: "Excellent session! Your pitch accuracy was outstanding today.",
    strengths: ["Consistent pitch accuracy throughout", "Good dynamic control in phrases"],
    improvements: ["Slight timing drift around 2:10"],
    practiceExercises: [{ name: "Metronome slow-down drill", description: "Practice the same run at 80 BPM for 5 minutes focusing on evenness.", duration: "5 minutes" }],
    nextSessionFocus: "Tighten the timing on faster runs"
- metrics: { pitch: 94, timing: 88, bpm: 120 }

Loading view (when loading === true) — Wireframe Feedback B:
- Centered column, gap-4
- Animated dashed circle (border-3 border-dashed border-orange-500, size-20) with a music note ♪ inside (text-3xl)
- Heading: "Analyzing your playing…" (text-xl font-bold)
- Sub: "Detecting pitch, timing & dynamics" (text-zinc-400 text-sm)
- 4-step progress list (gap-2):
    ✓ Audio uploaded         (orange filled circle with ✓)
    ✓ Pitch detected         (orange filled circle with ✓)
    ◐ AI coach reviewing…    (dashed orange circle, text-zinc-100)
    ○ Building practice plan (dashed zinc-700 circle, text-zinc-500)
- Footer text: "Takes about 10–15 seconds" (zinc-500 text-xs)

Loaded view (when loading === false) — Wireframe Feedback A:
1. Header: ← back + (title text-base font-bold) + "{createdAt} · {mm:ss}" font-mono text-[10px]
2. Score ring: 110px SVG. Two concentric circles r=46, stroke-width=10. Track = stroke-zinc-800. Progress = stroke-orange-500, stroke-dasharray=289, stroke-dashoffset = 289 * (1 - overallScore/100), stroke-linecap=round, transform=rotate(-90 55 55). Centered text inside: big number (text-3xl font-bold) + "/ 100" (font-mono text-[10px] text-zinc-500)
3. Below ring: "Excellent session! 🎸" font-bold + summary in text-sm text-zinc-400
4. Metric pills row (flex-wrap gap-2 justify-center):
   - bg-zinc-900 rounded-full px-3 py-1.5 font-mono text-xs
   - "Pitch {metrics.pitch}/100", "Timing {metrics.timing}/100", "{metrics.bpm} BPM"
5. Waveform playback bar: bg-zinc-900 border border-zinc-800 rounded-lg p-3
   - Faked waveform: 12 bars (heights varying) with first 5 in orange-500 (played), rest zinc-700
   - Below: time "0:42" left, controls (skip-back/play/skip-forward) center, "3:12" right
6. Strengths section: section badge "STRENGTHS", then list of items. Each: orange-500 filled checkbox (Check icon white) + text-sm
7. Work on section: section badge "WORK ON", same shape but checkbox is empty zinc-700 with → arrow inside
8. Next practice card: section badge "NEXT PRACTICE", then bg-zinc-900 rounded-lg p-3 with practiceExercises[0].name (font-bold) + .description (text-sm text-zinc-400)

Done when: page mounts in loading state for 1.5s then reveals the score-ring view. Score ring's progress arc reflects overallScore correctly (try 50 vs 92 to verify math).
```

---

### Prompt 7: Goals (list + add modal)

```
[paste Shared Context]

Goal: Build the goals page per Wireframe "Goals — Option A (Goal list + progress)" with the bottom-sheet add-modal from Wireframe Option B.

File: rewrite src/app/(app)/goals/page.tsx — client component (modal state).

State: { addOpen: boolean, draftDescription: string, draftDate: string }

Mock data:
- inProgress: [
    { id: "1", description: "Learn Wonderwall full song", targetDate: "Jun 1", percent: 65, daysLeft: 28 },
    { id: "2", description: "Score 90+ avg for a week", targetDate: "May 11", percent: 80, daysLeft: 1, sublabel: "6/7 days done" },
  ]
- completed: [
    { id: "3", description: "Practice 5 days in a row" },
    { id: "4", description: "Master F barre chord" },
  ]

Layout (px-4 gap-4 flex-col):
1. Header row: "Goals" text-2xl font-bold left; "+ Add goal" pill (bg-orange-500 text-white rounded-full px-4 py-1.5 text-sm font-bold) right → onClick: setAddOpen(true)
2. In-progress section:
   - Section badge "IN PROGRESS"
   - Each goal card: bg-zinc-900 rounded-xl p-4
     - Top row: description (font-bold flex-1) + targetDate (font-mono text-[10px] text-zinc-500)
     - Progress bar: h-1.5 bg-zinc-800 rounded-full → inner bar w-{percent}% bg-orange-500 rounded-full
     - Bottom row: orange-400 italic text-xs (sublabel ?? "{percent}% complete") left + font-mono text-[10px] "{daysLeft} days left" right (or "1 day left!" if daysLeft===1)
3. Completed section:
   - Section badge "COMPLETED"
   - Each: flex gap-2 items-center, opacity-50, py-2 border-b border-zinc-800 (last no border). Filled checkbox (size-4 bg-zinc-100 rounded-sm with Check icon). Description text-sm line-through.

Add-goal bottom sheet (when addOpen):
- Backdrop: fixed inset-0 bg-black/60 z-40, click → setAddOpen(false)
- Sheet: fixed bottom-0 inset-x-0 (centered, max-w-[420px] mx-auto). bg-zinc-900 border border-zinc-800 rounded-t-3xl p-4 pb-8 z-50
- Drag handle: 36×4 rounded-full bg-zinc-700 mx-auto mb-4
- Heading: "New goal" text-xl font-bold mb-4
- Field 1: label "What do you want to achieve?" (text-zinc-400 text-sm) + bg-zinc-800 border border-zinc-700 rounded-lg input
- Field 2: label "Target date" + bg-zinc-800 input type="date"
- Buttons row: "Cancel" (flex-1 bg-zinc-800 rounded-full py-3 font-bold) + "Save goal →" (flex-2 bg-orange-500 rounded-full py-3 font-bold)
- Save → toast.success("Goal saved (mock)") + close modal + reset draft

Animation: optional — translate-y-full when closed, translate-y-0 when open, transition-transform.

Done when: list renders, +Add goal opens bottom sheet, both buttons close it, backdrop click closes it.
```

---

### Prompt 8: Wire up real data (after all visuals are built)

```
[paste Shared Context]

Goal: Replace mock data across the app with real Supabase queries and real audio analysis. The visual layouts already exist — only swap data sources.

Files & changes:
1. src/app/(app)/dashboard/page.tsx
   - Convert to async server component
   - Query sessions for current user (last 50, order by created_at desc)
   - Compute streak from session createdAt timestamps (consecutive days incl. today)
   - Compute avgScore from feedback.overallScore
   - hoursThisWeek = sum of duration_seconds in last 7 days / 3600
   - scoreTrend = last 7 sessions, in chronological order
   - recent = top 3 most recent

2. src/app/(app)/session/[id]/page.tsx
   - Convert to async server component (drop the loading-state simulation; loading is handled by /session/new during analyze)
   - Fetch session by id where user_id === current user. 404 if not found.
   - Render feedback from session.feedback (cast to Feedback type)
   - Keep the score ring + cards layout exactly as is

3. src/app/(app)/session/new/page.tsx
   - Add real upload step: on Analyze click, upload audioBlob to Supabase Storage bucket `audio-clips` at path `{userId}/{uuid}.webm`. Get public URL.
   - Compute audio metrics client-side using Pitchy + a small onset-detection helper. Create src/lib/audio-analysis.ts that exports analyzeAudio(blob) → AudioMetrics.
   - POST { metrics, audioUrl, userId, title } to /api/analyze
   - On success, router.push(`/session/${sessionId}`)
   - Show the loading state (Wireframe Feedback B layout) while waiting — extract that as src/components/AnalysisLoading.tsx and render it instead of the form during phase === "processing"
   - Handle errors with toast.error, return to phase === "review"

4. src/app/(app)/goals/page.tsx
   - Convert list reads to a server component, modal stays a client component
   - Save goal → server action that inserts into goals table with current user's id. Use revalidatePath('/goals').

5. Add bucket creation note to README: Supabase Storage bucket `audio-clips`, public-read.

Constraints:
- Keep all visual layouts identical
- Use the existing types from @/types
- Use createClient from @/lib/supabase/server in server components, @/lib/supabase/client in client components

Done when: full record → upload → analyze → see your real score flow works in dev. Dashboard reflects your actual session history.
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Groq
GROQ_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Folder Structure (current)

```
guitar-coach/
├── src/
│   ├── app/
│   │   ├── (auth)/auth/page.tsx        ← signup/login
│   │   ├── (app)/
│   │   │   ├── layout.tsx              ← protected mobile shell + bottom nav
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── session/new/page.tsx    ← record + upload + analyze
│   │   │   ├── session/[id]/page.tsx   ← feedback view
│   │   │   └── goals/page.tsx
│   │   ├── api/
│   │   │   ├── analyze/route.ts        ← Groq call
│   │   │   └── auth/signout/route.ts
│   │   ├── layout.tsx                  ← root, fonts, Toaster, PWA meta
│   │   └── page.tsx                    ← landing
│   ├── components/                     ← AudioRecorder, WaveformPlayer, ScoreRing, FeedbackCard, ProgressChart, BottomNav (TODO)
│   ├── lib/
│   │   ├── supabase/{client,server}.ts
│   │   ├── groq.ts                     ← Groq client
│   │   ├── audio-analysis.ts           ← Pitchy pipeline (TODO)
│   │   └── utils.ts
│   ├── types/index.ts                  ← Session, Feedback, Goal, AudioMetrics
│   └── middleware.ts                   ← route protection
├── public/
│   ├── manifest.json                   ← TODO Day 6
│   └── icons/                          ← TODO Day 6
├── supabase/schema.sql
├── AI_Guitar_Coach/                    ← wireframes (HTML + design canvas)
└── AI_GUITAR_COACH_PLAN.md             ← this file
```

---

## Recruiter Talking Points

1. **Problem:** "Guitar students get zero feedback between lessons — I built the missing piece."
2. **Technical depth:** "Client-side audio analysis pipeline using Web Audio + Pitchy for real-time pitch detection, structured into a prompt for an LLM to generate musical feedback. Shipped as an installable PWA so it feels like a native app without a second codebase."
3. **Fullstack ownership:** auth, file storage, AI integration, frontend, deployment.
4. **Personal angle:** "I'm a guitarist — I actually use this."

---

## Stretch Features

- MIDI input support (audio interface)
- Song mode — upload a target track, compare playing to it
- Weekly email digest (Resend)
- Shareable score-card image (og-image generation)
- Push notifications for streak reminders (iOS 16.4+ / Android)
- Real React Native app sharing the Supabase backend (if traction justifies it)

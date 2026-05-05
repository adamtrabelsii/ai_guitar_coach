import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-stone-950/95 backdrop-blur border-b border-stone-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-stone-700 flex items-center justify-center text-xs font-bold">
            G
          </div>
          <span className="font-bold">GuitarAI</span>
        </div>
        <Link
          href="/auth"
          className="bg-stone-900 border border-stone-800 text-stone-100 rounded-full px-4 py-1.5 text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          Log in
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-12 gap-5 w-full max-w-md mx-auto">
        <p className="font-mono text-xs tracking-[0.15em] text-amber-500 uppercase">
          AI Guitar Coach
        </p>
        <h1 className="text-4xl font-bold leading-tight">
          Get real feedback<br />on your playing
        </h1>
        <p className="text-stone-400 text-base leading-relaxed">
          Record yourself. Get instant AI analysis<br />of your pitch, timing & technique.
        </p>
        <Link
          href="/auth"
          className="bg-amber-500 hover:bg-amber-400 text-white rounded-full px-8 py-3 font-semibold text-base transition-colors w-full max-w-xs text-center mt-2"
        >
          Start for free →
        </Link>
      </section>

      <hr className="border-stone-800" />

      {/* How it works */}
      <section className="px-6 py-10 flex flex-col gap-6 w-full max-w-md mx-auto">
        <p className="font-mono text-xs tracking-[0.15em] text-stone-500 uppercase">
          How it works
        </p>
        <div className="flex flex-col gap-5">
          {[
            { n: "1", title: "Record or upload", sub: "Any device, any clip" },
            { n: "2", title: "AI analyzes it", sub: "Pitch, timing, dynamics" },
            { n: "3", title: "Get your score", sub: "Exercises tailored to you" },
          ].map(({ n, title, sub }) => (
            <div key={n} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full border border-stone-700 flex items-center justify-center text-sm font-bold text-stone-300 shrink-0">
                {n}
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-stone-400 text-sm">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo placeholder */}
      <div className="px-6 pb-10 w-full max-w-md mx-auto">
        <div className="rounded-xl border border-dashed border-stone-700 h-48 flex items-center justify-center">
          <span className="font-mono text-xs text-stone-600">[ demo screenshot ]</span>
        </div>
      </div>

      <footer className="text-center text-stone-600 text-xs py-6 border-t border-stone-900">
        Built by a guitarist, for guitarists.
      </footer>
    </div>
  )
}

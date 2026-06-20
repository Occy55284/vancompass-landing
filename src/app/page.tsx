import Image from "next/image";
import WaitlistForm from "./waitlist-form";
import Reveal from "./reveal";
import BrowserFrame from "./browser-frame";

const accents = {
  sky: {
    badge: "bg-sky-400/10 text-sky-300",
    border: "hover:border-sky-400/30",
    glow: "hover:shadow-sky-500/10",
  },
  violet: {
    badge: "bg-violet-400/10 text-violet-300",
    border: "hover:border-violet-400/30",
    glow: "hover:shadow-violet-500/10",
  },
  teal: {
    badge: "bg-teal-400/10 text-teal-300",
    border: "hover:border-teal-400/30",
    glow: "hover:shadow-teal-500/10",
  },
  amber: {
    badge: "bg-amber-400/10 text-amber-300",
    border: "hover:border-amber-400/30",
    glow: "hover:shadow-amber-500/10",
  },
  orange: {
    badge: "bg-orange-400/10 text-orange-300",
    border: "hover:border-orange-400/30",
    glow: "hover:shadow-orange-500/10",
  },
  emerald: {
    badge: "bg-emerald-400/10 text-emerald-300",
    border: "hover:border-emerald-400/30",
    glow: "hover:shadow-emerald-500/10",
  },
} as const;

type Accent = keyof typeof accents;

const features: {
  emoji: string;
  title: string;
  desc: string;
  screenshot: string;
  accent: Accent;
}[] = [
  {
    emoji: "🏄",
    title: "Surf spots",
    desc: "Computed surf score, traffic-light verdict, tide times, wetsuit advice, and a 5-day forecast — at a glance.",
    screenshot: "/screenshots/surf.png",
    accent: "sky",
  },
  {
    emoji: "🪁",
    title: "Kite spots",
    desc: "Wind-aware spot picks so you know where to rig before you drive there.",
    screenshot: "/screenshots/kite.png",
    accent: "violet",
  },
  {
    emoji: "🎣",
    title: "Fishing marks",
    desc: "Curated marks around the UK coast, with live conditions overlaid.",
    screenshot: "/screenshots/fishing.png",
    accent: "teal",
  },
  {
    emoji: "🏕️",
    title: "Wild camps & campsites",
    desc: "Find a place to park up for the night, rated and located by people who've been there.",
    screenshot: "/screenshots/camping.png",
    accent: "amber",
  },
  {
    emoji: "⛽",
    title: "Van services",
    desc: "Live radius search for fuel, supermarkets, chemists and campsites — plus real-time UK fuel prices.",
    screenshot: "/screenshots/services.svg",
    accent: "orange",
  },
  {
    emoji: "📍",
    title: "Near me",
    desc: "Drop a pin and see every surf, kite, fishing, camping and service spot within reach — sorted by distance.",
    screenshot: "/screenshots/nearme.png",
    accent: "emerald",
  },
];

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-x-hidden">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#06080d]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-3 text-lg font-semibold tracking-tight text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1 shadow-md shadow-black/30 ring-1 ring-white/10">
              <Image src="/logo.png" alt="VanCompass logo" width={36} height={36} className="rounded-full" />
            </span>
            Van<span className="text-emerald-400">Compass</span>
          </span>
          <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">
              Features
            </a>
            <a href="#preview" className="transition-colors hover:text-white">
              Preview
            </a>
          </nav>
          <a
            href="#waitlist"
            className="rounded-full border border-emerald-400/30 bg-emerald-400/5 px-4 py-2 text-sm font-medium text-emerald-300 transition-all hover:border-emerald-400/50 hover:bg-emerald-400/15"
          >
            Get early access
          </a>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="bg-grid pointer-events-none absolute inset-0" />
          <div className="animate-float-slow pointer-events-none absolute -left-32 -top-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
          <div className="animate-float pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pt-16 pb-24 sm:pt-24 lg:grid-cols-2 lg:gap-12">
            <div className="animate-fade-in-up flex flex-col items-center text-center lg:items-start lg:text-left">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-zinc-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
                </span>
                UK VAN LIFE COMPANION MAP
              </span>
              <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-6xl">
                Know before you go.
                <br />
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Find the spot. Check the conditions.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-zinc-400">
                One live map of the UK for surf, kite, fishing and wild camping spots —
                with weather, tides and van services built in. Built for life on the road.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#waitlist"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-3.5 text-base font-semibold text-black shadow-lg shadow-emerald-400/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-emerald-400/30"
                >
                  Join the waitlist
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-3.5 text-base font-medium text-zinc-200 transition-all duration-300 hover:border-white/30 hover:bg-white/5"
                >
                  See what&apos;s inside
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mx-0">
              <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="rotate-2 transition-transform duration-700 ease-out hover:rotate-0">
                <BrowserFrame
                  src="/screenshots/nearme.png"
                  alt="VanCompass map showing nearby spots"
                  width={599}
                  height={543}
                />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
          <Reveal className="mb-12 text-center">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Everything on one map</h2>
            <p className="mt-3 text-zinc-400">No more juggling five different apps before you drive somewhere.</p>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div
                  className={`group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05] hover:shadow-2xl ${accents[f.accent].border} ${accents[f.accent].glow}`}
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${accents[f.accent].badge}`}>
                    {f.emoji}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>

                  <div className="mt-4 block overflow-hidden rounded-lg border border-white/10 sm:hidden">
                    <Image src={f.screenshot} alt={`${f.title} preview`} width={480} height={320} className="h-auto w-full" />
                  </div>

                  <div className="pointer-events-none absolute inset-x-4 bottom-full z-10 mb-3 hidden origin-bottom scale-95 overflow-hidden rounded-xl border border-emerald-400/30 bg-[#0b1018] opacity-0 shadow-2xl shadow-black/50 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 sm:block">
                    <Image src={f.screenshot} alt={`${f.title} preview`} width={480} height={320} className="h-auto w-full" />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="preview" className="relative mx-auto max-w-6xl px-6 pb-24">
          <Reveal className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-sky-400/10 blur-3xl" />
              <div className="-rotate-1 transition-transform duration-700 ease-out hover:rotate-0">
                <BrowserFrame
                  src="/screenshots/surf.png"
                  alt="Surf spot detail with conditions and verdict"
                  width={929}
                  height={512}
                />
              </div>
            </div>
            <div className="order-1 text-center lg:order-2 lg:text-left">
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">Tap a spot. Get the verdict.</h2>
              <p className="mt-4 text-zinc-400">
                Every spot on the map comes with live wind, waves, weather and tides —
                distilled into a simple, honest &ldquo;go or no-go&rdquo; so you spend less time
                checking five different apps and more time on the road.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
                {["Live wind & waves", "Tide times", "Wetsuit advice"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        <section id="waitlist" className="relative mx-auto flex max-w-2xl flex-col items-center px-6 pb-28 text-center">
          <Reveal className="flex w-full flex-col items-center">
            <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 shadow-2xl shadow-black/40 sm:p-10">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-orange-400/10 blur-3xl" />

              <h2 className="relative text-2xl font-semibold text-white sm:text-3xl">VanCompass is launching soon.</h2>
              <p className="relative mt-3 text-zinc-400">
                Drop your email and we&apos;ll let you know the moment early access opens.
              </p>
              <div className="relative">
                <WaitlistForm />
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="relative border-t border-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <Image src="/logo.png" alt="" width={20} height={20} className="rounded-full" />
            Van<span className="text-emerald-400">Compass</span>
          </span>
          <p className="text-sm text-zinc-500">© {new Date().getFullYear()} VanCompass. UK van life, sorted.</p>
        </div>
      </footer>
    </div>
  );
}

import Image from "next/image";
import WaitlistForm from "./waitlist-form";

const features = [
  {
    emoji: "🏄",
    title: "Surf spots",
    desc: "Computed surf score, traffic-light verdict, tide times, wetsuit advice, and a 5-day forecast — at a glance.",
  },
  {
    emoji: "🪁",
    title: "Kite spots",
    desc: "Wind-aware spot picks so you know where to rig before you drive there.",
  },
  {
    emoji: "🎣",
    title: "Fishing marks",
    desc: "Curated marks around the UK coast, with live conditions overlaid.",
  },
  {
    emoji: "🏕️",
    title: "Wild camps & campsites",
    desc: "Find a place to park up for the night, rated and located by people who've been there.",
  },
  {
    emoji: "⛽",
    title: "Van services",
    desc: "Live radius search for fuel, supermarkets, chemists and campsites — plus real-time UK fuel prices.",
  },
  {
    emoji: "🌦️",
    title: "Weather & tides",
    desc: "Marine and land forecasts baked into every spot, so you get a straight 'should I go?' answer.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <Image src="/logo.png" alt="VanCompass logo" width={32} height={32} className="rounded-md" />
          Van<span className="text-emerald-400">Compass</span>
        </span>
        <a
          href="#waitlist"
          className="rounded-full border border-emerald-400/30 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-400/10"
        >
          Get early access
        </a>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-16 pb-24 text-center sm:pt-24">
          <span className="mb-5 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium tracking-wide text-zinc-400">
            UK VAN LIFE COMPANION MAP
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Know before you go.
            <br />
            <span className="text-emerald-400">Find the spot. Check the conditions.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-zinc-400">
            One live map of the UK for surf, kite, fishing and wild camping spots —
            with weather, tides and van services built in. Built for life on the road.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="#waitlist"
              className="rounded-full bg-emerald-400 px-8 py-3 text-base font-semibold text-black transition-colors hover:bg-emerald-300"
            >
              Join the waitlist
            </a>
            <a
              href="#features"
              className="rounded-full border border-white/15 px-8 py-3 text-base font-medium text-zinc-200 transition-colors hover:bg-white/5"
            >
              See what's inside
            </a>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-emerald-400/30"
              >
                <div className="mb-4 text-3xl">{f.emoji}</div>
                <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Tap a spot. Get the verdict.
          </h2>
          <p className="mt-4 text-zinc-400">
            Every spot on the map comes with live wind, waves, weather and tides —
            distilled into a simple, honest "go or no-go" so you spend less time
            checking five different apps and more time on the road.
          </p>
        </section>

        <section
          id="waitlist"
          className="mx-auto flex max-w-2xl flex-col items-center px-6 pb-28 text-center"
        >
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            VanCompass is launching soon.
          </h2>
          <p className="mt-3 text-zinc-400">
            Drop your email and we&apos;ll let you know the moment early access opens.
          </p>
          <WaitlistForm />
        </section>
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} VanCompass. UK van life, sorted.
      </footer>
    </div>
  );
}

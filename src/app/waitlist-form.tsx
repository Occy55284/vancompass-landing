"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "loading" | "success" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const { error } = await supabase.from("waitlist").insert({ email });
    if (error) {
      setStatus(error.code === "23505" ? "success" : "error");
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-5 py-4 text-left">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          ✓
        </span>
        <p className="text-sm text-emerald-200">
          You&apos;re on the list — we&apos;ll email you when early access opens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-400/60 focus:bg-white/[0.07]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-emerald-400 px-7 py-3.5 text-sm font-semibold text-black transition-all hover:bg-emerald-300 hover:shadow-lg hover:shadow-emerald-400/25 disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Notify me"}
        </button>
      </div>
      {status === "error" && <p className="mt-3 text-sm text-red-400">Something went wrong — please try again.</p>}
    </form>
  );
}

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
      <p className="mt-8 text-emerald-300">
        You&apos;re on the list — we&apos;ll email you when early access opens.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-emerald-400"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-300 disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : "Notify me"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-400 sm:absolute sm:-bottom-7">
          Something went wrong — please try again.
        </p>
      )}
    </form>
  );
}

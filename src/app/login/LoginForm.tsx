"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.replace("/");
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Erreur");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass w-full max-w-sm p-8 flex flex-col gap-6 !rounded-[26px]">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <span className="brand-mark overflow-hidden"><img src="/brand/logo.png" alt="" width={36} height={36} decoding="async" className="w-full h-full object-cover" /></span>
        <div>
          <div className="brand-name text-xl">Sales<span>Game</span></div>
          <p className="text-[var(--ink-faint)] text-xs mono">Entraînement vente &amp; closing</p>
        </div>
      </div>
      <label className="flex flex-col gap-2">
        <span className="eyebrow">Mot de passe</span>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field text-lg tracking-[0.3em]"
          placeholder="••••"
        />
      </label>
      {error && <p className="text-[var(--bad)] text-sm font-semibold">{error}</p>}
      <button type="submit" disabled={loading || !password} className="btn btn-primary w-full">
        {loading ? "…" : "Entrer"}
      </button>
    </form>
  );
}

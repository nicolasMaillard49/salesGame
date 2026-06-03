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
    <form onSubmit={submit} className="w-full max-w-sm card p-8 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="logo-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 14l4-4 4 3 6-7" />
            <path d="M14 6h4v4" />
          </svg>
        </span>
        <div>
          <div className="logo-name text-xl">Sales<b>Game</b></div>
          <p className="text-[var(--ink-faint)] text-xs mono">Entraînement vente &amp; closing</p>
        </div>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="eyebrow">Mot de passe</span>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field text-lg tracking-widest"
          placeholder="••••"
        />
      </label>
      {error && <p className="text-[var(--bad)] text-sm font-semibold">{error}</p>}
      <button type="submit" disabled={loading || !password} className="btn-arcade w-full">
        {loading ? "…" : "Entrer"}
      </button>
    </form>
  );
}

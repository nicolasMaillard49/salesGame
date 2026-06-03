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
    <form onSubmit={submit} className="w-full max-w-sm card p-8 flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Game</h1>
        <p className="text-[var(--color-muted)] text-sm mt-1">Entraînement vente &amp; closing</p>
      </div>
      <label className="flex flex-col gap-2 text-sm">
        <span className="text-[var(--color-muted)]">Mot de passe</span>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 outline-none focus:border-[var(--color-violet)] transition"
          placeholder="••••"
        />
      </label>
      {error && <p className="text-[var(--color-bad)] text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="btn-primary rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
      >
        {loading ? "…" : "Entrer"}
      </button>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Fiche } from "@/lib/content/schema";

const CATS: { key: Fiche["category"] | "all"; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "ouverture", label: "Ouverture" },
  { key: "decouverte", label: "Découverte" },
  { key: "closing", label: "Closing" },
  { key: "objection", label: "Objections" },
  { key: "phase", label: "Phases" },
  { key: "mindset", label: "Mindset" },
];

export default function FichesBrowser({ fiches }: { fiches: Fiche[] }) {
  const [cat, setCat] = useState<Fiche["category"] | "all">("all");
  const present = useMemo(() => new Set(fiches.map((f) => f.category)), [fiches]);
  const list = cat === "all" ? fiches : fiches.filter((f) => f.category === cat);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="display text-2xl">Bibliothèque</h1>
        <p className="text-[var(--ink-soft)] text-sm mt-1">{fiches.length} fiches pour réviser scripts, techniques et objections.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATS.filter((c) => c.key === "all" || present.has(c.key as Fiche["category"])).map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`mono text-[12px] px-3.5 py-2 rounded-full border transition ${
              cat === c.key
                ? "bg-[var(--green-deep)] text-white border-transparent"
                : "bg-[rgba(255,255,255,.5)] border-[var(--glass-line)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((f) => (
          <article key={f.id} className="glass p-5 flex flex-col gap-3">
            <div>
              <span className="eyebrow">{f.category}</span>
              <h2 className="display text-lg mt-1.5 leading-snug">{f.title}</h2>
              <p className="text-[var(--ink-soft)] text-[13.5px] mt-1">{f.summary}</p>
            </div>
            <ul className="flex flex-col gap-1.5">
              {f.points.map((p, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-[var(--green-deep)] mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--green-deep)]" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            {f.example && (
              <p className="mono text-[13px] text-[var(--green-ink)] bg-[var(--good-wash)] border border-[rgba(0,184,107,.2)] rounded-xl px-3 py-2.5 leading-relaxed">
                {f.example}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { Fiche } from "@/lib/content/schema";
import Icon from "@/components/Icon";
import ClosingPlaybook from "./ClosingPlaybook";

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
  const [playbook, setPlaybook] = useState(false);
  const present = useMemo(() => new Set(fiches.map((f) => f.category)), [fiches]);
  const list = cat === "all" ? fiches : fiches.filter((f) => f.category === cat);

  function selectCat(key: Fiche["category"] | "all") {
    setCat(key);
    if (key === "closing") setPlaybook(true); // le closing s'ouvre direct en interactif
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="display text-2xl">Bibliothèque</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">{fiches.length} fiches pour réviser scripts, techniques et objections.</p>
        </div>
        <button
          onClick={() => setPlaybook((v) => !v)}
          className="btn btn-primary self-start"
        >
          <Icon name="target" size={16} strokeWidth={2.4} />
          {playbook ? "Masquer le closing interactif" : "Closing interactif"}
        </button>
      </div>

      {playbook && <ClosingPlaybook />}

      <div className="flex flex-wrap gap-2">
        {CATS.filter((c) => c.key === "all" || present.has(c.key as Fiche["category"])).map((c) => (
          <button
            key={c.key}
            onClick={() => selectCat(c.key)}
            className={`mono text-[12px] px-3.5 py-2 rounded-full border transition ${
              cat === c.key
                ? "bg-[var(--green-deep)] text-white border-transparent"
                : "bg-[var(--glass)] border-[var(--glass-line)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
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
            {(f.examples?.length || f.example) && (
              <div className="flex flex-col gap-1.5 mt-auto">
                <span className="mono text-[9px] uppercase tracking-[.14em] text-[var(--ink-faint)]">À dire</span>
                {(f.examples ?? (f.example ? [f.example] : [])).map((ex, i) => (
                  <p key={i} className="mono text-[12.5px] text-[var(--ink)] bg-[var(--good-wash)] border border-[rgba(0,184,107,.25)] rounded-xl px-3 py-2 leading-relaxed">
                    {ex}
                  </p>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

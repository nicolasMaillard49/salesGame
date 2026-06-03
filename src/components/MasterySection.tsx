"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

function trainHref(skill: string): string {
  return skill.startsWith("obj_") ? `/drill?skill=${skill}` : `/quiz?skill=${skill}`;
}

export type MasteryRow = { skill: string; label: string; score: number; attempts: number; weak: boolean };

const C = 2 * Math.PI * 19; // circonférence mini-ring (r=19)

function color(score: number) {
  return score >= 0.7 ? "var(--green-deep)" : score >= 0.5 ? "var(--ok)" : "var(--bad)";
}

function MiniRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="mini-ring">
      <svg width="46" height="46" viewBox="0 0 46 46" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="23" cy="23" r="19" fill="none" stroke="rgba(7,20,14,.08)" strokeWidth="5" />
        <circle cx="23" cy="23" r="19" fill="none" stroke={color(score)} strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score)} />
      </svg>
      <span style={{ color: color(score) }}>{pct}%</span>
    </div>
  );
}

export default function MasterySection({ rows }: { rows: MasteryRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const attempted = rows.filter((r) => r.attempts > 0);
  const weak = attempted.filter((r) => r.weak).slice(0, 4);
  const global = attempted.length
    ? Math.round((attempted.reduce((s, r) => s + r.score, 0) / attempted.length) * 100)
    : 0;

  if (attempted.length === 0) {
    return (
      <section className="glass p-6 reveal" style={{ animationDelay: "0.24s" }}>
        <h2 className="display text-lg mb-2">Maîtrise</h2>
        <p className="text-sm text-[var(--ink-soft)]">Joue une partie pour révéler tes points forts et faibles.</p>
      </section>
    );
  }

  return (
    <section className="glass p-6 reveal" style={{ animationDelay: "0.24s" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="display text-lg">{weak.length ? "À travailler en priorité" : "Maîtrise"}</h2>
        <button onClick={() => setShowAll((s) => !s)} className="mono text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] inline-flex items-center gap-1.5 transition">
          {showAll ? "Réduire" : "Toutes les compétences"}
          <Icon name="chevronRight" size={14} style={{ transform: showAll ? "rotate(90deg)" : "none" }} />
        </button>
      </div>

      {!showAll ? (
        weak.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {weak.map((r) => (
              <Link key={r.skill} href={trainHref(r.skill)} className="weak-cell hover:border-[var(--green)] transition group">
                <MiniRing score={r.score} />
                <div className="flex-1">
                  <div className="font-semibold text-sm">{r.label}</div>
                  <div className="mono text-[10.5px] uppercase tracking-wide text-[var(--bad)] mt-0.5">point faible</div>
                </div>
                <span className="mono text-[11px] text-[var(--ink-faint)] group-hover:text-[var(--green-deep)] flex items-center gap-1 transition">
                  S&apos;entraîner <Icon name="arrowRight" size={13} strokeWidth={2.5} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">Aucun point faible — du solide.</p>
        )
      ) : (
        <div className="flex flex-col">
          {attempted.map((r, idx) => (
            <div key={r.skill} className={`flex items-center gap-3 py-3 ${idx ? "border-t border-[var(--glass-edge)]" : ""}`}>
              <span className="flex-1 text-sm font-medium">{r.label}</span>
              <div className="w-40 h-2 rounded-full bg-[rgba(7,20,14,.08)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.round(r.score * 100)}%`, background: color(r.score) }} />
              </div>
              <span className="mono text-xs font-bold w-9 text-right" style={{ color: color(r.score) }}>{Math.round(r.score * 100)}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[var(--glass-edge)] flex items-center justify-between text-sm text-[var(--ink-soft)]">
        <span>Maîtrise globale</span>
        <span className="mono font-bold text-[var(--green-deep)]">{global}%</span>
      </div>
    </section>
  );
}

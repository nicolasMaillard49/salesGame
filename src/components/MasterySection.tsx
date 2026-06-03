"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";

export type MasteryRow = {
  skill: string;
  label: string;
  score: number; // score affiché (après décroissance)
  attempts: number;
  weak: boolean;
  rusty: boolean;
  level: { name: string; color: string } | null;
  trend: "up" | "down" | "flat" | null;
};

function trainHref(skill: string): string {
  return skill.startsWith("obj_") ? `/drill?skill=${skill}` : `/quiz?skill=${skill}`;
}
function color(score: number) {
  return score >= 0.7 ? "var(--green-deep)" : score >= 0.5 ? "var(--ok)" : "var(--bad)";
}
const C = 2 * Math.PI * 19;

function MiniRing({ score }: { score: number }) {
  return (
    <div className="mini-ring">
      <svg width="46" height="46" viewBox="0 0 46 46" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="23" cy="23" r="19" fill="none" stroke="rgba(127,134,123,.18)" strokeWidth="5" />
        <circle cx="23" cy="23" r="19" fill="none" stroke={color(score)} strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score)} />
      </svg>
      <span style={{ color: color(score) }}>{Math.round(score * 100)}%</span>
    </div>
  );
}

function Trend({ t }: { t: MasteryRow["trend"] }) {
  if (!t || t === "flat") return null;
  return <span className="mono text-[12px]" style={{ color: t === "up" ? "var(--good)" : "var(--bad)" }}>{t === "up" ? "↗" : "↘"}</span>;
}

function LevelBadge({ level }: { level: MasteryRow["level"] }) {
  if (!level) return null;
  return (
    <span className="mono text-[9.5px] uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ color: level.color, background: `${level.color}22`, border: `1px solid ${level.color}55` }}>
      {level.name}
    </span>
  );
}

export default function MasterySection({ rows }: { rows: MasteryRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const attempted = rows.filter((r) => r.attempts > 0);
  const weakCount = attempted.filter((r) => r.weak).length;
  const global = attempted.length ? Math.round((attempted.reduce((s, r) => s + r.score, 0) / attempted.length) * 100) : 0;

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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="display text-lg">{weakCount ? "À travailler en priorité" : "Ta maîtrise"}</h2>
        <div className="flex items-center gap-4">
          <Link href="/ma-fiche" className="mono text-xs text-[var(--green-deep)] hover:opacity-80 inline-flex items-center gap-1.5 transition">
            <Icon name="book" size={14} /> Ma fiche
          </Link>
          <button onClick={() => setShowAll((s) => !s)} className="mono text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] inline-flex items-center gap-1.5 transition">
            {showAll ? "Réduire" : "Toutes les compétences"}
            <Icon name="chevronRight" size={14} style={{ transform: showAll ? "rotate(90deg)" : "none" }} />
          </button>
        </div>
      </div>

      {!showAll ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {attempted.slice(0, 4).map((r) => {
            const hint = r.rusty ? "rouillée" : r.weak ? "point faible" : r.level ? r.level.name : "à consolider";
            const hintColor = r.rusty ? "var(--ok)" : r.weak ? "var(--bad)" : r.level ? r.level.color : "var(--ok)";
            return (
              <Link key={r.skill} href={trainHref(r.skill)} className="weak-cell hover:border-[var(--green)] transition group">
                <MiniRing score={r.score} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-1.5 truncate">{r.label} <Trend t={r.trend} /></div>
                  <div className="mono text-[10.5px] uppercase tracking-wide mt-0.5" style={{ color: hintColor }}>{hint}</div>
                </div>
                <span className="mono text-[11px] text-[var(--ink-faint)] group-hover:text-[var(--green-deep)] flex items-center gap-1 transition shrink-0">
                  S&apos;entraîner <Icon name="arrowRight" size={13} strokeWidth={2.5} />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col">
          {attempted.map((r, idx) => (
            <div key={r.skill} className={`flex items-center gap-3 py-3 ${idx ? "border-t border-[var(--glass-edge)]" : ""}`}>
              <span className="flex-1 text-sm font-medium flex items-center gap-2 min-w-0">
                <span className="truncate">{r.label}</span> <Trend t={r.trend} /> <LevelBadge level={r.level} />
                {r.rusty && <span className="mono text-[9.5px] uppercase text-[var(--ok)]">rouillée</span>}
              </span>
              <div className="w-32 h-2 rounded-full bg-[rgba(127,134,123,.18)] overflow-hidden shrink-0">
                <div className="h-full rounded-full" style={{ width: `${Math.round(r.score * 100)}%`, background: color(r.score) }} />
              </div>
              <span className="mono text-xs font-bold w-9 text-right shrink-0" style={{ color: color(r.score) }}>{Math.round(r.score * 100)}%</span>
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

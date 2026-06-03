"use client";

import { useState } from "react";
import Link from "next/link";
import { finishSession, recordAnswer, startSession } from "@/lib/client";
import { SKILL_LABELS, type Quality, type SkillId } from "@/lib/types";

type Card = {
  id: string;
  persona: { metier: string; ville: string; humeur: string; contexte: string };
  difficulty: number;
  phases: number;
  locked: boolean;
};
type SimOption = { text: string; quality: Quality; feedback: string };
type Turn = {
  artisanLine: string;
  options: SimOption[];
  phase: SkillId;
  phaseIndex: number;
  totalPhases: number;
  fallback: boolean;
};
type Line = { role: "artisan" | "commercial"; text: string };

const VERDICT: Record<Quality, { cls: string; label: string }> = {
  good: { cls: "verdict-good", label: "✓ Top" },
  ok: { cls: "verdict-ok", label: "~ Passable" },
  bad: { cls: "verdict-bad", label: "✕ À éviter" },
};
const DIFF_LABEL = ["", "Facile", "Moyen", "Difficile"];

export default function SimGame({ scenarios }: { scenarios: Card[] }) {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [history, setHistory] = useState<Line[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [xp, setXp] = useState(0);
  const [goods, setGoods] = useState(0);
  const [answers, setAnswers] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTurn(id: string, phaseIndex: number, hist: Line[]): Promise<Turn | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: id, phaseIndex, history: hist }),
      });
      if (!res.ok) throw new Error("api");
      return (await res.json()) as Turn;
    } catch {
      setError("L'artisan ne répond pas (réseau/IA). Réessaie.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function start(card: Card) {
    if (card.locked) return;
    setScenarioId(card.id);
    const sid = await startSession("sim", card.id);
    setSessionId(sid);
    const t = await fetchTurn(card.id, 0, []);
    if (t) {
      setTurn(t);
      setHistory([{ role: "artisan", text: t.artisanLine }]);
    }
  }

  async function pick(idx: number, opt: SimOption) {
    if (revealed || !turn) return;
    setPicked(idx);
    setRevealed(true);
    setAnswers((a) => a + 1);
    if (opt.quality === "good") setGoods((g) => g + 1);
    if (sessionId) {
      const r = await recordAnswer({
        sessionId,
        skill: turn.phase,
        quality: opt.quality,
        itemRef: `${scenarioId}:${turn.phase}`,
        chosen: opt.text,
      });
      if (r) setXp((x) => x + r.xpGained);
    }
  }

  async function next() {
    if (!turn || !scenarioId) return;
    const chosen = turn.options[picked ?? 0];
    const newHistory: Line[] = [...history, { role: "commercial", text: chosen.text }];
    const nextIndex = turn.phaseIndex + 1;

    if (nextIndex >= turn.totalPhases) {
      if (sessionId) finishSession(sessionId, goods, xp);
      setHistory(newHistory);
      setDone(true);
      return;
    }
    const t = await fetchTurn(scenarioId, nextIndex, newHistory);
    if (t) {
      setTurn(t);
      setPicked(null);
      setRevealed(false);
      setHistory([...newHistory, { role: "artisan", text: t.artisanLine }]);
    }
  }

  // --- Sélection ---
  if (!scenarioId) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="display text-2xl">Simulateur d&apos;appel</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">
            Mène l&apos;appel du brise-glace au close. À chaque phase, choisis ta réplique.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {scenarios.map((s) => (
            <button
              key={s.id}
              disabled={s.locked}
              onClick={() => start(s)}
              className={`game-card ${s.locked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span className="flex items-center justify-between w-full">
                <span className="count-pill">{DIFF_LABEL[s.difficulty]}</span>
                {s.locked && <span aria-hidden="true">🔒</span>}
              </span>
              <h2 className="display text-lg mt-4 capitalize">{s.persona.metier}</h2>
              <p className="text-sm text-[var(--ink-soft)]">{s.persona.ville}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-2">{s.persona.contexte}</p>
              {s.locked && <p className="text-xs text-[#92590a] mt-2">Gagne de l&apos;XP pour débloquer</p>}
            </button>
          ))}
        </div>
        <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]">← Hub</Link>
      </div>
    );
  }

  // --- Fin ---
  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <div className="card p-10 text-center flex flex-col items-center gap-3">
          <h1 className="display text-2xl">Appel terminé</h1>
          <p className="display text-6xl text-[var(--green-deep)]">{goods}<span className="text-[var(--ink-faint)] text-3xl">/{answers}</span></p>
          <p className="mono text-[var(--ink-soft)]">répliques optimales · +{xp} XP</p>
          <div className="flex gap-3 mt-2">
            <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] px-4 py-3">← Hub</Link>
            <button onClick={() => window.location.reload()} className="btn-arcade">Nouvel appel</button>
          </div>
        </div>
        <Transcript history={history} />
      </div>
    );
  }

  // --- Jeu ---
  return (
    <div className="flex flex-col gap-5">
      {turn && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="shield-chip"><span aria-hidden="true">📞</span> {SKILL_LABELS[turn.phase]}</span>
            <span className="counter-label">Phase <b>{turn.phaseIndex + 1}</b>/{turn.totalPhases}</span>
          </div>
          <span className="score-chip">
            🎯 {goods}/{answers} <span className="text-[#9bd9b3]">·</span> <span className="text-[var(--green-deep)]">{xp} XP</span>
            {turn.fallback && <span className="text-[var(--ink-faint)] text-[11px]">démo</span>}
          </span>
        </div>
      )}

      <Transcript history={history} />

      {error && (
        <div className="card p-4 text-sm text-[var(--bad)] flex items-center justify-between gap-3">
          {error}
          <button
            onClick={() => scenarioId && turn && fetchTurn(scenarioId, turn.phaseIndex, history).then((t) => t && setTurn(t))}
            className="btn-arcade"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading && <p className="mono text-sm text-[var(--ink-faint)] animate-pulse">L&apos;artisan réfléchit…</p>}

      {turn && !loading && (
        <>
          <p className="mono text-xs uppercase tracking-wide text-[var(--ink-faint)]">Ta réplique</p>
          <div className="flex flex-col gap-3">
            {turn.options.map((opt, idx) => {
              const isPicked = idx === picked;
              let state = "";
              if (revealed) state = opt.quality === "good" ? "opt-good" : isPicked ? "opt-bad" : "opt-dim";
              return (
                <button key={idx} disabled={revealed} onClick={() => pick(idx, opt)} className={`opt ${state}`}>
                  <span className="text-[15px] font-medium leading-snug">{opt.text}</span>
                  {revealed && (
                    <span className="flex gap-2 items-start mt-3 pt-3 border-t border-dashed border-[var(--line-strong)] text-[13.5px]">
                      <span className={`verdict ${VERDICT[opt.quality].cls} shrink-0`}>{VERDICT[opt.quality].label}</span>
                      <span className="text-[var(--ink-soft)]">{opt.feedback}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {revealed && (
            <button onClick={next} className="btn-arcade self-start mt-2">
              {turn.phaseIndex + 1 >= turn.totalPhases ? "Terminer l'appel" : "Phase suivante →"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Transcript({ history }: { history: Line[] }) {
  if (history.length === 0) return null;
  return (
    <div className="card p-5 flex flex-col gap-3">
      {history.map((l, i) => (
        <div key={i} className={`flex ${l.role === "commercial" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${
              l.role === "commercial"
                ? "bg-[var(--green-deep)] text-white rounded-br-sm"
                : "bg-[var(--bg)] border border-[var(--line)] rounded-bl-sm"
            }`}
          >
            <span className="block mono text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
              {l.role === "commercial" ? "Toi" : "Artisan"}
            </span>
            {l.text}
          </div>
        </div>
      ))}
    </div>
  );
}

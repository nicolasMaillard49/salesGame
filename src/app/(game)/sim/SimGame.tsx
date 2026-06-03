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

const QUALITY_COLOR: Record<Quality, string> = {
  good: "var(--color-good)",
  ok: "var(--color-ok)",
  bad: "var(--color-bad)",
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
      setError("L’artisan ne répond pas (réseau/IA). Réessaie.");
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

  // --- Écran de sélection ---
  if (!scenarioId) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold">Simulateur d’appel</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">
            Mène l’appel du brise-glace au close. À chaque phase, choisis ta réplique.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {scenarios.map((s) => (
            <button
              key={s.id}
              disabled={s.locked}
              onClick={() => start(s)}
              className={`card p-5 text-left transition ${
                s.locked ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--color-violet)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-muted)]">
                  {DIFF_LABEL[s.difficulty]}
                </span>
                {s.locked && <span className="text-xs text-[var(--color-muted)]">🔒</span>}
              </div>
              <h2 className="mt-3 font-semibold capitalize">{s.persona.metier}</h2>
              <p className="text-sm text-[var(--color-muted)]">{s.persona.ville}</p>
              <p className="text-xs text-[var(--color-muted)] mt-2">{s.persona.contexte}</p>
              {s.locked && (
                <p className="text-xs text-[var(--color-ok)] mt-2">Gagne de l’XP pour débloquer</p>
              )}
            </button>
          ))}
        </div>
        <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">← Hub</Link>
      </div>
    );
  }

  // --- Écran de fin ---
  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <div className="card p-8 text-center flex flex-col items-center gap-3">
          <h1 className="text-2xl font-bold">Appel terminé</h1>
          <p className="text-5xl font-bold text-[var(--color-violet-bright)]">{goods}/{answers}</p>
          <p className="text-[var(--color-muted)]">répliques optimales · +{xp} XP</p>
          <div className="flex gap-3 mt-2">
            <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] px-4 py-2">← Hub</Link>
            <button onClick={() => window.location.reload()} className="btn-primary rounded-lg px-5 py-2.5 font-semibold">
              Nouvel appel
            </button>
          </div>
        </div>
        <Transcript history={history} />
      </div>
    );
  }

  // --- Écran de jeu ---
  return (
    <div className="flex flex-col gap-5">
      {turn && (
        <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
          <span>Phase {turn.phaseIndex + 1}/{turn.totalPhases} · {SKILL_LABELS[turn.phase]}</span>
          <span>{goods}/{answers} · {xp} XP {turn.fallback && "· (mode démo)"}</span>
        </div>
      )}

      <Transcript history={history} />

      {error && (
        <div className="card p-4 text-sm text-[var(--color-bad)] flex items-center justify-between">
          {error}
          <button
            onClick={() => scenarioId && turn && fetchTurn(scenarioId, turn.phaseIndex, history).then((t) => t && setTurn(t))}
            className="btn-primary rounded px-3 py-1.5"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-[var(--color-muted)] animate-pulse">L’artisan réfléchit…</p>}

      {turn && !loading && (
        <div className="card p-6">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-3">Ta réplique</p>
          <div className="flex flex-col gap-2.5">
            {turn.options.map((opt, idx) => {
              const isPicked = idx === picked;
              let cls = "border-[var(--color-border)] hover:border-[var(--color-violet)]";
              if (revealed) {
                if (opt.quality === "good")
                  cls = "border-[var(--color-good)] bg-[color-mix(in_srgb,var(--color-good)_12%,transparent)]";
                else if (isPicked)
                  cls = "border-[var(--color-bad)] bg-[color-mix(in_srgb,var(--color-bad)_12%,transparent)]";
                else cls = "border-[var(--color-border)] opacity-60";
              }
              return (
                <button
                  key={idx}
                  disabled={revealed}
                  onClick={() => pick(idx, opt)}
                  className={`text-left rounded-lg border px-4 py-3 transition ${cls}`}
                >
                  {opt.text}
                  {revealed && (
                    <span className="block text-xs mt-1.5" style={{ color: QUALITY_COLOR[opt.quality] }}>
                      {opt.feedback}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {revealed && (
            <button onClick={next} className="btn-primary rounded-lg px-5 py-2.5 font-semibold mt-5">
              {turn.phaseIndex + 1 >= turn.totalPhases ? "Terminer l’appel" : "Phase suivante"}
            </button>
          )}
        </div>
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
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              l.role === "commercial"
                ? "bg-[var(--color-violet-dim)] text-white rounded-br-sm"
                : "bg-[var(--color-surface-2)] rounded-bl-sm"
            }`}
          >
            <span className="block text-[10px] uppercase tracking-wide opacity-60 mb-0.5">
              {l.role === "commercial" ? "Toi" : "Artisan"}
            </span>
            {l.text}
          </div>
        </div>
      ))}
    </div>
  );
}

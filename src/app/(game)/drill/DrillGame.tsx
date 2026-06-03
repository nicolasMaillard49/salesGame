"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Objection, ObjectionOption } from "@/lib/content/schema";
import { finishSession, recordAnswer, shuffle, startSession } from "@/lib/client";
import { SKILL_LABELS } from "@/lib/types";

const TIME_S = 15;
const STATE_CLASS: Record<ObjectionOption["quality"], string> = {
  good: "opt-good",
  ok: "opt-ok",
  bad: "opt-bad",
};
const VERDICT: Record<ObjectionOption["quality"], { cls: string; label: string }> = {
  good: { cls: "verdict-good", label: "✓ Correct" },
  ok: { cls: "verdict-ok", label: "~ Passable" },
  bad: { cls: "verdict-bad", label: "✕ À éviter" },
};

export default function DrillGame({ items }: { items: Objection[] }) {
  // ordre tiré au montage (client) → pas de mismatch d'hydratation.
  const [round, setRound] = useState<Objection[] | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [options, setOptions] = useState<ObjectionOption[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [time, setTime] = useState(TIME_S);
  const [done, setDone] = useState(false);
  const startedAt = useRef(0);

  const obj = round ? round[i] : undefined;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(shuffle(items));
    startSession("drill").then(setSessionId);
  }, [items]);

  // (ré)initialise chaque manche quand l'objection change.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!obj) return;
    setOptions(shuffle(obj.options));
    setPicked(null);
    setRevealed(false);
    setTime(TIME_S);
    startedAt.current = performance.now();
  }, [obj]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const reveal = useCallback(
    async (idx: number | null, opt: ObjectionOption | null) => {
      if (!obj) return;
      setRevealed(true);
      setPicked(idx);
      const quality = opt?.quality ?? "bad";
      if (quality === "good") setScore((s) => s + 1);
      if (sessionId) {
        const r = await recordAnswer({
          sessionId,
          skill: obj.id,
          quality,
          itemRef: obj.id,
          difficulty: obj.difficulty,
          chosen: opt?.text,
          timeMs: Math.round(performance.now() - startedAt.current),
        });
        if (r) setXp((x) => x + r.xpGained);
      }
    },
    [obj, sessionId]
  );

  useEffect(() => {
    if (revealed || done || !obj) return;
    if (time <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      reveal(null, null);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, revealed, done, obj, reveal]);

  function next() {
    if (!round) return;
    if (i + 1 >= round.length) {
      if (sessionId) finishSession(sessionId, score, xp);
      setDone(true);
    } else {
      setI((n) => n + 1);
    }
  }

  if (!round) return <p className="mono text-[var(--ink-faint)] animate-pulse">Chargement…</p>;

  if (done) {
    return (
      <div className="card p-10 text-center flex flex-col items-center gap-4">
        <h1 className="display text-2xl">Drill terminé</h1>
        <p className="display text-6xl text-[var(--green-deep)]">{score}<span className="text-[var(--ink-faint)] text-3xl">/{round.length}</span></p>
        <p className="mono text-[var(--ink-soft)]">+{xp} XP</p>
        <div className="flex gap-3 mt-2">
          <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] px-4 py-3">← Hub</Link>
          <button onClick={() => window.location.reload()} className="btn-arcade">Rejouer</button>
        </div>
      </div>
    );
  }

  if (!obj) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="shield-chip"><span aria-hidden="true">🛡️</span> Drill</span>
          <span className="counter-label">Objection <b>{i + 1}</b>/{round.length}</span>
        </div>
        <span className="score-chip">🎯 {score} <span className="text-[#9bd9b3]">·</span> <span className="text-[var(--green-deep)]">{xp} XP</span></span>
      </div>

      <div>
        <div className="flex justify-between mono text-[11.5px] uppercase tracking-wide text-[var(--ink-faint)] mb-1.5">
          <span>Temps restant</span>
          <span>{time} s</span>
        </div>
        <div className="timer-bar">
          <div className="timer-fill" style={{ width: `${(time / TIME_S) * 100}%` }} />
        </div>
      </div>

      <div className="flex items-start gap-4 mt-2">
        <span className="face" aria-hidden="true">👷</span>
        <div className="bubble flex-1">
          <span className="block mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)] mb-1">
            Artisan — {SKILL_LABELS[obj.id]}
          </span>
          <q className="bubble-q">{obj.artisanLine}</q>
        </div>
      </div>

      <p className="mono text-xs uppercase tracking-wide text-[var(--ink-faint)] mt-2">Choisis ta meilleure réponse</p>

      <div className="flex flex-col gap-3">
        {options.map((opt, idx) => {
          const isPicked = idx === picked;
          let state = "";
          if (revealed) state = opt.quality === "good" ? "opt-good" : isPicked ? "opt-bad" : `${STATE_CLASS[opt.quality]} opt-dim`;
          return (
            <button key={idx} disabled={revealed} onClick={() => reveal(idx, opt)} className={`opt ${state}`}>
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
          {i + 1 >= round.length ? "Voir le résultat" : "Objection suivante →"}
        </button>
      )}
    </div>
  );
}

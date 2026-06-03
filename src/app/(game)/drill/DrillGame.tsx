"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Objection, ObjectionOption } from "@/lib/content/schema";
import { finishSession, recordAnswer, shuffle, startSession } from "@/lib/client";
import { SKILL_LABELS } from "@/lib/types";
import Icon from "@/components/Icon";

const TIME_S = 15;
const VERDICT: Record<ObjectionOption["quality"], { cls: string; label: string }> = {
  good: { cls: "v-good", label: "Correct" },
  ok: { cls: "v-ok", label: "Passable" },
  bad: { cls: "v-bad", label: "À éviter" },
};

export default function DrillGame({ items }: { items: Objection[] }) {
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
    // sous-ensemble aléatoire (max 12) pour des manches courtes et rejouables
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(shuffle(items).slice(0, Math.min(12, items.length)));
    startSession("drill").then(setSessionId);
  }, [items]);

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
          sessionId, skill: obj.id, quality, itemRef: obj.id,
          difficulty: obj.difficulty, chosen: opt?.text,
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
    } else setI((n) => n + 1);
  }

  if (!round) return <p className="mono text-[var(--ink-faint)] animate-pulse">Chargement…</p>;

  if (done) {
    return (
      <div className="glass p-10 text-center flex flex-col items-center gap-4">
        <span className="mode-ic"><Icon name="trophy" size={24} /></span>
        <h1 className="display text-2xl">Drill terminé</h1>
        <p className="display text-6xl text-[var(--green-deep)]">{score}<span className="text-[var(--ink-faint)] text-3xl">/{round.length}</span></p>
        <p className="mono text-[var(--ink-soft)]">+{xp} XP</p>
        <div className="flex gap-3 mt-2">
          <Link href="/" className="btn btn-glass">← Hub</Link>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Rejouer</button>
        </div>
      </div>
    );
  }

  if (!obj) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="hud-chip"><Icon name="shield" size={15} /> Drill</span>
          <span className="counter-label">Objection <b>{i + 1}</b>/{round.length}</span>
        </div>
        <span className="score-chip"><Icon name="target" size={15} /> {score} · {xp} XP</span>
      </div>

      <div>
        <div className="flex justify-between mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)] mb-1.5">
          <span>Temps restant</span><span>{time}s</span>
        </div>
        <div className="timer-bar"><div className="timer-fill" style={{ width: `${(time / TIME_S) * 100}%` }} /></div>
      </div>

      <div className="flex items-start gap-4 mt-2">
        <span className="face"><Icon name="worker" size={22} /></span>
        <div className="bubble-b">
          <span className="block mono text-[10px] uppercase tracking-[.16em] text-[var(--ink-faint)] mb-1">Artisan — {SKILL_LABELS[obj.id]}</span>
          <q className="bubble-q">{obj.artisanLine}</q>
        </div>
      </div>

      <p className="mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)] mt-2">Choisis ta meilleure réponse</p>

      <div className="flex flex-col gap-3">
        {options.map((opt, idx) => {
          const isPicked = idx === picked;
          let state = "";
          if (revealed) state = opt.quality === "good" ? "good" : isPicked ? "bad" : "dim";
          return (
            <button key={idx} disabled={revealed} onClick={() => reveal(idx, opt)} className={`opt-b ${state}`}>
              <span className="opt-key">{String.fromCharCode(65 + idx)}</span>
              <span className="txt">{opt.text}</span>
              {revealed && (
                <span className="fb">
                  <span className={`verdict ${VERDICT[opt.quality].cls}`}>{VERDICT[opt.quality].label}</span>
                  <span>{opt.feedback}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {revealed && (
        <button onClick={next} className="btn-arcade self-start mt-2">
          {i + 1 >= round.length ? "Voir le résultat" : "Objection suivante"}
          <Icon name="arrowRight" size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

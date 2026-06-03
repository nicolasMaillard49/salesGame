"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Objection, ObjectionOption } from "@/lib/content/schema";
import { finishSession, recordAnswer, shuffle, startSession } from "@/lib/client";
import { SKILL_LABELS } from "@/lib/types";

const TIME_S = 15;
const QUALITY_COLOR: Record<ObjectionOption["quality"], string> = {
  good: "var(--color-good)",
  ok: "var(--color-ok)",
  bad: "var(--color-bad)",
};

export default function DrillGame({ items }: { items: Objection[] }) {
  const round = useMemo(() => shuffle(items), [items]);
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

  const obj = round[i];

  useEffect(() => {
    startSession("drill").then(setSessionId);
  }, []);

  // (ré)initialise chaque manche quand l'objection change (reset volontaire d'état dérivé).
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
      setRevealed(true);
      setPicked(idx);
      const quality = opt?.quality ?? "bad"; // timeout = bad
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

  // chrono : décrémente chaque seconde, révèle (timeout = mauvaise réponse) à 0.
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
    if (i + 1 >= round.length) {
      if (sessionId) finishSession(sessionId, score, xp);
      setDone(true);
    } else {
      setI((n) => n + 1);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Drill terminé</h1>
        <p className="text-5xl font-bold text-[var(--color-violet-bright)]">{score}/{round.length}</p>
        <p className="text-[var(--color-muted)]">+{xp} XP</p>
        <div className="flex gap-3 mt-2">
          <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] px-4 py-2">← Hub</Link>
          <button onClick={() => window.location.reload()} className="btn-primary rounded-lg px-5 py-2.5 font-semibold">Rejouer</button>
        </div>
      </div>
    );
  }

  if (!obj) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
        <span>Objection {i + 1}/{round.length} · {SKILL_LABELS[obj.id]}</span>
        <span>Score {score} · {xp} XP</span>
      </div>

      {/* chrono */}
      <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${(time / TIME_S) * 100}%`,
            background: time <= 5 ? "var(--color-bad)" : "var(--color-violet)",
          }}
        />
      </div>

      <div className="card p-6">
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">L’artisan</p>
        <p className="text-lg font-semibold mt-1 leading-snug">« {obj.artisanLine} »</p>

        <div className="mt-5 flex flex-col gap-2.5">
          {options.map((opt, idx) => {
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
                onClick={() => reveal(idx, opt)}
                className={`text-left rounded-lg border px-4 py-3 transition ${cls}`}
              >
                {opt.text}
                {revealed && (
                  <span
                    className="block text-xs mt-1.5"
                    style={{ color: QUALITY_COLOR[opt.quality] }}
                  >
                    {opt.feedback}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {revealed && (
          <button onClick={next} className="btn-primary rounded-lg px-5 py-2.5 font-semibold mt-5">
            {i + 1 >= round.length ? "Voir le résultat" : "Objection suivante"}
          </button>
        )}
      </div>
    </div>
  );
}

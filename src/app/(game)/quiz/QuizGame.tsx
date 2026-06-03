"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { QuizItem } from "@/lib/content/schema";
import { finishSession, recordAnswer, shuffle, startSession } from "@/lib/client";

const ROUND = 10;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9€%]+/g, " ")
    .trim();
}

export default function QuizGame({ items }: { items: QuizItem[] }) {
  const round = useMemo(() => shuffle(items).slice(0, Math.min(ROUND, items.length)), [items]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    startSession("quiz").then(setSessionId);
  }, []);
  useEffect(() => {
    startedAt.current = performance.now();
  }, [i]);

  const item = round[i];

  function correctFor(it: QuizItem, sel: number | null, txt: string): boolean {
    if (it.type === "qcm") return sel === Number(it.answer);
    return normalize(txt) === normalize(String(it.answer)) ||
      (normalize(txt).length > 2 && normalize(String(it.answer)).includes(normalize(txt)));
  }

  async function answer(sel: number | null) {
    if (revealed) return;
    const ok = correctFor(item, sel, typed);
    setSelected(sel);
    setWasCorrect(ok);
    setRevealed(true);
    if (ok) setScore((s) => s + 1);
    if (sessionId) {
      const r = await recordAnswer({
        sessionId,
        skill: item.skill,
        quality: ok ? "good" : "bad",
        itemRef: item.id,
        difficulty: item.difficulty,
        // performance.now() : mesure de temps en handler (usage hors render, volontaire)
        // eslint-disable-next-line react-hooks/purity
        timeMs: Math.round(performance.now() - startedAt.current),
      });
      if (r) setXp((x) => x + r.xpGained);
    }
  }

  function next() {
    if (i + 1 >= round.length) {
      if (sessionId) finishSession(sessionId, score, xp);
      setDone(true);
    } else {
      setI((n) => n + 1);
      setSelected(null);
      setTyped("");
      setRevealed(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">Quiz terminé</h1>
        <p className="text-5xl font-bold text-[var(--color-violet-bright)]">
          {score}/{round.length}
        </p>
        <p className="text-[var(--color-muted)]">+{xp} XP</p>
        <div className="flex gap-3 mt-2">
          <Link href="/" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] px-4 py-2">
            ← Hub
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary rounded-lg px-5 py-2.5 font-semibold"
          >
            Rejouer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
        <span>Question {i + 1}/{round.length}</span>
        <span>Score {score} · {xp} XP</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div className="h-full btn-primary" style={{ width: `${(i / round.length) * 100}%` }} />
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold leading-snug">{item.prompt}</h2>

        {item.type === "qcm" ? (
          <div className="mt-5 flex flex-col gap-2.5">
            {(item.options ?? []).map((opt, idx) => {
              const isAnswer = idx === Number(item.answer);
              const isPicked = idx === selected;
              let cls = "border-[var(--color-border)] hover:border-[var(--color-violet)]";
              if (revealed && isAnswer) cls = "border-[var(--color-good)] bg-[color-mix(in_srgb,var(--color-good)_12%,transparent)]";
              else if (revealed && isPicked) cls = "border-[var(--color-bad)] bg-[color-mix(in_srgb,var(--color-bad)_12%,transparent)]";
              return (
                <button
                  key={idx}
                  disabled={revealed}
                  onClick={() => answer(idx)}
                  className={`text-left rounded-lg border px-4 py-3 transition ${cls}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <form
            className="mt-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              answer(null);
            }}
          >
            <input
              autoFocus
              disabled={revealed}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Ta réponse…"
              className="flex-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] px-4 py-3 outline-none focus:border-[var(--color-violet)]"
            />
            {!revealed && (
              <button type="submit" className="btn-primary rounded-lg px-5 font-semibold">
                Valider
              </button>
            )}
          </form>
        )}

        {revealed && (
          <div className="mt-5 border-t border-[var(--color-border)] pt-4">
            <p className={`font-semibold ${wasCorrect ? "text-[var(--color-good)]" : "text-[var(--color-bad)]"}`}>
              {wasCorrect ? "✅ Correct" : "❌ Raté"}
            </p>
            {item.type === "trou" && !wasCorrect && (
              <p className="text-sm mt-1">Réponse attendue : <strong>{String(item.answer)}</strong></p>
            )}
            <p className="text-sm text-[var(--color-muted)] mt-2">{item.explanation}</p>
            <button onClick={next} className="btn-primary rounded-lg px-5 py-2.5 font-semibold mt-4">
              {i + 1 >= round.length ? "Voir le résultat" : "Suivant"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

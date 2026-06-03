"use client";

import { useEffect, useRef, useState } from "react";
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
  // round tiré au montage (client uniquement) → évite tout mismatch d'hydratation.
  const [round, setRound] = useState<QuizItem[] | null>(null);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(shuffle(items).slice(0, Math.min(ROUND, items.length)));
    startSession("quiz").then(setSessionId);
  }, [items]);
  useEffect(() => {
    startedAt.current = performance.now();
  }, [i]);

  function correctFor(it: QuizItem, sel: number | null, txt: string): boolean {
    if (it.type === "qcm") return sel === Number(it.answer);
    return (
      normalize(txt) === normalize(String(it.answer)) ||
      (normalize(txt).length > 2 && normalize(String(it.answer)).includes(normalize(txt)))
    );
  }

  async function answer(sel: number | null) {
    if (revealed || !round) return;
    const item = round[i];
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
        // eslint-disable-next-line react-hooks/purity
        timeMs: Math.round(performance.now() - startedAt.current),
      });
      if (r) setXp((x) => x + r.xpGained);
    }
  }

  function next() {
    if (!round) return;
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

  if (!round) return <p className="mono text-[var(--ink-faint)] animate-pulse">Chargement…</p>;
  if (done) return <EndScreen label="Quiz terminé" score={score} total={round.length} xp={xp} />;

  const item = round[i];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="counter-label">Question <b>{i + 1}</b>/{round.length}</span>
        <span className="score-chip">🎯 {score} <span className="text-[#9bd9b3]">·</span> <span className="text-[var(--green-deep)]">{xp} XP</span></span>
      </div>
      <div className="timer-bar">
        <div className="timer-fill !bg-[var(--green)]" style={{ width: `${(i / round.length) * 100}%` }} />
      </div>

      <div className="card p-6">
        <h2 className="display text-xl leading-snug">{item.prompt}</h2>

        {item.type === "qcm" ? (
          <div className="mt-6 flex flex-col gap-3">
            {(item.options ?? []).map((opt, idx) => {
              const isAnswer = idx === Number(item.answer);
              const isPicked = idx === selected;
              let state = "";
              if (revealed) {
                if (isAnswer) state = "opt-good";
                else if (isPicked) state = "opt-bad";
                else state = "opt-dim";
              }
              return (
                <button key={idx} disabled={revealed} onClick={() => answer(idx)} className={`opt ${state}`}>
                  <span className="text-[15px] font-medium leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); answer(null); }}>
            <input
              autoFocus
              disabled={revealed}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Ta réponse…"
              className="field flex-1"
            />
            {!revealed && <button type="submit" className="btn-arcade">Valider</button>}
          </form>
        )}

        {revealed && (
          <div className="mt-6 border-t border-[var(--line)] pt-4 flex flex-col gap-3">
            <span className={`verdict ${wasCorrect ? "verdict-good" : "verdict-bad"} self-start`}>
              {wasCorrect ? "✓ Correct" : "✕ Raté"}
            </span>
            {item.type === "trou" && !wasCorrect && (
              <p className="text-sm">Réponse attendue : <strong>{String(item.answer)}</strong></p>
            )}
            <p className="text-sm text-[var(--ink-soft)]">{item.explanation}</p>
            <button onClick={next} className="btn-arcade self-start mt-1">
              {i + 1 >= round.length ? "Voir le résultat" : "Suivant"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EndScreen({ label, score, total, xp }: { label: string; score: number; total: number; xp: number }) {
  return (
    <div className="card p-10 text-center flex flex-col items-center gap-4">
      <h1 className="display text-2xl">{label}</h1>
      <p className="display text-6xl text-[var(--green-deep)]">{score}<span className="text-[var(--ink-faint)] text-3xl">/{total}</span></p>
      <p className="mono text-[var(--ink-soft)]">+{xp} XP</p>
      <div className="flex gap-3 mt-2">
        <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] px-4 py-3">← Hub</Link>
        <button onClick={() => window.location.reload()} className="btn-arcade">Rejouer</button>
      </div>
    </div>
  );
}

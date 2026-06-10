"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { QuizItem } from "@/lib/content/schema";
import { finishSession, recordAnswer, shuffle, startSession, voiceCheckAnswer, voiceMatchOption } from "@/lib/client";
import { useVoicePref } from "@/lib/voice";
import { VoiceAnswer, VoiceModeToggle } from "@/components/VoiceAnswer";
import Icon from "@/components/Icon";

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
  const [voiceMode, setVoiceMode] = useVoicePref();
  const [started, setStarted] = useState(false);
  const [voiceScoring, setVoiceScoring] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);
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

  async function reveal(sel: number | null, ok: boolean) {
    if (revealed || !round) return;
    const item = round[i];
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

  function answer(sel: number | null) {
    if (revealed || !round) return;
    reveal(sel, correctFor(round[i], sel, typed));
  }

  // Mode vocal — QCM : on matche la réponse dite à la bonne option (tolérant).
  async function submitVoiceQcm(spoken: string) {
    if (revealed || !round) return;
    const item = round[i];
    setVoiceErr(null);
    setVoiceScoring(true);
    const idx = await voiceMatchOption({ prompt: item.prompt, spoken, options: item.options ?? [] });
    setVoiceScoring(false);
    if (idx === null) { setVoiceErr("Évaluation IA indisponible — réessaie."); return; }
    reveal(idx, idx === Number(item.answer));
  }

  // Mode vocal — trou : vrai/faux tolérant (même sens que la réponse attendue).
  async function submitVoiceTrou(spoken: string) {
    if (revealed || !round) return;
    const item = round[i];
    setTyped(spoken);
    setVoiceErr(null);
    setVoiceScoring(true);
    const ok = await voiceCheckAnswer({ prompt: item.prompt, spoken, expected: String(item.answer) });
    setVoiceScoring(false);
    if (ok === null) { setVoiceErr("Évaluation IA indisponible — réessaie."); return; }
    reveal(null, ok === true);
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

  if (!started) {
    return (
      <div className="flex flex-col gap-5 max-w-xl">
        <div>
          <h1 className="display text-2xl">Quiz</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">
            {round.length} questions. {voiceMode ? "Réponds à l'oral — même sens = bonne réponse." : "QCM et réponses à compléter."}
          </p>
        </div>
        <div className="glass p-4">
          <VoiceModeToggle on={voiceMode} onChange={setVoiceMode} />
        </div>
        <button onClick={() => setStarted(true)} className="btn btn-primary self-start">
          Commencer <Icon name="arrowRight" size={16} strokeWidth={2.5} />
        </button>
        <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]">← Hub</Link>
      </div>
    );
  }

  if (done) return <EndScreen label="Quiz terminé" score={score} total={round.length} xp={xp} />;

  const item = round[i];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="counter-label">Question <b>{i + 1}</b>/{round.length}</span>
        <span className="score-chip"><Icon name="target" size={15} /> {score} · {xp} XP</span>
      </div>
      <div className="timer-bar"><div className="timer-fill !bg-[var(--green)]" style={{ width: `${(i / round.length) * 100}%` }} /></div>

      <div className="glass p-6">
        <h2 className="display text-xl leading-snug">{item.prompt}</h2>

        {item.type === "qcm" ? (
          voiceMode && !revealed ? (
            <div className="mt-6">
              <VoiceAnswer key={item.id} prompt={item.prompt} hints={item.options ?? []} submitting={voiceScoring} error={voiceErr} onSubmit={submitVoiceQcm} />
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {(item.options ?? []).map((opt, idx) => {
                const isAnswer = idx === Number(item.answer);
                const isPicked = idx === selected;
                let state = "";
                if (revealed) state = isAnswer ? "good" : isPicked ? "bad" : "dim";
                return (
                  <button key={idx} disabled={revealed} onClick={() => answer(idx)} className={`opt-b ${state}`}>
                    <span className="opt-key">{String.fromCharCode(65 + idx)}</span>
                    <span className="txt">{opt}</span>
                  </button>
                );
              })}
            </div>
          )
        ) : voiceMode && !revealed ? (
          <div className="mt-6">
            <VoiceAnswer key={item.id} prompt={item.prompt} submitting={voiceScoring} error={voiceErr} onSubmit={submitVoiceTrou} />
          </div>
        ) : (
          <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); answer(null); }}>
            <input autoFocus disabled={revealed} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Ta réponse…" className="field flex-1" />
            {!revealed && <button type="submit" className="btn-arcade">Valider</button>}
          </form>
        )}

        {revealed && (
          <div className="mt-6 border-t border-[var(--glass-edge)] pt-4 flex flex-col gap-3">
            <span className={`verdict ${wasCorrect ? "v-good" : "v-bad"} self-start`}>{wasCorrect ? "Correct" : "Raté"}</span>
            {item.type === "trou" && !wasCorrect && (<p className="text-sm">Réponse attendue : <strong>{String(item.answer)}</strong></p>)}
            <p className="text-sm text-[var(--ink-soft)]">{item.explanation}</p>
            <button onClick={next} className="btn-arcade self-start mt-1">
              {i + 1 >= round.length ? "Voir le résultat" : "Suivant"}
              <Icon name="arrowRight" size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EndScreen({ label, score, total, xp }: { label: string; score: number; total: number; xp: number }) {
  return (
    <div className="glass p-10 text-center flex flex-col items-center gap-4">
      <span className="mode-ic"><Icon name="trophy" size={24} /></span>
      <h1 className="display text-2xl">{label}</h1>
      <p className="display text-6xl text-[var(--green-deep)]">{score}<span className="text-[var(--ink-faint)] text-3xl">/{total}</span></p>
      <p className="mono text-[var(--ink-soft)]">+{xp} XP</p>
      <div className="flex gap-3 mt-2">
        <Link href="/" className="btn btn-glass">← Hub</Link>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Rejouer</button>
      </div>
    </div>
  );
}

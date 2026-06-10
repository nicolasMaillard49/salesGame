"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Objection, ObjectionOption } from "@/lib/content/schema";
import { finishSession, recordAnswer, shuffle, startSession, voiceMatchOption } from "@/lib/client";
import { useVoicePref } from "@/lib/voice";
import { VoiceAnswer, VoiceModeToggle } from "@/components/VoiceAnswer";
import { SKILL_LABELS } from "@/lib/types";
import Icon from "@/components/Icon";

function worstIdx(opts: ObjectionOption[]): number {
  const b = opts.findIndex((o) => o.quality === "bad");
  return b >= 0 ? b : opts.length - 1;
}

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
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [lastFast, setLastFast] = useState(false);
  const [voiceMode, setVoiceMode] = useVoicePref();
  const [started, setStarted] = useState(false);
  const [voiceScoring, setVoiceScoring] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);
  const startedAt = useRef(0);
  const comboRef = useRef(0);
  const acRef = useRef<AudioContext | null>(null);

  function tone(freq: number, dur = 0.12, type: OscillatorType = "sine") {
    try {
      acRef.current ??= new AudioContext();
      const ac = acRef.current;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.16, ac.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + dur);
    } catch {}
  }

  const obj = round ? round[i] : undefined;

  useEffect(() => {
    // sous-ensemble aléatoire (max 12) pour des manches courtes et rejouables
    const base = shuffle(items).slice(0, Math.min(12, items.length));
    // éviter deux items consécutifs de même id (swap avec le suivant si possible)
    for (let k = 0; k < base.length - 1; k++) {
      if (base[k].id === base[k + 1].id) {
        const swapIdx = base.findIndex((x, j) => j > k + 1 && x.id !== base[k].id);
        if (swapIdx !== -1) { [base[k + 1], base[swapIdx]] = [base[swapIdx], base[k + 1]]; }
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRound(base);
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
      const elapsedMs = Math.round(performance.now() - startedAt.current);
      const fast = quality === "good" && elapsedMs < 5000;
      setLastFast(fast);
      if (quality === "good") {
        setScore((s) => s + 1);
        const n = comboRef.current + 1;
        comboRef.current = n;
        setCombo(n);
        setBestCombo((b) => Math.max(b, n));
        tone(440 + Math.min(n, 8) * 70, 0.12);
        if (fast) tone(1180, 0.08, "triangle");
      } else {
        comboRef.current = 0;
        setCombo(0);
        tone(150, 0.2, "sawtooth");
      }
      if (sessionId) {
        const r = await recordAnswer({
          sessionId, skill: obj.id, quality, itemRef: obj.id,
          difficulty: obj.difficulty, chosen: opt?.text, timeMs: elapsedMs,
        });
        if (r) setXp((x) => x + r.xpGained);
      }
    },
    [obj, sessionId]
  );

  useEffect(() => {
    // En mode vocal, pas de chrono (parler + faire évaluer ne tient pas en 15 s).
    if (!started || voiceMode || revealed || done || !obj) return;
    if (time <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      reveal(null, null);
      return;
    }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, started, voiceMode, revealed, done, obj, reveal]);

  async function submitVoice(spoken: string) {
    if (revealed || !obj) return;
    setVoiceErr(null);
    setVoiceScoring(true);
    const idx = await voiceMatchOption({ prompt: obj.artisanLine, spoken, options: options.map((o) => o.text) });
    setVoiceScoring(false);
    if (idx === null) { setVoiceErr("Évaluation IA indisponible — réessaie."); return; }
    const k = idx >= 0 ? idx : worstIdx(options);
    reveal(k, options[k]);
  }

  function next() {
    if (!round) return;
    if (i + 1 >= round.length) {
      if (sessionId) finishSession(sessionId, score, xp);
      setDone(true);
    } else setI((n) => n + 1);
  }

  if (!round) return <p className="mono text-[var(--ink-faint)] animate-pulse">Chargement…</p>;

  if (!started) {
    return (
      <div className="flex flex-col gap-5 max-w-xl">
        <div>
          <h1 className="display text-2xl">Drill</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">
            {voiceMode
              ? "En vocal : pas de chrono, prends le temps de formuler ta réponse à l'oral."
              : "15 s par objection — enchaîne et monte ton combo."}
          </p>
        </div>
        <div className="glass p-4">
          <VoiceModeToggle on={voiceMode} onChange={setVoiceMode} />
        </div>
        <button onClick={() => setStarted(true)} className="btn btn-primary self-start">
          Lancer le drill <Icon name="arrowRight" size={16} strokeWidth={2.5} />
        </button>
        <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]">← Hub</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="glass p-10 text-center flex flex-col items-center gap-4">
        <span className="mode-ic"><Icon name="trophy" size={24} /></span>
        <h1 className="display text-2xl">Drill terminé</h1>
        <p className="display text-6xl text-[var(--green-deep)]">{score}<span className="text-[var(--ink-faint)] text-3xl">/{round.length}</span></p>
        <p className="mono text-[var(--ink-soft)]">+{xp} XP</p>
        {bestCombo >= 2 && (
          <p className="mono text-sm text-[var(--green-deep)] flex items-center gap-1.5">
            <Icon name="flame" size={14} /> Meilleur combo ×{bestCombo}
          </p>
        )}
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
        <div className="flex items-center gap-2.5">
          {combo >= 2 && (
            <span key={combo} className="combo-badge">
              <Icon name="flame" size={14} /> ×{combo}{lastFast && revealed ? " · rapide" : ""}
            </span>
          )}
          <span className="score-chip"><Icon name="target" size={15} /> {score} · {xp} XP</span>
        </div>
      </div>

      {!voiceMode && (
        <div>
          <div className="flex justify-between mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)] mb-1.5">
            <span>Temps restant</span><span>{time}s</span>
          </div>
          <div className="timer-bar"><div className="timer-fill" style={{ width: `${(time / TIME_S) * 100}%` }} /></div>
        </div>
      )}

      <div className="flex items-start gap-4 mt-2">
        <span className="face"><Icon name="worker" size={22} /></span>
        <div className="bubble-b">
          <span className="block mono text-[10px] uppercase tracking-[.16em] text-[var(--ink-faint)] mb-1">Artisan — {SKILL_LABELS[obj.id]}</span>
          <q className="bubble-q">{obj.artisanLine}</q>
        </div>
      </div>

      {voiceMode && !revealed ? (
        <VoiceAnswer
          key={`${i}-${obj.id}`}
          prompt={obj.artisanLine}
          hints={options.map((o) => o.text)}
          submitting={voiceScoring}
          error={voiceErr}
          onSubmit={submitVoice}
        />
      ) : (
        <>
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
        </>
      )}

      {revealed && (
        <button onClick={next} className="btn-arcade self-start mt-2">
          {i + 1 >= round.length ? "Voir le résultat" : "Objection suivante"}
          <Icon name="arrowRight" size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { finishSession, recordAnswer, startSession } from "@/lib/client";
import { SKILL_LABELS, type Quality, type SkillId } from "@/lib/types";
import Icon from "@/components/Icon";

type Persona = { metier: string; ville: string; humeur: string; contexte: string };
type SimOption = { text: string; quality: Quality; feedback: string };
type Turn = { artisanLine: string; options: SimOption[]; phase: SkillId; phaseIndex: number; totalPhases: number; fallback: boolean };
type Line = { role: "artisan" | "commercial"; text: string };

const VERDICT: Record<Quality, { cls: string; label: string }> = {
  good: { cls: "v-good", label: "Top" },
  ok: { cls: "v-ok", label: "Passable" },
  bad: { cls: "v-bad", label: "À éviter" },
};

export default function ProspectGame() {
  const [persona, setPersona] = useState<Persona>({ metier: "", ville: "", humeur: "plutôt méfiant", contexte: "" });
  const [started, setStarted] = useState(false);
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

  async function fetchTurn(phaseIndex: number, hist: Line[]): Promise<Turn | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: "custom", persona, phaseIndex, history: hist }),
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

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!persona.metier || !persona.ville) return;
    setStarted(true);
    const sid = await startSession("sim", "custom");
    setSessionId(sid);
    const t = await fetchTurn(0, []);
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
      const r = await recordAnswer({ sessionId, skill: turn.phase, quality: opt.quality, itemRef: `custom:${turn.phase}`, chosen: opt.text });
      if (r) setXp((x) => x + r.xpGained);
    }
  }

  async function next() {
    if (!turn) return;
    const chosen = turn.options[picked ?? 0];
    const newHistory: Line[] = [...history, { role: "commercial", text: chosen.text }];
    const nextIndex = turn.phaseIndex + 1;
    if (nextIndex >= turn.totalPhases) {
      if (sessionId) finishSession(sessionId, goods, xp);
      setHistory(newHistory);
      setDone(true);
      return;
    }
    const t = await fetchTurn(nextIndex, newHistory);
    if (t) {
      setTurn(t);
      setPicked(null);
      setRevealed(false);
      setHistory([...newHistory, { role: "artisan", text: t.artisanLine }]);
    }
  }

  // --- Formulaire ---
  if (!started) {
    return (
      <form onSubmit={start} className="flex flex-col gap-5 max-w-xl">
        <div>
          <h1 className="display text-2xl">Vrai prospect en poche</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">Décris un artisan réel que tu vas appeler — répète l’appel avant de le passer pour de vrai.</p>
        </div>
        <div className="glass p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">Métier *</span>
            <input className="field" value={persona.metier} onChange={(e) => setPersona({ ...persona, metier: e.target.value })} placeholder="couvreur, plombier, paysagiste…" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">Ville *</span>
            <input className="field" value={persona.ville} onChange={(e) => setPersona({ ...persona, ville: e.target.value })} placeholder="Bordeaux, Lille…" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">Humeur / caractère</span>
            <input className="field" value={persona.humeur} onChange={(e) => setPersona({ ...persona, humeur: e.target.value })} placeholder="méfiant, pressé, bavard…" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">Contexte (optionnel)</span>
            <input className="field" value={persona.contexte} onChange={(e) => setPersona({ ...persona, contexte: e.target.value })} placeholder="bosse seul, que du bouche-à-oreille, pas de site…" />
          </label>
          <button type="submit" disabled={!persona.metier || !persona.ville} className="btn btn-primary self-start">
            Lancer l’appel <Icon name="phone" size={16} strokeWidth={2.2} />
          </button>
        </div>
        <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]">← Hub</Link>
      </form>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <div className="glass p-10 text-center flex flex-col items-center gap-3">
          <span className="mode-ic"><Icon name="trophy" size={24} /></span>
          <h1 className="display text-2xl">Répétition terminée</h1>
          <p className="display text-6xl text-[var(--green-deep)]">{goods}<span className="text-[var(--ink-faint)] text-3xl">/{answers}</span></p>
          <p className="mono text-[var(--ink-soft)]">répliques optimales · +{xp} XP · {persona.metier} ({persona.ville})</p>
          <div className="flex gap-3 mt-2">
            <Link href="/" className="btn btn-glass">← Hub</Link>
            <button onClick={() => window.location.reload()} className="btn btn-primary">Autre prospect</button>
          </div>
        </div>
        <Transcript history={history} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {turn && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="hud-chip"><Icon name="phone" size={15} /> {SKILL_LABELS[turn.phase]}</span>
            <span className="counter-label">Phase <b>{turn.phaseIndex + 1}</b>/{turn.totalPhases} · {persona.metier}</span>
          </div>
          <span className="score-chip"><Icon name="target" size={15} /> {goods}/{answers} · {xp} XP{turn.fallback && " · démo"}</span>
        </div>
      )}
      <Transcript history={history} />
      {error && (
        <div className="glass p-4 text-sm text-[var(--bad)] flex items-center justify-between gap-3">
          {error}
          <button onClick={() => turn && fetchTurn(turn.phaseIndex, history).then((t) => t && setTurn(t))} className="btn-arcade">Réessayer</button>
        </div>
      )}
      {loading && <p className="mono text-sm text-[var(--ink-faint)] animate-pulse">L&apos;artisan réfléchit…</p>}
      {turn && !loading && (
        <>
          <p className="mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">Ta réplique</p>
          <div className="flex flex-col gap-3">
            {turn.options.map((opt, idx) => {
              const isPicked = idx === picked;
              let state = "";
              if (revealed) state = opt.quality === "good" ? "good" : isPicked ? "bad" : "dim";
              return (
                <button key={idx} disabled={revealed} onClick={() => pick(idx, opt)} className={`opt-b ${state}`}>
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
              {turn.phaseIndex + 1 >= turn.totalPhases ? "Terminer l'appel" : "Phase suivante"}
              <Icon name="arrowRight" size={16} strokeWidth={2.5} />
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
    <div className="glass p-5 flex flex-col gap-3">
      {history.map((l, idx) => (
        <div key={idx} className={`convo-msg ${l.role === "commercial" ? "convo-me" : "convo-them"}`}>
          <span className="convo-who">{l.role === "artisan" ? <Icon name="worker" size={16} /> : null}</span>
          <div className="convo-body">
            <span className="block mono text-[9px] tracking-[.14em] uppercase opacity-70 mb-0.5">{l.role === "commercial" ? "Toi" : "Artisan"}</span>
            {l.text}
          </div>
        </div>
      ))}
    </div>
  );
}

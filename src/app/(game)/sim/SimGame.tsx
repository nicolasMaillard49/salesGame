"use client";

import { useState } from "react";
import Link from "next/link";
import { finishSession, recordAnswer, scoreVoiceReply, startSession } from "@/lib/client";
import { useVoicePref } from "@/lib/voice";
import { VoiceAnswer, VoiceModeToggle } from "@/components/VoiceAnswer";
import { SKILL_LABELS, type Quality, type SkillId } from "@/lib/types";
import Icon from "@/components/Icon";
import ArtisanAvatar from "@/components/ArtisanAvatar";

type Card = {
  id: string;
  persona: { metier: string; ville: string; humeur: string; contexte: string };
  difficulty: number;
  phases: number;
  closingStart: number;
  locked: boolean;
};
type SimOption = { text: string; quality: Quality; feedback: string };
type Turn = { artisanLine: string; options: SimOption[]; phase: SkillId; phaseIndex: number; totalPhases: number; fallback: boolean };
type Line = { role: "artisan" | "commercial"; text: string };

const VERDICT: Record<Quality, { cls: string; label: string }> = {
  good: { cls: "v-good", label: "Top" },
  ok: { cls: "v-ok", label: "Passable" },
  bad: { cls: "v-bad", label: "À éviter" },
};
const DIFF = ["", "Facile", "Moyen", "Difficile"];

// Réplique de présentation jouée juste avant le closing, pour planter le décor
// quand on s'entraîne directement sur le closing (l'artisan vient de voir le site).
function presentationSeed(p: Card["persona"]): string {
  const metier = p.metier.trim().toLowerCase();
  return `Voilà, je vous ai préparé un site qui ressort quand on tape « ${metier} ${p.ville.trim()} », avec vos réalisations, les avis de vos clients et un bouton pour vous appeler directement.`;
}

export default function SimGame({ scenarios, closingOnly = false, offer = "web" }: { scenarios: Card[]; closingOnly?: boolean; offer?: "web" | "ads" }) {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [metier, setMetier] = useState<string>("");
  const [startIndex, setStartIndex] = useState(0);
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
  // Mode vocal
  const [voiceMode, setVoiceMode] = useVoicePref();
  const [voiceScoring, setVoiceScoring] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);
  const [voiceQuality, setVoiceQuality] = useState<Quality | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceReply, setVoiceReply] = useState("");

  async function submitVoice(spoken: string) {
    if (revealed || !turn || !scenarioId) return;
    setVoiceErr(null);
    setVoiceReply(spoken);
    setVoiceScoring(true);
    const res = await scoreVoiceReply({ scenarioId, phaseIndex: turn.phaseIndex, artisanLine: turn.artisanLine, userReply: spoken, offer });
    setVoiceScoring(false);
    if (res === null || res.fallback) { setVoiceErr("Évaluation IA indisponible — réessaie."); return; }
    const quality: Quality = res.quality ?? "ok";
    setVoiceQuality(quality);
    setVoiceFeedback(res.feedback ?? "Réplique enregistrée.");
    setRevealed(true);
    setAnswers((a) => a + 1);
    if (quality === "good") setGoods((g) => g + 1);
    if (sessionId) {
      const r = await recordAnswer({ sessionId, skill: turn.phase, quality, itemRef: `${scenarioId}:${turn.phase}`, chosen: spoken });
      if (r) setXp((x) => x + r.xpGained);
    }
  }

  async function fetchTurn(id: string, phaseIndex: number, hist: Line[]): Promise<Turn | null> {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/sim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scenarioId: id, phaseIndex, history: hist, offer }) });
      if (!res.ok) throw new Error("api");
      return (await res.json()) as Turn;
    } catch {
      setError("L'artisan ne répond pas (réseau/IA). Réessaie.");
      return null;
    } finally { setLoading(false); }
  }

  async function start(card: Card) {
    if (card.locked) return;
    setScenarioId(card.id);
    setMetier(card.persona.metier);
    const sid = await startSession("sim", card.id);
    setSessionId(sid);
    // Mode "closing intensif" : on démarre directement à la 1re étape de closing,
    // en semant la présentation du site pour que l'artisan ait le contexte.
    const begin = closingOnly ? card.closingStart : 0;
    setStartIndex(begin);
    const seed: Line[] = closingOnly ? [{ role: "commercial", text: presentationSeed(card.persona) }] : [];
    const t = await fetchTurn(card.id, begin, seed);
    if (t) { setTurn(t); setHistory([...seed, { role: "artisan", text: t.artisanLine }]); }
  }

  async function pick(idx: number, opt: SimOption) {
    if (revealed || !turn) return;
    setPicked(idx); setRevealed(true); setAnswers((a) => a + 1);
    if (opt.quality === "good") setGoods((g) => g + 1);
    if (sessionId) {
      const r = await recordAnswer({ sessionId, skill: turn.phase, quality: opt.quality, itemRef: `${scenarioId}:${turn.phase}`, chosen: opt.text });
      if (r) setXp((x) => x + r.xpGained);
    }
  }

  async function next() {
    if (!turn || !scenarioId) return;
    const chosenText = voiceMode ? voiceReply.trim() : turn.options[picked ?? 0].text;
    const newHistory: Line[] = [...history, { role: "commercial", text: chosenText }];
    const nextIndex = turn.phaseIndex + 1;
    if (nextIndex >= turn.totalPhases) {
      if (sessionId) finishSession(sessionId, goods, xp);
      setHistory(newHistory); setDone(true); return;
    }
    const t = await fetchTurn(scenarioId, nextIndex, newHistory);
    if (t) {
      setTurn(t); setPicked(null); setRevealed(false);
      setVoiceReply(""); setVoiceQuality(null); setVoiceFeedback(null); setVoiceErr(null);
      setHistory([...newHistory, { role: "artisan", text: t.artisanLine }]);
    }
  }

  // Sélection
  if (!scenarioId) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="display text-2xl">{closingOnly ? "Closing intensif" : "Simulateur d'appel"}</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">
            {closingOnly
              ? "Le site est présenté : à toi de closer. Pré-close, prix, silence, objection, relance, paiement — l'étape la plus dure, répétée à fond."
              : "Mène l'appel du décroché au paiement. À chaque phase, choisis ta réplique."}
          </p>
        </div>
        <div className="glass p-4 max-w-md">
          <VoiceModeToggle on={voiceMode} onChange={setVoiceMode} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3.5">
          {scenarios.map((s) => (
            <button key={s.id} disabled={s.locked} onClick={() => start(s)} className={`glass mode ${s.locked ? "opacity-50 cursor-not-allowed" : ""}`}>
              <span className="flex items-center justify-between w-full">
                <span className="mono text-[12px] text-[var(--green-deep)] font-semibold px-2.5 py-1 rounded-full bg-[rgba(0,192,106,.1)]">{DIFF[s.difficulty]}</span>
                {s.locked && <Icon name="lock" size={16} className="text-[var(--ink-faint)]" />}
              </span>
              <span className="flex items-center gap-3 mt-4">
                <ArtisanAvatar metier={s.persona.metier} size={46} className="rounded-2xl ring-1 ring-[var(--glass-line)] shadow-sm" />
                <span className="min-w-0">
                  <h2 className="display text-lg capitalize leading-tight truncate">{s.persona.metier}</h2>
                  <p className="text-sm text-[var(--ink-soft)]">{s.persona.ville}</p>
                </span>
              </span>
              <p className="text-xs text-[var(--ink-faint)] mt-2">{s.persona.contexte}</p>
              {s.locked && <p className="mono text-[11px] text-[#9a6a00] mt-2">Gagne de l&apos;XP pour débloquer</p>}
            </button>
          ))}
        </div>
        <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]">← Hub</Link>
      </div>
    );
  }

  // Fin
  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <div className="glass p-10 text-center flex flex-col items-center gap-3">
          <span className="mode-ic"><Icon name="trophy" size={24} /></span>
          <h1 className="display text-2xl">Appel terminé</h1>
          <p className="display text-6xl text-[var(--green-deep)]">{goods}<span className="text-[var(--ink-faint)] text-3xl">/{answers}</span></p>
          <p className="mono text-[var(--ink-soft)]">répliques optimales · +{xp} XP</p>
          <div className="flex gap-3 mt-2">
            <Link href="/" className="btn btn-glass">← Hub</Link>
            <button onClick={() => window.location.reload()} className="btn btn-primary">Nouvel appel</button>
          </div>
        </div>
        <Transcript history={history} metier={metier} />
      </div>
    );
  }

  // En jeu
  return (
    <div className="flex flex-col gap-5">
      {turn && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="hud-chip"><Icon name="phone" size={15} /> {SKILL_LABELS[turn.phase]}</span>
            <span className="counter-label">{closingOnly ? "Étape" : "Phase"} <b>{turn.phaseIndex - startIndex + 1}</b>/{turn.totalPhases - startIndex}</span>
          </div>
          <span className="score-chip"><Icon name="target" size={15} /> {goods}/{answers} · {xp} XP {turn.fallback && "· démo"}</span>
        </div>
      )}

      <Transcript history={history} metier={metier} />

      {error && (
        <div className="glass p-4 text-sm text-[var(--bad)] flex items-center justify-between gap-3">
          {error}
          <button onClick={() => scenarioId && turn && fetchTurn(scenarioId, turn.phaseIndex, history).then((t) => t && setTurn(t))} className="btn-arcade">Réessayer</button>
        </div>
      )}

      {loading && <p className="mono text-sm text-[var(--ink-faint)] animate-pulse">L&apos;artisan réfléchit…</p>}

      {turn && !loading && voiceMode && (
        <>
          {!revealed && (
            <VoiceAnswer
              key={`${scenarioId}-${turn.phaseIndex}`}
              prompt={turn.artisanLine}
              hints={turn.options.filter((o) => o.quality === "good").map((o) => o.text)}
              submitting={voiceScoring}
              error={voiceErr}
              onSubmit={submitVoice}
            />
          )}
          {revealed && voiceQuality && (
            <div className="glass p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className={`verdict ${VERDICT[voiceQuality].cls}`}>{VERDICT[voiceQuality].label}</span>
                <span className="mono text-xs text-[var(--ink-faint)]">ce que tu as dit</span>
              </div>
              <p className="text-[var(--ink)]">« {voiceReply.trim()} »</p>
              {voiceFeedback && <p className="text-sm text-[var(--ink-soft)] leading-snug">{voiceFeedback}</p>}
              {voiceQuality !== "good" && turn.options.find((o) => o.quality === "good") && (
                <div className="border-t border-[var(--glass-edge)] pt-3">
                  <span className="mono text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">Réplique modèle</span>
                  <p className="text-sm text-[var(--good)] leading-snug mt-1">« {turn.options.find((o) => o.quality === "good")!.text} »</p>
                </div>
              )}
              <button onClick={next} className="btn-arcade self-start mt-1">
                {turn.phaseIndex + 1 >= turn.totalPhases ? "Terminer l'appel" : "Phase suivante"}
                <Icon name="arrowRight" size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      )}

      {turn && !loading && !voiceMode && (
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

function Transcript({ history, metier }: { history: Line[]; metier?: string }) {
  if (history.length === 0) return null;
  return (
    <div className="glass p-5 flex flex-col gap-3">
      {history.map((l, idx) => (
        <div key={idx} className={`convo-msg ${l.role === "commercial" ? "convo-me" : "convo-them"}`}>
          <span className="convo-who overflow-hidden">{l.role === "artisan" ? <ArtisanAvatar metier={metier} size={30} className="rounded-[9px]" /> : null}</span>
          <div className="convo-body">
            <span className="block mono text-[9px] tracking-[.14em] uppercase opacity-70 mb-0.5">{l.role === "commercial" ? "Toi" : "Artisan"}</span>
            {l.text}
          </div>
        </div>
      ))}
    </div>
  );
}

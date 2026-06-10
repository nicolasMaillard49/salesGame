"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { finishSession, recordAnswer, scoreVoiceReply, startSession } from "@/lib/client";
import { useVoice, useVoicePref } from "@/lib/voice";
import { SKILL_LABELS, type Offer, type Quality, type SkillId } from "@/lib/types";
import Icon from "@/components/Icon";
import ArtisanAvatar from "@/components/ArtisanAvatar";

type Persona = { metier: string; ville: string; humeur: string; contexte: string };
type SimOption = { text: string; quality: Quality; feedback: string };
type Turn = { artisanLine: string; options: SimOption[]; phase: SkillId; phaseIndex: number; totalPhases: number; fallback: boolean };
type Line = { role: "artisan" | "commercial"; text: string };

const VERDICT: Record<Quality, { cls: string; label: string }> = {
  good: { cls: "v-good", label: "Top" },
  ok: { cls: "v-ok", label: "Passable" },
  bad: { cls: "v-bad", label: "À éviter" },
};

export default function ProspectGame({ offer = "web" }: { offer?: Offer }) {
  const [persona, setPersona] = useState<Persona>({ metier: "", ville: "", humeur: "plutôt méfiant", contexte: "" });
  const [voiceMode, chooseVoiceMode] = useVoicePref();
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

  // — État propre au mode vocal —
  const voice = useVoice();
  const [reply, setReply] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [voiceQuality, setVoiceQuality] = useState<Quality | null>(null);

  // L'artisan parle (TTS) à chaque nouvelle réplique, en mode vocal.
  useEffect(() => {
    if (voiceMode && turn && !revealed && !done) voice.speak(turn.artisanLine);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn?.artisanLine]);

  async function fetchTurn(phaseIndex: number, hist: Line[]): Promise<Turn | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: "custom", persona, phaseIndex, history: hist, offer }),
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

  // — Chemin QCM (mode clavier) —
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

  // — Chemin vocal : on note la réplique libre via Claude —
  async function submitVoice() {
    if (revealed || !turn || !reply.trim()) return;
    voice.stop();
    voice.cancelSpeak();
    setScoring(true);
    const res = await scoreVoiceReply({
      scenarioId: "custom",
      persona,
      phaseIndex: turn.phaseIndex,
      artisanLine: turn.artisanLine,
      userReply: reply.trim(),
      offer,
    });
    setScoring(false);
    const quality: Quality = res?.quality ?? "ok";
    setVoiceQuality(quality);
    setVoiceFeedback(res?.feedback ?? "Réplique enregistrée.");
    setRevealed(true);
    setAnswers((a) => a + 1);
    if (quality === "good") setGoods((g) => g + 1);
    if (sessionId) {
      const r = await recordAnswer({ sessionId, skill: turn.phase, quality, itemRef: `custom:${turn.phase}`, chosen: reply.trim() });
      if (r) setXp((x) => x + r.xpGained);
    }
  }

  async function next() {
    if (!turn) return;
    const chosenText = voiceMode ? reply.trim() : turn.options[picked ?? 0].text;
    const newHistory: Line[] = [...history, { role: "commercial", text: chosenText }];
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
      // reset vocal pour le tour suivant
      setReply("");
      setShowHints(false);
      setVoiceFeedback(null);
      setVoiceQuality(null);
      voice.reset();
      setHistory([...newHistory, { role: "artisan", text: t.artisanLine }]);
    }
  }

  function toggleMic() {
    if (voice.listening) voice.stop();
    else {
      voice.cancelSpeak();
      // Le texte reconnu s'ajoute à la réplique en cours (événementiel).
      voice.start((text) => setReply((prev) => (prev ? `${prev} ${text}`.trim() : text)));
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

          {/* Choix du mode vocal avant chaque partie */}
          <div className="flex flex-col gap-2 pt-1">
            <span className="eyebrow">Mode vocal</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => chooseVoiceMode(true)} className={`btn ${voiceMode ? "btn-primary" : "btn-glass"}`}>
                <Icon name="mic" size={16} /> Activé
              </button>
              <button type="button" onClick={() => chooseVoiceMode(false)} className={`btn ${!voiceMode ? "btn-primary" : "btn-glass"}`}>
                Désactivé
              </button>
            </div>
            <p className="text-xs text-[var(--ink-faint)]">
              {voiceMode
                ? "Tu répondras à l’oral et l’artisan te parlera. Coup de pouce dispo si tu cales."
                : "Tu choisis tes répliques au clavier (mode classique)."}
            </p>
            {voiceMode && !voice.supported && (
              <p className="text-xs text-[var(--bad)]">⚠️ Ton navigateur ne gère pas la reconnaissance vocale — utilise Chrome ou Edge, ou laisse le mode désactivé.</p>
            )}
          </div>

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
        <Transcript history={history} metier={persona.metier} />
      </div>
    );
  }

  const modelLine = turn?.options.find((o) => o.quality === "good") ?? null;

  return (
    <div className="flex flex-col gap-5">
      {turn && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <span className="hud-chip"><Icon name="phone" size={15} /> {SKILL_LABELS[turn.phase]}</span>
            <span className="counter-label">Phase <b>{turn.phaseIndex + 1}</b>/{turn.totalPhases} · {persona.metier}</span>
          </div>
          <div className="flex items-center gap-2">
            {voiceMode && (
              <span className="hud-chip"><Icon name="mic" size={14} /> vocal</span>
            )}
            <span className="score-chip"><Icon name="target" size={15} /> {goods}/{answers} · {xp} XP{turn.fallback && " · démo"}</span>
          </div>
        </div>
      )}
      <Transcript history={history} metier={persona.metier} />
      {error && (
        <div className="glass p-4 text-sm text-[var(--bad)] flex items-center justify-between gap-3">
          {error}
          <button onClick={() => turn && fetchTurn(turn.phaseIndex, history).then((t) => t && setTurn(t))} className="btn-arcade">Réessayer</button>
        </div>
      )}
      {loading && <p className="mono text-sm text-[var(--ink-faint)] animate-pulse">L&apos;artisan réfléchit…</p>}

      {turn && !loading && voiceMode && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">Ta réplique — à l&apos;oral</p>
            <button
              type="button"
              onClick={() => voice.speak(turn.artisanLine)}
              className="mono text-[11px] text-[var(--ink-faint)] hover:text-[var(--ink)] flex items-center gap-1"
              title="Réécouter l'artisan"
            >
              <Icon name="volume" size={14} /> réécouter
            </button>
          </div>

          {!revealed && (
            <div className="glass p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={!voice.supported || scoring}
                  className={`btn ${voice.listening ? "btn-primary" : "btn-glass"}`}
                  style={voice.listening ? { boxShadow: "0 0 0 4px var(--good-wash, rgba(70,210,130,.25))" } : undefined}
                >
                  <Icon name="mic" size={16} />
                  {voice.listening ? "J'écoute… (clique pour stopper)" : "Parler"}
                </button>
                {voice.listening && <span className="mono text-xs text-[var(--good)] animate-pulse">● enregistrement</span>}
              </div>

              <textarea
                className="field min-h-[80px] resize-y"
                value={reply + (voice.interim ? ` ${voice.interim}` : "")}
                onChange={(e) => setReply(e.target.value)}
                placeholder={voice.supported ? "Parle, ou écris ta réplique ici…" : "Ton navigateur ne gère pas le micro — écris ta réplique ici."}
              />

              {voice.error && <p className="text-xs text-[var(--bad)]">{voice.error}</p>}

              <div className="flex items-center gap-3 flex-wrap">
                <button type="button" onClick={submitVoice} disabled={!reply.trim() || scoring} className="btn-arcade">
                  {scoring ? "Le coach évalue…" : "Envoyer ma réplique"}
                  {!scoring && <Icon name="arrowRight" size={16} strokeWidth={2.5} />}
                </button>
                <button type="button" onClick={() => setShowHints((s) => !s)} className="btn btn-glass">
                  💡 {showHints ? "Cacher" : "Coup de pouce"}
                </button>
                {reply.trim() && !scoring && (
                  <button type="button" onClick={() => { setReply(""); voice.reset(); }} className="mono text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
                    effacer
                  </button>
                )}
              </div>

              {showHints && (
                <div className="flex flex-col gap-2 border-t border-[var(--glass-edge)] pt-3">
                  <span className="mono text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">La bonne réponse — inspire-toi, reformule à ta façon</span>
                  {turn.options.filter((opt) => opt.quality === "good").map((opt, idx) => (
                    <p key={idx} className="text-sm text-[var(--ink-soft)] leading-snug">
                      <span className="mono text-[var(--ink-faint)]">→</span> {opt.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {revealed && voiceQuality && (
            <div className="glass p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className={`verdict ${VERDICT[voiceQuality].cls}`}>{VERDICT[voiceQuality].label}</span>
                <span className="mono text-xs text-[var(--ink-faint)]">ce que tu as dit</span>
              </div>
              <p className="text-[var(--ink)]">« {reply.trim()} »</p>
              {voiceFeedback && <p className="text-sm text-[var(--ink-soft)] leading-snug">{voiceFeedback}</p>}
              {modelLine && voiceQuality !== "good" && (
                <div className="border-t border-[var(--glass-edge)] pt-3">
                  <span className="mono text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">Réplique modèle</span>
                  <p className="text-sm text-[var(--good)] leading-snug mt-1">« {modelLine.text} »</p>
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

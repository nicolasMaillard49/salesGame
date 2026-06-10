"use client";

import { useEffect, useState } from "react";
import { useVoice } from "@/lib/voice";
import Icon from "@/components/Icon";

// Bloc de réponse vocale réutilisable par tous les jeux. Monte une instance par
// question (via une `key` côté parent) : il lit l'énoncé à voix haute au montage,
// capte la voix, propose un « coup de pouce », et remonte le texte via onSubmit.
export function VoiceAnswer({
  prompt,
  hints,
  submitting,
  onSubmit,
  label = "Ta réponse — à l'oral",
}: {
  prompt: string;
  hints?: string[];
  submitting?: boolean;
  onSubmit: (text: string) => void;
  label?: string;
}) {
  const voice = useVoice();
  const [reply, setReply] = useState("");
  const [showHints, setShowHints] = useState(false);

  // L'énoncé est lu à voix haute à l'apparition de la question.
  useEffect(() => {
    if (prompt) voice.speak(prompt);
    return () => voice.cancelSpeak();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  function toggleMic() {
    if (voice.listening) voice.stop();
    else {
      voice.cancelSpeak();
      voice.start((text) => setReply((prev) => (prev ? `${prev} ${text}`.trim() : text)));
    }
  }

  function submit() {
    if (!reply.trim() || submitting) return;
    voice.stop();
    voice.cancelSpeak();
    onSubmit(reply.trim());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">{label}</p>
        {prompt && (
          <button
            type="button"
            onClick={() => voice.speak(prompt)}
            className="mono text-[11px] text-[var(--ink-faint)] hover:text-[var(--ink)] flex items-center gap-1"
            title="Réécouter"
          >
            <Icon name="volume" size={14} /> réécouter
          </button>
        )}
      </div>

      <div className="glass p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMic}
            disabled={!voice.supported || submitting}
            className={`btn ${voice.listening ? "btn-primary" : "btn-glass"}`}
            style={voice.listening ? { boxShadow: "0 0 0 4px rgba(70,210,130,.25)" } : undefined}
          >
            <Icon name="mic" size={16} />
            {voice.listening ? "J'écoute… (clique pour stopper)" : "Parler"}
          </button>
          {voice.listening && <span className="mono text-xs text-[var(--good)] animate-pulse">● enregistrement</span>}
        </div>

        <textarea
          className="field min-h-[72px] resize-y"
          value={reply + (voice.interim ? ` ${voice.interim}` : "")}
          onChange={(e) => setReply(e.target.value)}
          placeholder={voice.supported ? "Parle, ou écris ta réponse ici…" : "Ton navigateur ne gère pas le micro — écris ta réponse ici."}
        />

        {voice.error && <p className="text-xs text-[var(--bad)]">{voice.error}</p>}

        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={submit} disabled={!reply.trim() || submitting} className="btn-arcade">
            {submitting ? "Évaluation…" : "Valider ma réponse"}
            {!submitting && <Icon name="arrowRight" size={16} strokeWidth={2.5} />}
          </button>
          {hints && hints.length > 0 && (
            <button type="button" onClick={() => setShowHints((s) => !s)} className="btn btn-glass">
              💡 {showHints ? "Cacher" : "Coup de pouce"}
            </button>
          )}
          {reply.trim() && !submitting && (
            <button type="button" onClick={() => { setReply(""); voice.reset(); }} className="mono text-xs text-[var(--ink-faint)] hover:text-[var(--ink)]">
              effacer
            </button>
          )}
        </div>

        {showHints && hints && hints.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-[var(--glass-edge)] pt-3">
            <span className="mono text-[10px] uppercase tracking-wide text-[var(--ink-faint)]">Pistes (inspire-toi, reformule à ta façon)</span>
            {hints.map((h, idx) => (
              <p key={idx} className="text-sm text-[var(--ink-soft)] leading-snug">
                <span className="mono text-[var(--ink-faint)]">→</span> {h}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Sélecteur Activé / Désactivé pour les écrans de départ.
export function VoiceModeToggle({
  on,
  onChange,
  supported = true,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  supported?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="eyebrow">Mode vocal</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(true)} className={`btn ${on ? "btn-primary" : "btn-glass"}`}>
          <Icon name="mic" size={16} /> Activé
        </button>
        <button type="button" onClick={() => onChange(false)} className={`btn ${!on ? "btn-primary" : "btn-glass"}`}>
          Désactivé
        </button>
      </div>
      <p className="text-xs text-[var(--ink-faint)]">
        {on ? "Tu réponds à l'oral, l'énoncé est lu à voix haute. Réponse tolérante (même sens = bon)." : "Tu réponds au clavier / en cliquant (mode classique)."}
      </p>
      {on && !supported && (
        <p className="text-xs text-[var(--bad)]">⚠️ Ton navigateur ne gère pas la reconnaissance vocale — utilise Chrome ou Edge.</p>
      )}
    </div>
  );
}

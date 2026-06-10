"use client";

// Mode vocal — encapsule l'API Web Speech du navigateur :
//   • reconnaissance vocale (ce que dit le commercial) en français,
//   • synthèse vocale (la voix de l'artisan).
// Tout est natif navigateur : zéro serveur, zéro coût. Repli propre au clavier
// si le navigateur ne supporte pas la reconnaissance (Firefox, certains Safari).

import { useCallback, useEffect, useRef, useState } from "react";

// Préférence « mode vocal » partagée par tous les jeux (mémorisée localStorage).
export const VOICE_PREF_KEY = "sg-voice-mode";

/** Lit/écrit la préférence mode vocal. Rend `false` côté serveur (hydration-safe). */
export function useVoicePref(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync unique au montage depuis localStorage
    if (typeof window !== "undefined" && window.localStorage.getItem(VOICE_PREF_KEY) === "1") setOn(true);
  }, []);
  const choose = useCallback((v: boolean) => {
    setOn(v);
    if (typeof window !== "undefined") window.localStorage.setItem(VOICE_PREF_KEY, v ? "1" : "0");
  }, []);
  return [on, choose];
}

// --- Types minimaux de l'API Web Speech (non typée par TS) ---
type SpeechRecognitionResultLike = { 0: { transcript: string }; isFinal: boolean };
type SpeechRecognitionEventLike = { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** La reconnaissance vocale est-elle disponible dans ce navigateur ? */
export function recognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

// --- Synthèse vocale (TTS) ---
function pickFrenchVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  // Préfère une voix française ; à défaut, laisse le navigateur choisir.
  return voices.find((v) => v.lang.toLowerCase().startsWith("fr")) ?? null;
}

export type UseVoice = {
  supported: boolean;
  listening: boolean;
  speaking: boolean;
  /** Bribe en cours de reconnaissance (non finalisée). */
  interim: string;
  error: string | null;
  /** Démarre l'écoute ; `onFinal` reçoit chaque segment de texte finalisé. */
  start: (onFinal?: (text: string) => void) => void;
  stop: () => void;
  reset: () => void;
  /** Fait parler l'artisan ; résout quand la lecture est finie (ou coupée). */
  speak: (text: string) => Promise<void>;
  cancelSpeak: () => void;
};

export function useVoice(): UseVoice {
  const [supported] = useState(recognitionSupported);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  // Réveille la liste des voix (chargée de façon asynchrone sur certains navigateurs).
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const warm = () => pickFrenchVoice();
    warm();
    window.speechSynthesis.onvoiceschanged = warm;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Coupe tout proprement au démontage.
  useEffect(() => {
    return () => {
      recRef.current?.abort();
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const start = useCallback((onFinal?: (text: string) => void) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Reconnaissance vocale non supportée par ce navigateur.");
      return;
    }
    // Une session par appui : on réinitialise la bribe en cours.
    setInterim("");
    setError(null);
    const rec = new Ctor();
    rec.lang = "fr-FR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let final = "";
      let inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else inter += r[0].transcript;
      }
      // Le texte finalisé est remonté au consommateur (événementiel, pas d'effect).
      if (final.trim()) onFinal?.(final.trim());
      setInterim(inter);
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech") setError("Je ne t'ai pas entendu — réessaie.");
      else if (e.error === "not-allowed") setError("Micro refusé. Autorise le micro dans le navigateur.");
      else if (e.error !== "aborted") setError("Souci micro — réessaie ou écris ta réplique.");
      setListening(false);
    };
    rec.onend = () => {
      setInterim("");
      setListening(false);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      // start() jette si une session tourne déjà : on ignore.
    }
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setInterim("");
    setError(null);
  }, []);

  const cancelSpeak = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) {
        resolve();
        return;
      }
      const synth = window.speechSynthesis;
      synth.cancel(); // coupe une lecture précédente
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-FR";
      const v = pickFrenchVoice();
      if (v) u.voice = v;
      u.rate = 1.02;
      u.pitch = 1;
      u.onstart = () => setSpeaking(true);
      const done = () => {
        setSpeaking(false);
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      synth.speak(u);
    });
  }, []);

  return { supported, listening, speaking, interim, error, start, stop, reset, speak, cancelSpeak };
}

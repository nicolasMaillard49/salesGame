// Helpers côté client pour le cycle de vie d'une partie.
import { OFFER_COOKIE, type GameType, type Offer, type Quality, type SkillId } from "./types";

// Écrit le cookie de parcours (Sites Web / Google Ads) côté navigateur.
export function setOfferCookie(offer: Offer): void {
  if (typeof document !== "undefined")
    document.cookie = `${OFFER_COOKIE}=${offer}; path=/; max-age=31536000; samesite=lax`;
}

export async function startSession(gameType: GameType, scenarioId?: string): Promise<string | null> {
  const res = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameType, scenarioId }),
  });
  if (!res.ok) return null;
  const d = await res.json();
  return d.session?.id ?? null;
}

export type RecordResult = { xpGained: number; backend: string } | null;

export async function recordAnswer(payload: {
  sessionId: string;
  skill: SkillId;
  quality: Quality;
  itemRef?: string;
  chosen?: string;
  difficulty?: number;
  timeMs?: number;
}): Promise<RecordResult> {
  const res = await fetch("/api/answers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

export type VoiceScore = { quality: Quality; feedback: string; fallback?: boolean } | null;

// Note une réplique libre dite à l'oral (mode vocal du simulateur Prospect).
export async function scoreVoiceReply(payload: {
  scenarioId: string;
  persona?: { metier: string; ville: string; humeur?: string; contexte?: string };
  phaseIndex: number;
  artisanLine: string;
  userReply: string;
  offer?: "web" | "ads";
}): Promise<VoiceScore> {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
}

// Match sémantique tolérant d'une réponse dite à l'oral à une option de QCM.
// Retourne l'index de la meilleure correspondance (-1 = aucune), ou `null` si
// l'évaluation IA a échoué (réseau / clé absente) — à NE PAS confondre avec un raté.
export async function voiceMatchOption(payload: {
  prompt: string;
  spoken: string;
  options: string[];
}): Promise<number | null> {
  try {
    const res = await fetch("/api/voice-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return typeof d?.index === "number" ? d.index : null;
  } catch {
    return null;
  }
}

// Vrai/faux tolérant (Quiz à trou). Renvoie null si l'IA n'a pas pu trancher.
export async function voiceCheckAnswer(payload: {
  prompt: string;
  spoken: string;
  expected: string;
}): Promise<boolean | null> {
  const res = await fetch("/api/voice-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  const d = await res.json();
  return typeof d?.correct === "boolean" ? d.correct : null;
}

export async function finishSession(id: string, score: number, xp: number): Promise<void> {
  await fetch("/api/sessions", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, score, xp }),
  });
}

// Mélange déterministe-friendly (Fisher-Yates) — utilisé côté client uniquement.
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

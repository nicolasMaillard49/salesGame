// Helpers côté client pour le cycle de vie d'une partie.
import type { GameType, Quality, SkillId } from "./types";

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
}): Promise<VoiceScore> {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return res.json();
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

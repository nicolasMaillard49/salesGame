import type { Quality, SkillId } from "./types";

// --- XP par réponse ---
export const XP_BY_QUALITY: Record<Quality, number> = {
  good: 10,
  ok: 4,
  bad: 0,
};

/** XP gagnée pour une réponse, pondérée par la difficulté (1..3). */
export function xpForAnswer(quality: Quality, difficulty = 1): number {
  const mult = 1 + (Math.max(1, Math.min(3, difficulty)) - 1) * 0.5; // 1, 1.5, 2
  return Math.round(XP_BY_QUALITY[quality] * mult);
}

// --- Rangs ---
export const RANKS = [
  { name: "Débutant", min: 0 },
  { name: "Apprenti", min: 200 },
  { name: "Closer", min: 600 },
  { name: "Top Closer", min: 1500 },
  { name: "Légende", min: 3500 },
] as const;

export function rankForXp(xp: number): { name: string; min: number } {
  let current: (typeof RANKS)[number] = RANKS[0];
  for (const r of RANKS) if (xp >= r.min) current = r;
  return current;
}

/** Progression (0..1) vers le rang suivant. 1 si rang max. */
export function progressToNextRank(xp: number): {
  next: string | null;
  ratio: number;
  remaining: number;
} {
  const idx = RANKS.findIndex((r) => r.name === rankForXp(xp).name);
  const next = RANKS[idx + 1];
  if (!next) return { next: null, ratio: 1, remaining: 0 };
  const floor = RANKS[idx].min;
  const ratio = (xp - floor) / (next.min - floor);
  return {
    next: next.name,
    ratio: Math.max(0, Math.min(1, ratio)),
    remaining: Math.max(0, next.min - xp),
  };
}

// --- Maîtrise (moyenne glissante par compétence) ---
export const QUALITY_VALUE: Record<Quality, number> = { good: 1, ok: 0.5, bad: 0 };
const ALPHA = 0.25;

/** Met à jour le score de maîtrise glissant pour une compétence. */
export function updateMastery(
  prev: { score: number; attempts: number },
  quality: Quality
): { score: number; attempts: number } {
  const q = QUALITY_VALUE[quality];
  const score = prev.attempts === 0 ? q : prev.score * (1 - ALPHA) + q * ALPHA;
  return { score: Math.max(0, Math.min(1, score)), attempts: prev.attempts + 1 };
}

export const WEAK_THRESHOLD = 0.5;

export function isWeak(score: number, attempts: number): boolean {
  return attempts > 0 && score < WEAK_THRESHOLD;
}

// --- Déblocages ---
/** Difficulté max débloquée selon l'XP totale. */
export function unlockedDifficulty(xp: number): 1 | 2 | 3 {
  if (xp >= 1500) return 3;
  if (xp >= 600) return 2;
  return 1;
}

export function isUnlocked(difficulty: number, xp: number): boolean {
  return difficulty <= unlockedDifficulty(xp);
}

// --- Niveaux de maîtrise (Bronze / Argent / Or) ---
export function masteryLevel(score: number): { name: string; color: string } | null {
  if (score >= 0.85) return { name: "Or", color: "#ffc24d" };
  if (score >= 0.7) return { name: "Argent", color: "#c7d0d9" };
  if (score >= 0.5) return { name: "Bronze", color: "#cd8e5e" };
  return null;
}

// --- Décroissance (la maîtrise "rouille" si pas pratiquée) ---
const RUST_GRACE_DAYS = 3;
const RUST_PER_DAY = 0.04;

export function daysSince(lastSeenMs: number | null, nowMs: number): number {
  if (!lastSeenMs) return Infinity;
  return (nowMs - lastSeenMs) / 86_400_000;
}

/** Score affiché après décroissance : -4 %/jour au-delà de 3 jours d'inactivité (plancher 30 %). */
export function decayedScore(score: number, lastSeenMs: number | null, nowMs: number): number {
  const d = daysSince(lastSeenMs, nowMs);
  if (d <= RUST_GRACE_DAYS || !isFinite(d)) return score;
  const dec = Math.min(0.7, (d - RUST_GRACE_DAYS) * RUST_PER_DAY);
  return Math.max(score * 0.3, score * (1 - dec));
}

export function isRusty(lastSeenMs: number | null, nowMs: number): boolean {
  return daysSince(lastSeenMs, nowMs) > 5;
}

// --- Défi quotidien / streak ---
/** Calcule la nouvelle série selon le dernier jour joué. */
export function nextStreak(
  prev: { streak: number; lastDay: string | null },
  today: string,
  yesterday: string
): { streak: number; alreadyDone: boolean } {
  if (prev.lastDay === today) return { streak: prev.streak, alreadyDone: true };
  const streak = prev.lastDay === yesterday ? prev.streak + 1 : 1;
  return { streak, alreadyDone: false };
}

/** Index déterministe (par date) pour choisir l'élément du jour dans une liste. */
export function dailyIndex(dateStr: string, len: number): number {
  if (len <= 0) return 0;
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  return h % len;
}

/** Compétences faibles triées (la plus faible en premier). */
export function weakSkills(
  mastery: Record<string, { score: number; attempts: number }>
): SkillId[] {
  return (Object.entries(mastery) as [SkillId, { score: number; attempts: number }][])
    .filter(([, m]) => isWeak(m.score, m.attempts))
    .sort((a, b) => a[1].score - b[1].score)
    .map(([s]) => s);
}

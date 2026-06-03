import { nextStreak, rankForXp, unlockedDifficulty, updateMastery, xpForAnswer } from "../progression";
import type { GameType } from "../types";
import type { AnswerInput, BestReply, DailyResult, MasteryMap, ProgressState, SessionRow, Snapshot, Store } from "./types";

type Mem = {
  sessions: Map<string, SessionRow>;
  progress: ProgressState;
  mastery: MasteryMap;
  good: Map<string, { skill: string; text: string; count: number }>;
  seq: number;
};

// Persiste à travers les hot-reloads en dev.
const g = globalThis as unknown as { __sgMem?: Mem };
function mem(): Mem {
  if (!g.__sgMem) {
    g.__sgMem = {
      sessions: new Map(),
      progress: { xpTotal: 0, rank: "Débutant", unlocked: [], streak: 0, bestStreak: 0, lastDay: null },
      mastery: {},
      good: new Map(),
      seq: 0,
    };
  }
  return g.__sgMem;
}

export class MemoryStore implements Store {
  readonly backend = "memory" as const;

  async createSession(gameType: GameType, scenarioId?: string): Promise<SessionRow> {
    const m = mem();
    const id = `mem-${++m.seq}`;
    const row: SessionRow = { id, gameType, scenarioId: scenarioId ?? null, score: 0, xp: 0 };
    m.sessions.set(id, row);
    return row;
  }

  async finishSession(id: string, score: number, xp: number): Promise<void> {
    const row = mem().sessions.get(id);
    if (row) {
      row.score = score;
      row.xp = xp;
    }
  }

  async recordAnswer(sessionId: string, input: AnswerInput): Promise<{ xpGained: number }> {
    const m = mem();
    const xpGained = xpForAnswer(input.quality, input.difficulty ?? 1);
    // XP + rang
    m.progress.xpTotal += xpGained;
    m.progress.rank = rankForXp(m.progress.xpTotal).name;
    m.progress.unlocked = difficultiesUnlocked(m.progress.xpTotal);
    // maîtrise
    const prev = m.mastery[input.skill] ?? { score: 0, attempts: 0 };
    m.mastery[input.skill] = updateMastery(prev, input.quality);
    // meilleures répliques (pour la fiche perso)
    if (input.quality === "good" && input.chosen) {
      const key = `${input.skill}|${input.chosen}`;
      const e = m.good.get(key) ?? { skill: input.skill, text: input.chosen, count: 0 };
      e.count += 1;
      m.good.set(key, e);
    }
    // total de session
    const row = m.sessions.get(sessionId);
    if (row) row.xp += xpGained;
    return { xpGained };
  }

  async recordDaily(today: string, yesterday: string): Promise<DailyResult> {
    const m = mem();
    const { streak, alreadyDone } = nextStreak(
      { streak: m.progress.streak, lastDay: m.progress.lastDay },
      today,
      yesterday
    );
    if (!alreadyDone) {
      m.progress.streak = streak;
      m.progress.bestStreak = Math.max(m.progress.bestStreak, streak);
      m.progress.lastDay = today;
    }
    return { streak, bestStreak: m.progress.bestStreak, alreadyDone };
  }

  async getBestReplies(): Promise<BestReply[]> {
    return [...mem().good.values()].sort((a, b) => b.count - a.count);
  }

  async getSnapshot(): Promise<Snapshot> {
    const m = mem();
    return {
      progress: { ...m.progress, unlocked: [...m.progress.unlocked] },
      mastery: structuredClone(m.mastery),
    };
  }
}

function difficultiesUnlocked(xp: number): string[] {
  const d = unlockedDifficulty(xp);
  const out = ["d1"];
  if (d >= 2) out.push("d2");
  if (d >= 3) out.push("d3");
  return out;
}

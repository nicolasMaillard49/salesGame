import type { GameType, Quality, SkillId } from "../types";

export type AnswerInput = {
  skill: SkillId;
  itemRef?: string;
  quality: Quality;
  chosen?: string;
  difficulty?: number;
  timeMs?: number;
};

export type MasteryEntry = { score: number; attempts: number; updatedAt?: number | null };
export type MasteryMap = Partial<Record<SkillId, MasteryEntry>>;

export type Trend = "up" | "down" | "flat";

export type ProgressState = {
  xpTotal: number;
  rank: string;
  unlocked: string[];
  streak: number;
  bestStreak: number;
  lastDay: string | null;
};

export type DailyResult = { streak: number; bestStreak: number; alreadyDone: boolean };

export type BestReply = { skill: string; text: string; count: number };

export type Snapshot = {
  progress: ProgressState;
  mastery: MasteryMap;
};

export type SessionRow = {
  id: string;
  gameType: GameType;
  scenarioId?: string | null;
  score: number;
  xp: number;
};

export interface Store {
  readonly backend: "supabase" | "memory";
  createSession(gameType: GameType, scenarioId?: string): Promise<SessionRow>;
  finishSession(id: string, score: number, xp: number): Promise<void>;
  recordAnswer(sessionId: string, input: AnswerInput): Promise<{ xpGained: number }>;
  recordDaily(today: string, yesterday: string): Promise<DailyResult>;
  getBestReplies(): Promise<BestReply[]>;
  getTrends(): Promise<Partial<Record<string, Trend>>>;
  getSnapshot(): Promise<Snapshot>;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { nextStreak, rankForXp, unlockedDifficulty, updateMastery, xpForAnswer } from "../progression";
import type { GameType, SkillId } from "../types";
import type { AnswerInput, DailyResult, MasteryMap, ProgressState, SessionRow, Snapshot, Store } from "./types";

function difficultiesUnlocked(xp: number): string[] {
  const d = unlockedDifficulty(xp);
  const out = ["d1"];
  if (d >= 2) out.push("d2");
  if (d >= 3) out.push("d3");
  return out;
}

export class SupabaseStore implements Store {
  readonly backend = "supabase" as const;
  private c: SupabaseClient;

  constructor(url: string, serviceKey: string) {
    this.c = createClient(url, serviceKey, { auth: { persistSession: false } });
  }

  async createSession(gameType: GameType, scenarioId?: string): Promise<SessionRow> {
    const { data, error } = await this.c
      .from("sessions")
      .insert({ game_type: gameType, scenario_id: scenarioId ?? null })
      .select("id")
      .single();
    if (error) throw error;
    return { id: data.id as string, gameType, scenarioId: scenarioId ?? null, score: 0, xp: 0 };
  }

  async finishSession(id: string, score: number, xp: number): Promise<void> {
    const { error } = await this.c
      .from("sessions")
      .update({ score, xp, ended_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  }

  async recordAnswer(sessionId: string, input: AnswerInput): Promise<{ xpGained: number }> {
    const xpGained = xpForAnswer(input.quality, input.difficulty ?? 1);

    await this.c.from("answers").insert({
      session_id: sessionId,
      skill: input.skill,
      item_ref: input.itemRef ?? null,
      quality: input.quality,
      chosen: input.chosen ?? null,
      time_ms: input.timeMs ?? null,
    });

    // maîtrise (read-modify-write)
    const { data: mRow } = await this.c
      .from("mastery")
      .select("score, attempts")
      .eq("skill", input.skill)
      .maybeSingle();
    const next = updateMastery(
      { score: mRow?.score ?? 0, attempts: mRow?.attempts ?? 0 },
      input.quality
    );
    await this.c
      .from("mastery")
      .upsert({ skill: input.skill, score: next.score, attempts: next.attempts, updated_at: new Date().toISOString() });

    // progress singleton
    const { data: pRow } = await this.c
      .from("progress")
      .select("xp_total")
      .eq("id", 1)
      .maybeSingle();
    const xpTotal = (pRow?.xp_total ?? 0) + xpGained;
    await this.c.from("progress").upsert({
      id: 1,
      xp_total: xpTotal,
      rank: rankForXp(xpTotal).name,
      unlocked: difficultiesUnlocked(xpTotal),
      updated_at: new Date().toISOString(),
    });

    return { xpGained };
  }

  async recordDaily(today: string, yesterday: string): Promise<DailyResult> {
    const { data: pRow } = await this.c
      .from("progress")
      .select("streak, best_streak, last_day")
      .eq("id", 1)
      .maybeSingle();
    const prev = { streak: pRow?.streak ?? 0, lastDay: (pRow?.last_day as string | null) ?? null };
    const { streak, alreadyDone } = nextStreak(prev, today, yesterday);
    const bestStreak = Math.max(pRow?.best_streak ?? 0, streak);
    if (!alreadyDone) {
      await this.c.from("progress").upsert({
        id: 1,
        streak,
        best_streak: bestStreak,
        last_day: today,
        updated_at: new Date().toISOString(),
      });
    }
    return { streak, bestStreak, alreadyDone };
  }

  async getSnapshot(): Promise<Snapshot> {
    const { data: pRow } = await this.c
      .from("progress")
      .select("xp_total, rank, unlocked, streak, best_streak, last_day")
      .eq("id", 1)
      .maybeSingle();
    const progress: ProgressState = {
      xpTotal: pRow?.xp_total ?? 0,
      rank: pRow?.rank ?? "Débutant",
      unlocked: (pRow?.unlocked as string[]) ?? [],
      streak: pRow?.streak ?? 0,
      bestStreak: pRow?.best_streak ?? 0,
      lastDay: (pRow?.last_day as string | null) ?? null,
    };
    const { data: mRows } = await this.c.from("mastery").select("skill, score, attempts");
    const mastery: MasteryMap = {};
    for (const r of mRows ?? []) {
      mastery[r.skill as SkillId] = { score: r.score as number, attempts: r.attempts as number };
    }
    return { progress, mastery };
  }
}

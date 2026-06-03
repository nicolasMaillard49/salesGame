import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { nextStreak, rankForXp, unlockedDifficulty, xpForAnswer } from "../progression";

const MASTERY_ALPHA = 0.25; // doit rester aligné avec updateMastery() de progression.ts
import type { GameType, SkillId } from "../types";
import type { AnswerInput, BestReply, DailyResult, MasteryMap, ProgressState, SessionRow, Snapshot, Store, Trend } from "./types";

const QV: Record<string, number> = { good: 1, ok: 0.5, bad: 0 };

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
    // 1 seul aller-retour atomique (insert answer + upsert mastery + bump xp) via fonction Postgres
    const { error } = await this.c.rpc("record_answer", {
      p_session: sessionId,
      p_skill: input.skill,
      p_quality: input.quality,
      p_item: input.itemRef ?? null,
      p_chosen: input.chosen ?? null,
      p_time_ms: input.timeMs ?? null,
      p_xp: xpGained,
      p_qval: QV[input.quality] ?? 0,
      p_alpha: MASTERY_ALPHA,
    });
    if (error) console.error("[record_answer]", error.message);
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

  async getBestReplies(): Promise<BestReply[]> {
    const { data } = await this.c
      .from("answers")
      .select("skill, chosen")
      .eq("quality", "good")
      .not("chosen", "is", null)
      .limit(2000);
    const map = new Map<string, BestReply>();
    for (const r of data ?? []) {
      if (!r.chosen) continue;
      const key = `${r.skill}|${r.chosen}`;
      const e = map.get(key) ?? { skill: r.skill as string, text: r.chosen as string, count: 0 };
      e.count += 1;
      map.set(key, e);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }

  async getTrends(): Promise<Partial<Record<string, Trend>>> {
    // calcul en SQL (récent vs précédent), résultat minuscule, 1 aller-retour
    const { data } = await this.c.rpc("skill_trends");
    const out: Partial<Record<string, Trend>> = {};
    for (const r of (data ?? []) as { skill: string; trend: string }[]) {
      out[r.skill] = r.trend as Trend;
    }
    return out;
  }

  async getSnapshot(): Promise<Snapshot> {
    // les 2 lectures en parallèle ; rang/déblocages dérivés de l'XP (plus stockés)
    const [pRes, mRes] = await Promise.all([
      this.c.from("progress").select("xp_total, streak, best_streak, last_day").eq("id", 1).maybeSingle(),
      this.c.from("mastery").select("skill, score, attempts, updated_at"),
    ]);
    const pRow = pRes.data;
    const xpTotal = pRow?.xp_total ?? 0;
    const progress: ProgressState = {
      xpTotal,
      rank: rankForXp(xpTotal).name,
      unlocked: difficultiesUnlocked(xpTotal),
      streak: pRow?.streak ?? 0,
      bestStreak: pRow?.best_streak ?? 0,
      lastDay: (pRow?.last_day as string | null) ?? null,
    };
    const mRows = mRes.data;
    const mastery: MasteryMap = {};
    for (const r of mRows ?? []) {
      mastery[r.skill as SkillId] = {
        score: r.score as number,
        attempts: r.attempts as number,
        updatedAt: r.updated_at ? Date.parse(r.updated_at as string) : null,
      };
    }
    return { progress, mastery };
  }
}

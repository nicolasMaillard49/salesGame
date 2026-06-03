import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { isSkillId, type Quality } from "@/lib/types";

const QUALITIES: Quality[] = ["good", "ok", "bad"];

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { sessionId, skill, quality, itemRef, chosen, difficulty, timeMs } = body ?? {};

  if (typeof sessionId !== "string" || !isSkillId(skill) || !QUALITIES.includes(quality)) {
    return NextResponse.json({ error: "payload invalide" }, { status: 400 });
  }

  const store = getStore();
  const { xpGained } = await store.recordAnswer(sessionId, {
    skill,
    quality,
    itemRef,
    chosen,
    difficulty: difficulty ? Number(difficulty) : 1,
    timeMs: timeMs ? Number(timeMs) : undefined,
  });
  const snapshot = await store.getSnapshot();
  return NextResponse.json({ xpGained, snapshot, backend: store.backend });
}

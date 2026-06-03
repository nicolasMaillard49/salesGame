import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getStore } from "@/lib/db";
import type { GameType } from "@/lib/types";

const GAME_TYPES: GameType[] = ["quiz", "drill", "sim"];

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const gameType = body?.gameType as GameType;
  if (!GAME_TYPES.includes(gameType))
    return NextResponse.json({ error: "gameType invalide" }, { status: 400 });
  const session = await getStore().createSession(gameType, body?.scenarioId);
  return NextResponse.json({ session });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { id, score, xp } = body ?? {};
  if (typeof id !== "string")
    return NextResponse.json({ error: "id manquant" }, { status: 400 });
  await getStore().finishSession(id, Number(score ?? 0), Number(xp ?? 0));
  return NextResponse.json({ ok: true });
}

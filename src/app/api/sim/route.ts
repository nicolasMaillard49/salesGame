import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getScenario } from "@/lib/content";
import { customScenario, hasAnthropic, simPhases, simTurn, type SimHistoryItem, type SimTurn } from "@/lib/anthropic";
import { isOffer } from "@/lib/types";
import { fallbackTurn } from "@/lib/sim-fallback";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scenarioId = String(body?.scenarioId ?? "");
  const phaseIndex = Number(body?.phaseIndex ?? 0);
  const offer = isOffer(body?.offer) ? body.offer : "web";
  const history = (Array.isArray(body?.history) ? body.history : []) as SimHistoryItem[];

  let scenario;
  if (scenarioId === "custom" && body?.persona?.metier && body?.persona?.ville) {
    const p = body.persona;
    scenario = customScenario({
      metier: String(p.metier).slice(0, 60),
      ville: String(p.ville).slice(0, 60),
      humeur: String(p.humeur ?? "neutre").slice(0, 60),
      contexte: String(p.contexte ?? "").slice(0, 200),
    }, offer);
  } else {
    scenario = getScenario(scenarioId, offer);
  }
  if (!scenario)
    return NextResponse.json({ error: "scénario introuvable" }, { status: 404 });
  const phases = simPhases(scenario);
  const node = phases[phaseIndex];
  if (!node) return NextResponse.json({ error: "phase invalide" }, { status: 400 });

  let turn: SimTurn;
  let fallback = false;

  if (hasAnthropic()) {
    try {
      turn = await simTurn(scenario, node, history);
    } catch {
      try {
        turn = await simTurn(scenario, node, history); // 1 retry
      } catch {
        turn = fallbackTurn(scenario, node);
        fallback = true;
      }
    }
  } else {
    turn = fallbackTurn(scenario, node);
    fallback = true;
  }

  return NextResponse.json({
    ...turn,
    phase: node.phase,
    phaseIndex,
    totalPhases: phases.length,
    fallback,
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getScenario } from "@/lib/content";
import { customScenario, hasAnthropic, simTurn, type SimHistoryItem, type SimTurn } from "@/lib/anthropic";
import type { PhaseNode } from "@/lib/content/schema";

function fallbackTurn(node: PhaseNode): SimTurn {
  return {
    artisanLine: node.artisanSeed ?? "Ouais… je vous écoute, mais faites vite.",
    options: [
      {
        text: `(Suivre l'objectif) ${node.bonneIntention}`,
        quality: "good",
        feedback: "C'est l'intention juste pour cette phase.",
      },
      {
        text: "Je continue mon argumentaire sans creuser sa situation.",
        quality: "ok",
        feedback: "Acceptable mais tu n'avances pas vraiment l'appel.",
      },
      {
        text: "Alors, ça vous intéresse un site ? C'est 300€, on signe ?",
        quality: "bad",
        feedback: "Trop direct, trop tôt : tu brûles les étapes.",
      },
    ],
  };
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scenarioId = String(body?.scenarioId ?? "");
  const phaseIndex = Number(body?.phaseIndex ?? 0);
  const history = (Array.isArray(body?.history) ? body.history : []) as SimHistoryItem[];

  let scenario;
  if (scenarioId === "custom" && body?.persona?.metier && body?.persona?.ville) {
    const p = body.persona;
    scenario = customScenario({
      metier: String(p.metier).slice(0, 60),
      ville: String(p.ville).slice(0, 60),
      humeur: String(p.humeur ?? "neutre").slice(0, 60),
      contexte: String(p.contexte ?? "").slice(0, 200),
    });
  } else {
    scenario = getScenario(scenarioId);
  }
  if (!scenario)
    return NextResponse.json({ error: "scénario introuvable" }, { status: 404 });
  const node = scenario.phases[phaseIndex];
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
        turn = fallbackTurn(node);
        fallback = true;
      }
    }
  } else {
    turn = fallbackTurn(node);
    fallback = true;
  }

  return NextResponse.json({
    ...turn,
    phase: node.phase,
    phaseIndex,
    totalPhases: scenario.phases.length,
    fallback,
  });
}

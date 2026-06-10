import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getScenario } from "@/lib/content";
import { customScenario, hasAnthropic, scoreReply, simPhases, type Score } from "@/lib/anthropic";
import { isOffer } from "@/lib/types";

// Pré-chauffage : réveille la fonction (évite le cold start au 1er « Valider »).
export function GET() {
  return NextResponse.json({ warm: true });
}

// Note la réplique libre dite à voix haute par le commercial (mode vocal).
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scenarioId = String(body?.scenarioId ?? "");
  const phaseIndex = Number(body?.phaseIndex ?? 0);
  const artisanLine = String(body?.artisanLine ?? "").slice(0, 600);
  const userReply = String(body?.userReply ?? "").trim().slice(0, 600);
  const offer = isOffer(body?.offer) ? body.offer : "web";

  if (!userReply)
    return NextResponse.json({ error: "réplique vide" }, { status: 400 });

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

  const node = simPhases(scenario)[phaseIndex];
  if (!node) return NextResponse.json({ error: "phase invalide" }, { status: 400 });

  let score: Score;
  let fallback = false;

  if (hasAnthropic()) {
    try {
      score = await scoreReply(scenario, node, artisanLine, userReply);
    } catch {
      try {
        score = await scoreReply(scenario, node, artisanLine, userReply); // 1 retry
      } catch {
        score = { quality: "ok", feedback: "Évaluation IA indisponible — réplique enregistrée." };
        fallback = true;
      }
    }
  } else {
    score = { quality: "ok", feedback: "Évaluation IA indisponible — réplique enregistrée." };
    fallback = true;
  }

  return NextResponse.json({ ...score, fallback });
}

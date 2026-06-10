import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { hasAnthropic, voiceCheck, voiceMatch } from "@/lib/anthropic";

// Notation vocale tolérante pour les QCM/quiz.
//  • mode "options" : { prompt, spoken, options:string[] } → { index } (meilleure correspondance par le sens).
//  • mode "expected" : { prompt, spoken, expected:string } → { correct } (Quiz à trou).
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const prompt = String(body?.prompt ?? "").slice(0, 600);
  const spoken = String(body?.spoken ?? "").trim().slice(0, 600);
  if (!spoken) return NextResponse.json({ error: "réponse vide" }, { status: 400 });

  if (!hasAnthropic())
    return NextResponse.json({ error: "IA indisponible", index: -1 }, { status: 503 });

  // Mode "réponse attendue" (Quiz à trou)
  if (typeof body?.expected === "string") {
    const expected = String(body.expected).slice(0, 600);
    try {
      const correct = await voiceCheck(prompt, spoken, expected);
      return NextResponse.json({ correct });
    } catch {
      return NextResponse.json({ error: "échec évaluation", correct: false }, { status: 502 });
    }
  }

  // Mode "options" (QCM)
  const options = (Array.isArray(body?.options) ? body.options : [])
    .map((o: unknown) => String(o).slice(0, 400))
    .slice(0, 12);
  if (options.length === 0)
    return NextResponse.json({ error: "options manquantes" }, { status: 400 });

  try {
    const index = await voiceMatch(prompt, spoken, options);
    return NextResponse.json({ index });
  } catch {
    return NextResponse.json({ error: "échec évaluation", index: -1 }, { status: 502 });
  }
}

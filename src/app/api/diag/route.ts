import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isAuthenticated } from "@/lib/auth";

// Diagnostic IA — protégé par auth. Dit si la clé Anthropic est vue au runtime
// et si un appel minimal aboutit. La clé n'est JAMAIS renvoyée (juste longueur + fin).
export async function GET() {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });

  const key = process.env.ANTHROPIC_API_KEY ?? "";
  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
  const out: Record<string, unknown> = {
    hasKey: !!key,
    keyLength: key.length,
    keyTail: key ? key.slice(-4) : null,
    model,
  };

  if (!key) {
    out.anthropicTest = "PAS DE CLÉ vue au runtime (process.env.ANTHROPIC_API_KEY vide)";
    return NextResponse.json(out);
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model,
      max_tokens: 5,
      messages: [{ role: "user", content: "Réponds juste: OK" }],
    });
    const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
    out.anthropicTest = "OK";
    out.sampleReply = text.slice(0, 20);
  } catch (e) {
    out.anthropicTest = "ÉCHEC";
    out.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(out);
}

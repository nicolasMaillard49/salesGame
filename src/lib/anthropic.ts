import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { PhaseNode, Scenario } from "./content/schema";
import { DISCOVERY_RUBRICS } from "./sim-phases";

// Ré-exports pour les consommateurs serveur (route, pages) qui importaient déjà
// ces helpers depuis "@/lib/anthropic". La logique vit dans sim-phases (module
// neutre, testable sans "server-only").
export { CLOSING_RUBRICS, DISCOVERY_RUBRICS, closingNodes, firstClosingIndex, simPhases } from "./sim-phases";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

export type SimOption = { text: string; quality: "good" | "ok" | "bad"; feedback: string };
export type SimTurn = { artisanLine: string; options: SimOption[] };

export function hasAnthropic(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function customScenario(persona: Scenario["persona"]): Scenario {
  return { id: "custom", persona, difficulty: 2, phases: DISCOVERY_RUBRICS };
}

export type SimHistoryItem = { role: "artisan" | "commercial"; text: string };

function systemPrompt(scenario: Scenario, node: PhaseNode): string {
  const p = scenario.persona;
  return [
    `Tu es un artisan français (${p.metier} à ${p.ville}). Humeur: ${p.humeur}. Contexte: ${p.contexte}.`,
    `Un commercial t'appelle pour te vendre un site web à 300€. Tu réponds de façon RÉALISTE, familière, parfois sceptique — comme un vrai artisan au téléphone. Phrases courtes.`,
    ``,
    `RÈGLE ABSOLUE — tu n'as JAMAIS un temps d'avance :`,
    `- "artisanLine" est UNIQUEMENT ta réaction à la toute dernière réplique du commercial dans l'historique. Rien d'autre.`,
    `- Tu ne réponds jamais à une question qu'il n'a pas encore posée, et tu ne révèles jamais spontanément une info (comment tu trouves tes clients, tes problèmes, tes envies, le budget…) qu'il n'a pas encore cherché à obtenir.`,
    `- S'il vient seulement d'ouvrir l'appel ou de changer de sujet, reste bref/évasif et laisse-le poser SA question.`,
    ``,
    `Phase à venir de l'appel: "${node.phase}". Ce que le commercial va chercher à faire maintenant: ${node.objectif}.`,
    `Une bonne réplique du commercial doit: ${node.bonneIntention}.`,
    ``,
    `Tu dois répondre UNIQUEMENT par un objet JSON valide, sans texte autour, de la forme:`,
    `{"artisanLine": "<ta réaction à la dernière réplique du commercial, 1-3 phrases>", "options": [`,
    `  {"text":"<réplique commercial qui suit parfaitement la bonne intention>","quality":"good","feedback":"<pourquoi c'est la meilleure>"},`,
    `  {"text":"<réplique acceptable mais imparfaite>","quality":"ok","feedback":"<ce qui manque>"},`,
    `  {"text":"<réplique faible/erreur classique>","quality":"bad","feedback":"<pourquoi c'est mauvais>"}`,
    `]}`,
    `Les 3 options sont les PROCHAINES répliques possibles du commercial (pas encore prononcées), à la 1ère personne, en français, plausibles et distinctes. Exactement une "good".`,
  ].join("\n");
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("pas de JSON dans la réponse");
  return JSON.parse(text.slice(start, end + 1));
}

function validateTurn(raw: unknown): SimTurn {
  const o = raw as Partial<SimTurn>;
  if (!o || typeof o.artisanLine !== "string" || !Array.isArray(o.options))
    throw new Error("structure JSON invalide");
  const options = o.options
    .filter((x): x is SimOption => !!x && typeof x.text === "string")
    .map((x) => ({
      text: x.text,
      quality: (["good", "ok", "bad"].includes(x.quality) ? x.quality : "ok") as SimOption["quality"],
      feedback: typeof x.feedback === "string" ? x.feedback : "",
    }));
  if (options.length < 2) throw new Error("pas assez d'options");
  return { artisanLine: o.artisanLine, options };
}

/** Un tour de simulateur via Haiku. Lance une exception en cas d'échec (le caller gère le fallback). */
export async function simTurn(
  scenario: Scenario,
  node: PhaseNode,
  history: SimHistoryItem[]
): Promise<SimTurn> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const convo = history
    .map((h) => `${h.role === "artisan" ? "Artisan" : "Commercial"}: ${h.text}`)
    .join("\n");

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 900,
    system: systemPrompt(scenario, node),
    messages: [
      {
        role: "user",
        content:
          (convo ? `Historique de l'appel (du plus ancien au plus récent):\n${convo}\n\n` : "") +
          (history.length === 0
            ? `C'est le tout début de l'appel : tu viens de décrocher, tu ne sais pas encore qui t'appelle. Réponds SIMPLEMENT, juste un décroché du genre « Allô ? Oui, c'est pour quoi ? ». Aucune objection, aucun avis, aucune info sur ton activité : tu laisses le commercial se lancer. Ton attitude (${scenario.persona.humeur}) ne ressortira qu'APRÈS, en réaction à ce qu'il dira.\n`
            : `Réagis MAINTENANT à la dernière réplique du commercial ci-dessus, sans rien anticiper de ce qu'il s'apprête à demander.\n`) +
          `Génère le prochain tour (ta réplique + 3 options pour le commercial) au format JSON demandé.`,
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return validateTurn(extractJson(text));
}

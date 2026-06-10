import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  QuizFileSchema,
  ObjectionsFileSchema,
  ScenariosFileSchema,
  FichesFileSchema,
  type QuizItem,
  type Objection,
  type Scenario,
  type Fiche,
} from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

function loadFile<T>(name: string, parse: (raw: unknown) => { items: T[] }): T[] {
  try {
    const p = path.join(CONTENT_DIR, name);
    if (!fs.existsSync(p)) return [];
    const raw = JSON.parse(fs.readFileSync(p, "utf8"));
    return parse(raw).items;
  } catch (e) {
    console.error(`[content] échec chargement ${name}:`, e);
    return [];
  }
}

// Parcours : "web" (sites web, fichiers historiques) ou "ads" (Google Ads, fichiers `-ads`).
export type Offer = "web" | "ads";
const FILES: Record<Offer, { quiz: string; objections: string; scenarios: string }> = {
  web: { quiz: "quiz.json", objections: "objections.json", scenarios: "scenarios.json" },
  ads: { quiz: "quiz-ads.json", objections: "objections-ads.json", scenarios: "scenarios-ads.json" },
};

// Cache module-level par offre (rechargé à chaque process ; suffisant pour ce projet).
const _quiz: Partial<Record<Offer, QuizItem[]>> = {};
const _objections: Partial<Record<Offer, Objection[]>> = {};
const _scenarios: Partial<Record<Offer, Scenario[]>> = {};
let _fiches: Fiche[] | null = null;

export function getQuiz(offer: Offer = "web"): QuizItem[] {
  if (!_quiz[offer]) _quiz[offer] = loadFile(FILES[offer].quiz, (r) => QuizFileSchema.parse(r));
  return _quiz[offer]!;
}

export function getObjections(offer: Offer = "web"): Objection[] {
  if (!_objections[offer])
    _objections[offer] = loadFile(FILES[offer].objections, (r) => ObjectionsFileSchema.parse(r));
  return _objections[offer]!;
}

export function getScenarios(offer: Offer = "web"): Scenario[] {
  if (!_scenarios[offer])
    _scenarios[offer] = loadFile(FILES[offer].scenarios, (r) => ScenariosFileSchema.parse(r));
  return _scenarios[offer]!;
}

export function getScenario(id: string, offer: Offer = "web"): Scenario | undefined {
  return getScenarios(offer).find((s) => s.id === id);
}

export function getFiches(): Fiche[] {
  if (!_fiches) _fiches = loadFile("fiches.json", (r) => FichesFileSchema.parse(r));
  return _fiches;
}

export function getDailyObjection(dateStr: string, offer: Offer = "web"): Objection | undefined {
  const objs = getObjections(offer);
  if (!objs.length) return undefined;
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  return objs[h % objs.length];
}

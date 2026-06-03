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

// Cache module-level (rechargé à chaque process ; suffisant pour ce projet).
let _quiz: QuizItem[] | null = null;
let _objections: Objection[] | null = null;
let _scenarios: Scenario[] | null = null;
let _fiches: Fiche[] | null = null;

export function getQuiz(): QuizItem[] {
  if (!_quiz) _quiz = loadFile("quiz.json", (r) => QuizFileSchema.parse(r));
  return _quiz;
}

export function getObjections(): Objection[] {
  if (!_objections)
    _objections = loadFile("objections.json", (r) => ObjectionsFileSchema.parse(r));
  return _objections;
}

export function getScenarios(): Scenario[] {
  if (!_scenarios)
    _scenarios = loadFile("scenarios.json", (r) => ScenariosFileSchema.parse(r));
  return _scenarios;
}

export function getScenario(id: string): Scenario | undefined {
  return getScenarios().find((s) => s.id === id);
}

export function getFiches(): Fiche[] {
  if (!_fiches) _fiches = loadFile("fiches.json", (r) => FichesFileSchema.parse(r));
  return _fiches;
}

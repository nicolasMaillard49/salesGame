import { z } from "zod";
import { ALL_SKILLS, LEGACY_SKILLS, PHASE_SKILLS } from "../types";

const skillId = z.enum(ALL_SKILLS);
// Un nœud de phase peut porter une compétence jouable (PHASE_SKILLS) ou la
// compétence héritée `prix_close` : les scénarios la conservent comme dernier
// nœud, d'où l'on extrait l'objection-clé du persona pour le closing détaillé.
const phaseSkill = z.enum([...PHASE_SKILLS, ...LEGACY_SKILLS]);
const difficulty = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const quality = z.enum(["good", "ok", "bad"]);

export const QuizItemSchema = z.object({
  id: z.string(),
  skill: skillId,
  type: z.enum(["qcm", "trou"]),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  answer: z.union([z.number(), z.string()]),
  explanation: z.string(),
  difficulty,
});

export const ObjectionOptionSchema = z.object({
  text: z.string(),
  quality,
  feedback: z.string(),
});

export const ObjectionSchema = z.object({
  id: skillId,
  label: z.string(),
  artisanLine: z.string(),
  options: z.array(ObjectionOptionSchema).min(2),
  difficulty,
});

export const PhaseNodeSchema = z.object({
  phase: phaseSkill,
  objectif: z.string(),
  artisanSeed: z.string().optional(),
  bonneIntention: z.string(),
});

export const ScenarioSchema = z.object({
  id: z.string(),
  persona: z.object({
    metier: z.string(),
    ville: z.string(),
    humeur: z.string(),
    contexte: z.string(),
  }),
  difficulty,
  phases: z.array(PhaseNodeSchema).min(1),
});

export const FicheSchema = z.object({
  id: z.string(),
  category: z.enum(["ouverture", "decouverte", "closing", "objection", "phase", "mindset"]),
  title: z.string(),
  summary: z.string(),
  points: z.array(z.string()).min(1),
  example: z.string().optional(),
  // Plusieurs phrases-exemples prêtes à dire (mot-à-mot), affichées en liste.
  examples: z.array(z.string()).optional(),
});

export const QuizFileSchema = z.object({ items: z.array(QuizItemSchema) });
export const ObjectionsFileSchema = z.object({ items: z.array(ObjectionSchema) });
export const ScenariosFileSchema = z.object({ items: z.array(ScenarioSchema) });
export const FichesFileSchema = z.object({ items: z.array(FicheSchema) });

export type QuizItem = z.infer<typeof QuizItemSchema>;
export type Fiche = z.infer<typeof FicheSchema>;
export type Objection = z.infer<typeof ObjectionSchema>;
export type ObjectionOption = z.infer<typeof ObjectionOptionSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type PhaseNode = z.infer<typeof PhaseNodeSchema>;

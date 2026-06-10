import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  QuizFileSchema,
  ObjectionsFileSchema,
  ScenariosFileSchema,
  FichesFileSchema,
} from "@/lib/content/schema";
import { ADS_OBJECTION_SKILLS, CLOSING_SKILLS, DISCOVERY_SKILLS, OBJECTION_SKILLS } from "@/lib/types";
import { ADS_BOSSES } from "@/lib/bosses";
import { simPhases } from "@/lib/sim-phases";

const dir = path.join(process.cwd(), "content");
const read = (n: string) => JSON.parse(fs.readFileSync(path.join(dir, n), "utf8"));

describe("contenu — schémas", () => {
  it("quiz.json est valide", () => {
    const data = QuizFileSchema.parse(read("quiz.json"));
    expect(data.items.length).toBeGreaterThan(0);
  });

  it("qcm : answer est un index valide dans options", () => {
    const { items } = QuizFileSchema.parse(read("quiz.json"));
    for (const it of items.filter((q) => q.type === "qcm")) {
      expect(Array.isArray(it.options)).toBe(true);
      expect(typeof it.answer).toBe("number");
      expect(it.answer as number).toBeLessThan((it.options ?? []).length);
    }
  });

  it("objections.json est valide", () => {
    const data = ObjectionsFileSchema.parse(read("objections.json"));
    expect(data.items.length).toBeGreaterThan(0);
  });

  it("chaque objection a exactement une option 'good'", () => {
    const { items } = ObjectionsFileSchema.parse(read("objections.json"));
    for (const o of items) {
      const goods = o.options.filter((x) => x.quality === "good").length;
      expect(goods, `objection ${o.id}`).toBe(1);
    }
  });

  it("couvre les objections attendues", () => {
    const { items } = ObjectionsFileSchema.parse(read("objections.json"));
    const ids = new Set(items.map((o) => o.id));
    for (const skill of OBJECTION_SKILLS) expect(ids.has(skill), skill).toBe(true);
  });

  it("scenarios.json est valide et chaque scénario couvre la découverte + un nœud de closing", () => {
    const { items } = ScenariosFileSchema.parse(read("scenarios.json"));
    expect(items.length).toBeGreaterThan(0);
    for (const s of items) {
      const phases = s.phases.map((p) => p.phase);
      for (const ph of DISCOVERY_SKILLS) expect(phases.includes(ph), `${s.id}:${ph}`).toBe(true);
      // L'ancien nœud `prix_close` est conservé : il porte l'objection-clé du persona.
      expect(phases.includes("prix_close"), `${s.id}:prix_close`).toBe(true);
    }
  });

  it("simPhases déroule la découverte puis les 6 étapes de closing détaillées", () => {
    const { items } = ScenariosFileSchema.parse(read("scenarios.json"));
    for (const s of items) {
      const phases = simPhases(s).map((p) => p.phase);
      for (const ph of DISCOVERY_SKILLS) expect(phases.includes(ph), `${s.id}:${ph}`).toBe(true);
      for (const ph of CLOSING_SKILLS) expect(phases.includes(ph), `${s.id}:${ph}`).toBe(true);
      // plus aucune trace de la phase héritée dans les phases jouées
      expect(phases.includes("prix_close" as never), `${s.id}:no-legacy`).toBe(false);
      // le closing arrive bien en fin d'appel
      expect(phases.slice(-6)).toEqual([...CLOSING_SKILLS]);
    }
  });

  it("fiches.json est valide et les ids sont uniques", () => {
    const { items } = FichesFileSchema.parse(read("fiches.json"));
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map((f) => f.id)).size).toBe(items.length);
  });
});

describe("contenu Google Ads (parcours 'ads')", () => {
  it("objections-ads.json est valide, options 'good' uniques, offer=ads", () => {
    const { items } = ObjectionsFileSchema.parse(read("objections-ads.json"));
    expect(items.length).toBeGreaterThan(0);
    for (const o of items) {
      expect(o.options.filter((x) => x.quality === "good").length, `objection ${o.id}`).toBe(1);
      expect(o.offer, `offer ${o.id}`).toBe("ads");
    }
  });

  it("les objections-ads couvrent les skills utilisés par les boss Ads", () => {
    const { items } = ObjectionsFileSchema.parse(read("objections-ads.json"));
    const ids = new Set(items.map((o) => o.id));
    for (const skill of ADS_OBJECTION_SKILLS) expect(ids.has(skill), skill).toBe(true);
    const needed = new Set(ADS_BOSSES.flatMap((b) => b.objections));
    for (const skill of needed) expect(ids.has(skill), `boss requiert ${skill}`).toBe(true);
  });

  it("quiz-ads.json est valide, ids uniques, answer index valide, offer=ads", () => {
    const { items } = QuizFileSchema.parse(read("quiz-ads.json"));
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map((q) => q.id)).size, "ids uniques").toBe(items.length);
    for (const it of items) {
      expect(it.offer, `offer ${it.id}`).toBe("ads");
      if (it.type === "qcm") {
        expect(Array.isArray(it.options)).toBe(true);
        expect(typeof it.answer).toBe("number");
        expect(it.answer as number).toBeLessThan((it.options ?? []).length);
      }
    }
  });

  it("scenarios-ads.json : découverte + closing complets via simPhases", () => {
    const { items } = ScenariosFileSchema.parse(read("scenarios-ads.json"));
    expect(items.length).toBeGreaterThan(0);
    for (const s of items) {
      expect(s.offer, `offer ${s.id}`).toBe("ads");
      const phases = simPhases(s).map((p) => p.phase);
      for (const ph of DISCOVERY_SKILLS) expect(phases.includes(ph), `${s.id}:${ph}`).toBe(true);
      for (const ph of CLOSING_SKILLS) expect(phases.includes(ph), `${s.id}:${ph}`).toBe(true);
      expect(phases.slice(-6)).toEqual([...CLOSING_SKILLS]);
    }
  });
});

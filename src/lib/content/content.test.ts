import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  QuizFileSchema,
  ObjectionsFileSchema,
  ScenariosFileSchema,
  FichesFileSchema,
} from "@/lib/content/schema";
import { OBJECTION_SKILLS, PHASE_SKILLS } from "@/lib/types";

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

  it("scenarios.json est valide et chaque scénario couvre les 7 phases", () => {
    const { items } = ScenariosFileSchema.parse(read("scenarios.json"));
    expect(items.length).toBeGreaterThan(0);
    for (const s of items) {
      const phases = s.phases.map((p) => p.phase);
      for (const ph of PHASE_SKILLS) expect(phases.includes(ph), `${s.id}:${ph}`).toBe(true);
    }
  });

  it("fiches.json est valide et les ids sont uniques", () => {
    const { items } = FichesFileSchema.parse(read("fiches.json"));
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items.map((f) => f.id)).size).toBe(items.length);
  });
});

import { describe, it, expect } from "vitest";
import { seededPick, seededShuffle } from "./seed";

const items = Array.from({ length: 20 }, (_, i) => i);

describe("seed (duel)", () => {
  it("même seed => exactement le même tirage", () => {
    expect(seededPick(items, 123, 5)).toEqual(seededPick(items, 123, 5));
    expect(seededShuffle(items, 7)).toEqual(seededShuffle(items, 7));
  });
  it("seeds différents => tirages différents", () => {
    expect(seededPick(items, 1, 5)).not.toEqual(seededPick(items, 2, 5));
  });
  it("ne mute pas l'entrée et respecte la taille demandée", () => {
    const copy = [...items];
    const r = seededPick(items, 9, 5);
    expect(items).toEqual(copy);
    expect(r).toHaveLength(5);
  });
});

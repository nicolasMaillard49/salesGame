import { describe, it, expect } from "vitest";
import {
  xpForAnswer,
  rankForXp,
  progressToNextRank,
  updateMastery,
  isWeak,
  unlockedDifficulty,
  isUnlocked,
  weakSkills,
  nextStreak,
  decayedScore,
  masteryLevel,
  dailyIndex,
} from "./progression";

describe("xpForAnswer", () => {
  it("récompense good > ok > bad", () => {
    expect(xpForAnswer("good")).toBeGreaterThan(xpForAnswer("ok"));
    expect(xpForAnswer("ok")).toBeGreaterThan(xpForAnswer("bad"));
    expect(xpForAnswer("bad")).toBe(0);
  });
  it("pondère par la difficulté", () => {
    expect(xpForAnswer("good", 1)).toBe(10);
    expect(xpForAnswer("good", 2)).toBe(15);
    expect(xpForAnswer("good", 3)).toBe(20);
  });
});

describe("rankForXp", () => {
  it("retourne le bon rang", () => {
    expect(rankForXp(0).name).toBe("Débutant");
    expect(rankForXp(199).name).toBe("Débutant");
    expect(rankForXp(200).name).toBe("Apprenti");
    expect(rankForXp(600).name).toBe("Closer");
    expect(rankForXp(5000).name).toBe("Légende");
  });
});

describe("progressToNextRank", () => {
  it("calcule le ratio vers le rang suivant", () => {
    const p = progressToNextRank(400);
    expect(p.next).toBe("Closer");
    expect(p.ratio).toBeCloseTo((400 - 200) / (600 - 200));
    expect(p.remaining).toBe(200);
  });
  it("rang max → ratio 1, next null", () => {
    const p = progressToNextRank(4000);
    expect(p.next).toBeNull();
    expect(p.ratio).toBe(1);
  });
});

describe("updateMastery", () => {
  it("premier essai = valeur brute", () => {
    expect(updateMastery({ score: 0, attempts: 0 }, "good").score).toBe(1);
    expect(updateMastery({ score: 0, attempts: 0 }, "bad").score).toBe(0);
  });
  it("moyenne glissante ensuite", () => {
    const m1 = updateMastery({ score: 0, attempts: 0 }, "good"); // 1
    const m2 = updateMastery(m1, "bad"); // 1*0.75 + 0 = 0.75
    expect(m2.score).toBeCloseTo(0.75);
    expect(m2.attempts).toBe(2);
  });
  it("reste borné 0..1", () => {
    let m = { score: 0, attempts: 0 };
    for (let i = 0; i < 20; i++) m = updateMastery(m, "good");
    expect(m.score).toBeLessThanOrEqual(1);
  });
});

describe("isWeak", () => {
  it("faible si score<0.5 et au moins un essai", () => {
    expect(isWeak(0.3, 2)).toBe(true);
    expect(isWeak(0.3, 0)).toBe(false);
    expect(isWeak(0.8, 5)).toBe(false);
  });
});

describe("déblocages", () => {
  it("difficulté débloquée selon XP", () => {
    expect(unlockedDifficulty(0)).toBe(1);
    expect(unlockedDifficulty(600)).toBe(2);
    expect(unlockedDifficulty(1500)).toBe(3);
  });
  it("isUnlocked", () => {
    expect(isUnlocked(2, 0)).toBe(false);
    expect(isUnlocked(2, 600)).toBe(true);
    expect(isUnlocked(1, 0)).toBe(true);
  });
});

describe("weakSkills", () => {
  it("trie les compétences faibles, la plus faible d'abord", () => {
    const res = weakSkills({
      ouverture: { score: 0.9, attempts: 3 },
      douleurs: { score: 0.2, attempts: 4 },
      ambitions: { score: 0.4, attempts: 2 },
      pont: { score: 0.1, attempts: 0 }, // pas encore tenté → ignoré
    });
    expect(res).toEqual(["douleurs", "ambitions"]);
  });
});

describe("nextStreak", () => {
  it("déjà joué aujourd'hui => alreadyDone, série inchangée", () => {
    expect(nextStreak({ streak: 4, lastDay: "2026-01-02" }, "2026-01-02", "2026-01-01")).toEqual({ streak: 4, alreadyDone: true });
  });
  it("joué hier => série +1", () => {
    expect(nextStreak({ streak: 4, lastDay: "2026-01-01" }, "2026-01-02", "2026-01-01")).toEqual({ streak: 5, alreadyDone: false });
  });
  it("trou dans la série => repart à 1", () => {
    expect(nextStreak({ streak: 9, lastDay: "2025-12-30" }, "2026-01-02", "2026-01-01").streak).toBe(1);
    expect(nextStreak({ streak: 0, lastDay: null }, "2026-01-02", "2026-01-01").streak).toBe(1);
  });
});

describe("decayedScore", () => {
  const D = 86_400_000;
  const now = 1_700_000_000_000;
  it("pas de décroissance avant 3 jours", () => {
    expect(decayedScore(0.8, now - 2 * D, now)).toBe(0.8);
    expect(decayedScore(0.8, null, now)).toBe(0.8);
  });
  it("décroît au-delà de 3 jours", () => {
    expect(decayedScore(1, now - 10 * D, now)).toBeCloseTo(0.72); // -4%/j × 7j
  });
  it("plancher à 30 % du score", () => {
    expect(decayedScore(1, now - 365 * D, now)).toBeCloseTo(0.3);
  });
});

describe("masteryLevel", () => {
  it("seuils Bronze/Argent/Or", () => {
    expect(masteryLevel(0.9)?.name).toBe("Or");
    expect(masteryLevel(0.75)?.name).toBe("Argent");
    expect(masteryLevel(0.55)?.name).toBe("Bronze");
    expect(masteryLevel(0.4)).toBeNull();
  });
});

describe("dailyIndex", () => {
  it("déterministe et borné", () => {
    expect(dailyIndex("2026-06-03", 11)).toBe(dailyIndex("2026-06-03", 11));
    expect(dailyIndex("2026-06-03", 11)).toBeGreaterThanOrEqual(0);
    expect(dailyIndex("2026-06-03", 11)).toBeLessThan(11);
  });
});

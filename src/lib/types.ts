// Compétences trackées — clé de voûte du système de maîtrise.
export const PHASE_SKILLS = [
  "ouverture",
  "decouverte",
  "douleurs",
  "ambitions",
  "pont",
  "presentation",
  "prix_close",
] as const;

export const OBJECTION_SKILLS = [
  "obj_reflechir",
  "obj_femme_associe",
  "obj_trop_cher",
  "obj_pas_maintenant",
  "obj_deja_essaye",
  "obj_rappelle",
  "obj_bouche_a_oreille",
  "obj_seul",
  "obj_deja_appele",
  "obj_site_sans_trafic",
  "obj_prix_mail",
] as const;

export const ALL_SKILLS = [...PHASE_SKILLS, ...OBJECTION_SKILLS] as const;

export type SkillId = (typeof ALL_SKILLS)[number];
export type PhaseSkill = (typeof PHASE_SKILLS)[number];

export type Quality = "good" | "ok" | "bad";
export type GameType = "quiz" | "drill" | "sim";

// Libellés FR pour l'affichage.
export const SKILL_LABELS: Record<SkillId, string> = {
  ouverture: "Ouverture",
  decouverte: "Découverte",
  douleurs: "Douleurs",
  ambitions: "Ambitions",
  pont: "Le Pont",
  presentation: "Présentation",
  prix_close: "Prix & Close",
  obj_reflechir: "« Je dois réfléchir »",
  obj_femme_associe: "« J'en parle à ma femme/associé »",
  obj_trop_cher: "« C'est trop cher »",
  obj_pas_maintenant: "« Pas maintenant »",
  obj_deja_essaye: "« J'ai déjà essayé »",
  obj_rappelle: "« Je te rappelle »",
  obj_bouche_a_oreille: "« J'ai le bouche-à-oreille »",
  obj_seul: "« Je bosse seul »",
  obj_deja_appele: "« On m'a déjà appelé »",
  obj_site_sans_trafic: "« Un site sans trafic ça sert à rien »",
  obj_prix_mail: "« Envoyez-moi ça par mail »",
};

export function isSkillId(v: string): v is SkillId {
  return (ALL_SKILLS as readonly string[]).includes(v);
}

import type { SkillId } from "./types";

export type Boss = {
  id: string;
  name: string;
  metier: string;
  hp: number;
  intro: string;
  objections: SkillId[];
};

export const BOSSES: Boss[] = [
  {
    id: "robert",
    name: "Robert le Sceptique",
    metier: "couvreur",
    hp: 4,
    intro: "30 ans de métier, il ne croit pas à « internet ».",
    objections: ["obj_bouche_a_oreille", "obj_deja_essaye", "obj_reflechir"],
  },
  {
    id: "marco",
    name: "Marco qui Raccroche",
    metier: "plombier",
    hp: 5,
    intro: "Toujours pressé, une main sur le téléphone.",
    objections: ["obj_rappelle", "obj_pas_maintenant", "obj_prix_mail", "obj_deja_appele"],
  },
  {
    id: "sandrine",
    name: "Sandrine la Prudente",
    metier: "carreleur",
    hp: 5,
    intro: "Regarde chaque euro à la loupe.",
    objections: ["obj_trop_cher", "obj_site_sans_trafic", "obj_seul", "obj_femme_associe"],
  },
];

export function getBoss(id: string): Boss | undefined {
  return BOSSES.find((b) => b.id === id);
}

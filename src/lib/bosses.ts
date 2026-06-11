import type { Offer, SkillId } from "./types";

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
  {
    id: "patrick",
    name: "Patrick le Démasqueur",
    metier: "électricien",
    hp: 4,
    intro: "Il flaire la prospection au quart de tour et joue à te déstabiliser.",
    objections: ["obj_demasque", "obj_pas_confiance", "obj_deja_appele", "obj_rappelle"],
  },
  {
    id: "gerard",
    name: "Gérard l'Aigri",
    metier: "peintre",
    hp: 6,
    intro: "30 ans de galère, il a une clientèle de quartier et s'en satisfait.",
    objections: ["obj_clientele_pas_internet", "obj_bouche_a_oreille", "obj_deja_essaye", "obj_seul", "obj_reflechir"],
  },
  {
    id: "thierry",
    name: "Thierry le Fantôme",
    metier: "menuisier",
    hp: 5,
    intro: "Il dit oui à tout pendant l'appel puis disparaît au moment du RDV.",
    objections: ["obj_confirmer_rdv", "obj_pas_maintenant", "obj_prix_mail", "obj_rappelle"],
  },
  {
    id: "didier",
    name: "Didier le Possessif",
    metier: "maçon",
    hp: 7,
    intro: "Il a déjà quelqu'un qui gère ça — ou du moins il le croit.",
    objections: ["obj_jai_quelquun", "obj_pas_confiance", "obj_trop_cher", "obj_femme_associe"],
  },
];

// Bosses du parcours Google Ads (cible : artisans qui ont déjà un site).
// Objections fidèles à la formation 10K (prospection P1 + closing semaine test P2).
export const ADS_BOSSES: Boss[] = [
  {
    id: "ads_jeanmi",
    name: "Jean-Mi le Blasé",
    metier: "plombier",
    hp: 5,
    intro: "Il a déjà testé Google Ads tout seul, ça lui a « vidé le budget pour rien ». Et l'informatique, c'est pas son truc.",
    objections: ["obj_ads_deja_essaye", "obj_ads_connais_rien", "obj_ads_reflechir_ads"],
  },
  {
    id: "ads_sylvie",
    name: "Sylvie au Bouche-à-oreille",
    metier: "couvreur",
    hp: 6,
    intro: "« Mes clients viennent par recommandation, j'ai pas besoin de pub. » Elle a déjà quelqu'un qui gère son site.",
    objections: ["obj_ads_boa", "obj_ads_envoyez_mail", "obj_jai_quelquun", "obj_ads_reflechir_ads"],
  },
  {
    id: "ads_kevin",
    name: "Kévin le Premier",
    metier: "électricien",
    hp: 5,
    intro: "« Je suis déjà sur Google » — sur son nom, pas sur son métier. Et il se méfie de « la pub ».",
    objections: ["obj_ads_deja_google", "obj_ads_cest_pub", "obj_bouche_a_oreille"],
  },
  {
    id: "ads_monique",
    name: "Monique la Frileuse",
    metier: "carreleur",
    hp: 6,
    intro: "Le moindre euro à sortir la bloque, et Google « c'est trop compliqué » pour elle.",
    objections: ["obj_ads_budget_100", "obj_ads_connais_rien", "obj_ads_assez_boulot", "obj_ads_reflechir_ads"],
  },
  {
    id: "ads_pascal",
    name: "Pascal le Méfiant",
    metier: "maçon",
    hp: 7,
    intro: "Il a vu les résultats du test, mais le forfait mensuel le fait grimacer et il flaire le piège.",
    objections: ["obj_ads_prix_750", "obj_ads_budget_100", "obj_ads_deja_essaye", "obj_pas_confiance", "obj_demasque"],
  },
];

export function getBosses(offer: Offer = "web"): Boss[] {
  return offer === "ads" ? ADS_BOSSES : BOSSES;
}

export function getBoss(id: string): Boss | undefined {
  return [...BOSSES, ...ADS_BOSSES].find((b) => b.id === id);
}

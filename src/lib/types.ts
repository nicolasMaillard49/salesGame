// Compétences trackées — clé de voûte du système de maîtrise.
// Bloc 1 : la découverte (du décroché au pont/présentation).
export const DISCOVERY_SKILLS = [
  "ouverture",
  "decouverte",
  "douleurs",
  "ambitions",
  "pont",
  "presentation",
] as const;

// Bloc 2 : le closing, décomposé en 6 étapes fines (la partie la plus dure).
export const CLOSING_SKILLS = [
  "pre_close",
  "annonce_prix",
  "close_direct",
  "isoler_frein",
  "relance_projection",
  "verrou_paiement",
] as const;

export const PHASE_SKILLS = [...DISCOVERY_SKILLS, ...CLOSING_SKILLS] as const;

// Anciennes compétences, plus jouées mais conservées pour ne pas casser
// les sessions déjà enregistrées (labels + validation côté API).
export const LEGACY_SKILLS = ["prix_close"] as const;

export const PROSPECTION_SKILLS = [
  "ouverture_froide",
  "prise_rdv",
  "reprendre_lead",
  "pitch_site",
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
  "obj_demasque",
  "obj_pas_confiance",
  "obj_jai_quelquun",
  "obj_clientele_pas_internet",
  "obj_confirmer_rdv",
] as const;

// Objections propres à l'offre Google Ads (cible : artisans qui ont déjà un site).
export const ADS_OBJECTION_SKILLS = [
  "obj_ads_jai_agence",
  "obj_ads_marche_pas",
  "obj_ads_budget_pub",
  "obj_ads_deja_premier",
  "obj_ads_trop_complique",
  "obj_ads_arnaque_google",
] as const;

export const ALL_SKILLS = [
  ...PHASE_SKILLS,
  ...PROSPECTION_SKILLS,
  ...OBJECTION_SKILLS,
  ...ADS_OBJECTION_SKILLS,
  ...LEGACY_SKILLS,
] as const;

export type SkillId = (typeof ALL_SKILLS)[number];
export type PhaseSkill = (typeof PHASE_SKILLS)[number];
export type ClosingSkill = (typeof CLOSING_SKILLS)[number];

export type Quality = "good" | "ok" | "bad";
export type GameType = "quiz" | "drill" | "sim";

// Offre commerciale : deux parcours de formation parallèles.
export type Offer = "web" | "ads";
export const OFFERS: readonly Offer[] = ["web", "ads"] as const;
export const OFFER_COOKIE = "sg-offer";
export function isOffer(v: string | undefined | null): v is Offer {
  return v === "web" || v === "ads";
}
export const OFFER_LABELS: Record<Offer, string> = { web: "Sites Web", ads: "Google Ads" };

// Libellés FR pour l'affichage.
export const SKILL_LABELS: Record<SkillId, string> = {
  ouverture: "Ouverture",
  decouverte: "Découverte",
  douleurs: "Douleurs",
  ambitions: "Ambitions",
  pont: "Le Pont",
  presentation: "Présentation",
  pre_close: "Pré-close",
  annonce_prix: "Annonce du prix",
  close_direct: "Close + silence",
  isoler_frein: "Isoler le frein",
  relance_projection: "Relance (projection)",
  verrou_paiement: "Verrou & paiement",
  prix_close: "Prix & Close",
  ouverture_froide: "Ouverture à froid",
  prise_rdv: "Prise de RDV",
  reprendre_lead: "Reprendre le lead",
  pitch_site: "Pitch du site",
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
  obj_demasque: "« C'est de la prospection ça ! »",
  obj_pas_confiance: "« Payer sur internet, j'ai pas confiance »",
  obj_jai_quelquun: "« J'ai déjà quelqu'un qui gère ça »",
  obj_clientele_pas_internet: "« Ma clientèle n'est pas sur internet »",
  obj_confirmer_rdv: "« Finalement j'ai pas le temps pour le RDV »",
  // Objections Google Ads
  obj_ads_jai_agence: "« J'ai déjà une agence pour ma pub »",
  obj_ads_marche_pas: "« Google Ads ça marche pas »",
  obj_ads_budget_pub: "« Encore un budget pub en plus »",
  obj_ads_deja_premier: "« Je suis déjà bien placé sur Google »",
  obj_ads_trop_complique: "« Google c'est trop compliqué pour moi »",
  obj_ads_arnaque_google: "« Google c'est de l'arnaque, ça vide le budget »",
};

export function isSkillId(v: string): v is SkillId {
  return (ALL_SKILLS as readonly string[]).includes(v);
}

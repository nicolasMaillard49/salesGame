import type { PhaseNode, Scenario } from "./content/schema";
import { DISCOVERY_SKILLS } from "./types";

// Construction des phases jouées dans le simulateur. Module neutre (pas de
// "server-only") pour être importable côté serveur ET dans les tests.

// Rubrics génériques de la découverte (du décroché à la présentation).
export const DISCOVERY_RUBRICS: PhaseNode[] = [
  { phase: "ouverture", objectif: "Créer le lien, détendre, ne pas vendre tout de suite.", bonneIntention: "ouvrir avec décontraction et capter son attention sans pitcher." },
  { phase: "decouverte", objectif: "Comprendre comment il trouve ses clients aujourd'hui.", bonneIntention: "poser une question ouverte et écouter sans couper." },
  { phase: "douleurs", objectif: "Faire émerger la vraie douleur (irrégularité, dépendance, manque de visibilité).", bonneIntention: "creuser la douleur avec ses mots, sans rien suggérer." },
  { phase: "ambitions", objectif: "Faire exprimer ce qu'il veut vraiment (stabilité, choisir ses chantiers, image).", bonneIntention: "poser une question ouverte et le laisser se projeter." },
  { phase: "pont", objectif: "Reformuler douleur + ambition avec ses mots et lui faire valider.", bonneIntention: "créer l'accord sur le problème avant de présenter le site." },
  { phase: "presentation", objectif: "Présenter le site comme la réponse évidente à SA situation.", bonneIntention: "relier le site à sa douleur/ambition, pas un argumentaire générique." },
];

// Rubrics du CLOSING décomposé en 6 étapes fines — la partie la plus dure de l'appel.
// Ces étapes sont communes à tous les prospects (la chorégraphie du closing est
// universelle) ; ce qui change d'un persona à l'autre, c'est l'objection soulevée,
// injectée via `closingNodes(hint)`.
export const CLOSING_RUBRICS: PhaseNode[] = [
  {
    phase: "pre_close",
    objectif: "Faire valider l'intérêt AVANT de parler argent : « si c'était ton site, ça pourrait t'amener des demandes ? ».",
    bonneIntention: "relier le site à SA situation et arracher un « oui ça m'aiderait » — ne lâcher le prix qu'après cette validation.",
  },
  {
    phase: "annonce_prix",
    objectif: "Annoncer 299€ avec l'ancrage agence (1000-3000€) et le ROI (un seul chantier capté = rentabilisé).",
    bonneIntention: "ancrer la valeur AVANT le chiffre, annoncer le prix avec assurance, enchaîner sur le ROI, sans s'excuser ni ouvrir la négo.",
  },
  {
    phase: "close_direct",
    objectif: "Poser le close direct (« On l'active pour ton activité ? ») puis se taire — la prochaine personne qui parle a perdu.",
    bonneIntention: "demander l'engagement par UNE question d'action fermée, puis laisser le silence travailler sans meubler ni re-pitcher.",
  },
  {
    phase: "isoler_frein",
    objectif: "Face à l'hésitation, isoler le vrai frein (« qu'est-ce qui te bloque exactement ? à part ça, c'est oui ? ») avant de répondre.",
    bonneIntention: "ne jamais dire « prends ton temps » : faire sortir et isoler la vraie objection, et valider que sinon c'est gagné.",
  },
  {
    phase: "relance_projection",
    objectif: "Relancer un prospect encore tiède par une projection émotionnelle (Inaction vs Action, Détachement, ou Escalier de projection).",
    bonneIntention: "créer le contraste rester/agir ou faire vivre le futur étape par étape, calmement, pour forcer la décision sans agresser ni brader.",
  },
  {
    phase: "verrou_paiement",
    objectif: "Transformer le « oui » en acte : ne pas re-vendre, passer direct au paiement (carte ou virement, lien, numéro).",
    bonneIntention: "après le oui, ne pas célébrer ni rajouter de friction : verrouiller par une question logistique fermée qui acte la vente.",
  },
];

// Les étapes du closing où l'on confronte une objection : on y injecte l'objection
// propre au persona pour que l'artisan la soulève au bon moment.
const HINT_PHASES = new Set<string>(["isoler_frein", "relance_projection"]);

/** Les 6 étapes du closing, avec l'objection du persona injectée là où c'est utile. */
export function closingNodes(hint?: string): PhaseNode[] {
  const clean = hint?.trim();
  return CLOSING_RUBRICS.map((n) =>
    clean && HINT_PHASES.has(n.phase)
      ? { ...n, objectif: `${n.objectif} (Ce prospect a tendance à objecter : « ${clean} ».)` }
      : { ...n }
  );
}

/** Nombre de phases de découverte présentes dans le scénario (= indice de la 1re étape de closing). */
export function firstClosingIndex(scenario: Scenario): number {
  return scenario.phases.filter((p) =>
    (DISCOVERY_SKILLS as readonly string[]).includes(p.phase)
  ).length;
}

/**
 * Phases effectivement jouées dans le simulateur : la découverte du scénario
 * suivie de la séquence de closing détaillée (6 étapes). L'ancien nœud unique
 * `prix_close` du scénario n'est plus joué tel quel : il sert de source pour
 * l'objection-clé du persona, réinjectée dans les étapes de closing.
 */
export function simPhases(scenario: Scenario): PhaseNode[] {
  const discovery = scenario.phases.filter((p) =>
    (DISCOVERY_SKILLS as readonly string[]).includes(p.phase)
  );
  const legacyClose = scenario.phases.find((p) => p.phase === "prix_close");
  const hint = legacyClose?.artisanSeed ?? legacyClose?.objectif;
  return [...discovery, ...closingNodes(hint)];
}

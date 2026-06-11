import type { PhaseNode, Scenario } from "./content/schema";
import { DISCOVERY_SKILLS, type Offer } from "./types";

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

// --- Parcours Google Ads (cible : artisans qui ont DÉJÀ un site) ---
// Offre : semaine test Google Ads GRATUITE (seul un petit budget pub ~100€ est
// payé directement à Google), puis commission mensuelle si ça performe.
export const ADS_DISCOVERY_RUBRICS: PhaseNode[] = [
  { phase: "ouverture", objectif: "Désamorcer la méfiance en 5 secondes, créer le lien, ne pas pitcher.", bonneIntention: "ouvrir avec décontraction/humour et capter son attention sans dérouler l'offre." },
  { phase: "decouverte", objectif: "Comprendre d'où viennent ses clients aujourd'hui et ce que son site lui rapporte.", bonneIntention: "poser une question ouverte sur sa source de clients et écouter sans suggérer." },
  { phase: "douleurs", objectif: "Faire émerger que son site est une vitrine sans visiteurs / qu'il dépend du bouche-à-oreille, sans demandes entrantes régulières.", bonneIntention: "creuser le manque de demandes entrantes avec ses mots, sans rien suggérer." },
  { phase: "ambitions", objectif: "Faire exprimer ce qu'il veut (plus de demandes régulières, être visible quand on cherche son métier, remplir l'agenda).", bonneIntention: "poser une question ouverte et le laisser se projeter sur plus de chantiers." },
  { phase: "pont", objectif: "Reformuler « ton site est une belle vitrine mais personne ne la voit ; tu veux des demandes régulières » et faire valider.", bonneIntention: "créer l'accord sur le problème (site sans trafic) avant de présenter Google Ads." },
  { phase: "presentation", objectif: "Présenter la semaine test Google Ads comme la réponse : apparaître en haut de Google quand on cherche son métier + sa ville.", bonneIntention: "relier Google Ads à SA situation (site sans trafic), pas un argumentaire générique." },
];

export const ADS_CLOSING_RUBRICS: PhaseNode[] = [
  { phase: "pre_close", objectif: "Faire valider l'intérêt AVANT le prix, après le diagnostic : « si demain on te met en tête de Google sur ton service le plus rentable, ça pourrait te ramener des demandes ? ».", bonneIntention: "relier Google Ads à SA situation (son service prioritaire, sa zone) et arracher un « oui ça m'aiderait » avant d'évoquer le moindre chiffre." },
  { phase: "annonce_prix", objectif: "Annoncer les chiffres DANS L'ORDRE : 1) la semaine test, notre service est GRATUIT ; 2) seul un petit budget pub ~100€ (10-15€/jour) payé directement à Google ; 3) si tu continues après les résultats, forfait gestion 750€/mois TTC — décidé APRÈS le test.", bonneIntention: "ancrer la valeur (un seul chantier capté rentabilise), dérouler gratuit → ~100€ Google → 750€/mois TTC avec assurance, puis silence après le prix sans s'excuser ni justifier." },
  { phase: "close_direct", objectif: "Poser LE close (« C'est bon pour toi tout ça ? ») puis se taire totalement — la prochaine personne qui parle a perdu.", bonneIntention: "demander l'engagement par UNE question fermée, puis laisser le silence travailler sans meubler." },
  { phase: "isoler_frein", objectif: "Face à l'hésitation, isoler le vrai frein (« qu'est-ce qui te bloque exactement ? à part ça, c'est oui ? ») avant de répondre.", bonneIntention: "faire sortir et isoler la vraie objection, et valider que sinon c'est gagné." },
  { phase: "relance_projection", objectif: "Relancer un prospect tiède par le recadrage « prix de savoir » : le pire scénario c'est 100€ pour être fixé ; sans test, sa situation reste exactement comme aujourd'hui pendant que ses concurrents captent les recherches Google.", bonneIntention: "créer le contraste inaction/action et reframer sur « est-ce que je veux changer ma situation ou pas », calmement, sans agresser ni brader." },
  { phase: "verrou_paiement", objectif: "Transformer le « oui » en acte : faire remplir le formulaire Google Ads PENDANT l'appel (2 min) pour l'expert, sans re-vendre.", bonneIntention: "après le oui, ne pas célébrer : verrouiller par une question logistique fermée (« t'as 2 minutes pour le remplir là maintenant pendant qu'on est en ligne ? ») qui acte le lancement." },
];

// Les étapes du closing où l'on confronte une objection : on y injecte l'objection
// propre au persona pour que l'artisan la soulève au bon moment.
const HINT_PHASES = new Set<string>(["isoler_frein", "relance_projection"]);

/** Les 6 étapes du closing (selon l'offre), avec l'objection du persona injectée. */
export function closingNodes(hint?: string, offer: Offer = "web"): PhaseNode[] {
  const base = offer === "ads" ? ADS_CLOSING_RUBRICS : CLOSING_RUBRICS;
  const clean = hint?.trim();
  return base.map((n) =>
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
  return [...discovery, ...closingNodes(hint, scenario.offer)];
}

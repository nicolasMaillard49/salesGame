import type { PhaseNode, Scenario } from "./content/schema";
import type { PhaseSkill } from "./types";
import type { SimOption, SimTurn } from "./anthropic";

/**
 * Fallback du simulateur (mode démo, sans clé Anthropic).
 *
 * Objectif : sans IA, l'appel doit rester un VRAI exercice — pas une réponse
 * pré-mâchée. Donc :
 *  - aucune option n'annonce qu'elle est la bonne (plus de préfixe "(Suivre l'objectif)") ;
 *  - les répliques sont des phrases réellement prononçables par le commercial,
 *    spécifiques à la phase ET au persona (métier / ville) ;
 *  - plusieurs variantes par phase → deux parties ne se ressemblent pas ;
 *  - l'ordre des options est mélangé → la "good" n'est pas toujours en A.
 */

type Tone = { good: string; ok: string; bad: string };
type PhaseBank = { options: Tone[]; feedback: Tone };

// Réplique avec le métier en minuscule ("plombier") et la ville telle quelle.
function fill(line: string, p: Scenario["persona"]): string {
  const metier = p.metier.trim().toLowerCase();
  return line.replaceAll("{metier}", metier).replaceAll("{ville}", p.ville.trim());
}

const BANK: Record<PhaseSkill, PhaseBank> = {
  ouverture: {
    options: [
      {
        good: "Je vais être cash : c'est de la prospection. Mais raccrochez pas tout de suite — j'ai déjà préparé un exemple de site pour un {metier}, je vous le montre dans 5 minutes. Avant ça, juste deux questions ?",
        ok: "Bonjour, je vous appelle parce qu'on fait des sites internet pour les artisans. Est-ce que ça pourrait vous intéresser ?",
        bad: "Bonjour ! J'ai une offre exceptionnelle de site à 299€ rien que pour les {metier} de {ville}, c'est exactement ce qu'il vous faut !",
      },
      {
        good: "Vous êtes en plein boulot, je respecte — je vais à l'essentiel. J'ai regardé votre activité et je vous ai déjà monté quelque chose. Deux questions rapides et je vous montre, ça vous va ?",
        ok: "Allô oui bonjour, vous avez deux minutes ? Je voulais vous parler de votre présence sur internet.",
        bad: "Bonjour, alors voilà, on est numéro un du site web pour artisans, laissez-moi vous présenter toutes nos formules.",
      },
    ],
    feedback: {
      good: "Honnêteté + accroche + on annonce un site déjà créé, sans pitcher : on gagne les 10 secondes d'attention.",
      ok: "Pas faux, mais tu demandes une permission molle ('ça vous intéresse ?') au lieu de capter l'attention.",
      bad: "Tu balances le prix et le pitch avant d'avoir créé le moindre lien : il décroche mentalement.",
    },
  },

  decouverte: {
    options: [
      {
        good: "Avant que je vous montre quoi que ce soit — aujourd'hui vos clients, ils arrivent comment ? Et si demain vous vouliez plus de chantiers, vous pouvez actionner un levier ou vous attendez que ça tombe ?",
        ok: "D'accord. Et vous avez déjà un site internet pour le moment ?",
        bad: "Bref, avec un site vous auriez beaucoup plus de clients, je vous explique comment ça marche.",
      },
      {
        good: "Juste pour comprendre votre situation : le bouche-à-oreille c'est régulier ou il y a des trous ? Vous avez la main dessus, ou ça dépend des autres ?",
        ok: "Et niveau clients en ce moment, ça va, vous en avez assez ?",
        bad: "De toute façon le bouche-à-oreille c'est dépassé aujourd'hui, faut être sur internet, point.",
      },
    ],
    feedback: {
      good: "Question ouverte sur l'acquisition + on teste sa dépendance : on récolte la matière pour la suite sans changer de sujet.",
      ok: "Question fermée qui se répond par oui/non : tu n'apprends rien d'exploitable.",
      bad: "Tu pitches la solution avant d'avoir compris son problème : tu brûles la découverte.",
    },
  },

  douleurs: {
    options: [
      {
        good: "Quand c'est plus calme, ça se passe comment pour vous ? Vous le vivez comment, ces périodes-là ?",
        ok: "Donc en gros vous aimeriez avoir un peu plus de clients, c'est ça ?",
        bad: "C'est clair que sans site vous perdez des clients tous les jours, faut vraiment régler ça vite.",
      },
      {
        good: "Vous me dites que les gens trouvent parfois quelqu'un d'autre — ça vous fait quoi quand ça arrive ? Ça vous est arrivé combien de fois cette année ?",
        ok: "Et ça vous embête un peu cette histoire de périodes creuses, non ?",
        bad: "À votre place je serais inquiet, vous laissez clairement de l'argent sur la table là.",
      },
    ],
    feedback: {
      good: "Tu creuses le ressenti avec ses mots, sans rien suggérer : la douleur sort d'elle-même, prête pour le pont.",
      ok: "Tu suggères la douleur à sa place ('un peu plus de clients') : c'est tiède et c'est toi qui parles.",
      bad: "Tu dramatises et tu projettes : il se braque au lieu de reconnaître la douleur.",
    },
  },

  ambitions: {
    options: [
      {
        good: "Et si vous aviez ces chantiers qui rentrent régulièrement, sans courir après — ça changerait quoi pour vous concrètement ?",
        ok: "Donc l'idéal pour vous ce serait de gagner plus, j'imagine ?",
        bad: "Avec notre site vous allez enfin pouvoir choisir vos chantiers, c'est ce que tout le monde veut.",
      },
      {
        good: "Si demain c'était vous qu'on trouve en premier quand on cherche un {metier} à {ville}, ça ressemblerait à quoi votre activité ?",
        ok: "Vous aimeriez avoir plus de visibilité, c'est ça l'objectif ?",
        bad: "Tout le monde veut être premier sur Google, je vais vous y mettre, vous allez voir.",
      },
    ],
    feedback: {
      good: "Tu le fais se projeter sur SA situation : tu récupères le carburant émotionnel pour closer plus tard.",
      ok: "Tu mets les mots à sa place ('gagner plus') au lieu de le laisser formuler son vrai désir.",
      bad: "Tu repitches la solution au lieu de creuser l'ambition : tu sautes une étape clé.",
    },
  },

  pont: {
    options: [
      {
        good: "Si je résume avec vos mots : aujourd'hui vous subissez les creux, et vous voudriez des demandes régulières pour être tranquille. C'est bien ça ?",
        ok: "Bon, du coup je vous montre le site maintenant ?",
        bad: "Vu tout ce que vous me dites, vous avez clairement besoin de notre site, je vous présente l'offre.",
      },
      {
        good: "Donc si je comprends bien : ces demandes vous passent sous le nez, et vous voudriez être celui qu'on trouve. On est d'accord là-dessus ?",
        ok: "Ok, je pense avoir compris. On passe à la démo ?",
        bad: "Parfait, c'est exactement pour ça que mon site est fait, laissez-moi vous expliquer.",
      },
    ],
    feedback: {
      good: "Tu reformules douleur + ambition et tu fais VALIDER : il s'engage sur le problème avant de voir le prix.",
      ok: "Tu enchaînes sur la démo sans verrouiller l'accord : le pont saute, l'argumentaire portera moins.",
      bad: "Tu conclus à sa place et tu pitches : il n'a pas dit 'oui c'est ça', tu présentes dans le vide.",
    },
  },

  presentation: {
    options: [
      {
        good: "Du coup je vous ai préparé un site qui ressort quand on tape « {metier} {ville} », avec vos réalisations et un bouton appeler. Si c'était le vôtre, vous pensez que ça pourrait vous amener des demandes en plus ?",
        ok: "Alors le site il a plein de fonctionnalités : galerie photos, formulaire, avis clients, c'est très complet.",
        bad: "C'est le meilleur site du marché, tous nos clients adorent, vous allez voir vous allez adorer aussi.",
      },
      {
        good: "Concrètement : quelqu'un cherche un {metier} à {ville}, tombe sur votre site, voit vos chantiers et vous appelle en 30 secondes. Ça, ça collerait à ce que vous recherchez ?",
        ok: "Je vous montre, c'est un beau site moderne, responsive, avec du référencement inclus.",
        bad: "Franchement avec ça vous allez exploser, vos concurrents vont faire la tête, croyez-moi.",
      },
    ],
    feedback: {
      good: "Tu relies le site à SA douleur/ambition et tu fais valider l'intérêt : présentation sur-mesure, pas un catalogue.",
      ok: "Tu listes des fonctionnalités génériques : il s'en fiche, il veut savoir ce que ça lui rapporte.",
      bad: "Survente et fanfaronnade : aucune preuve, aucun lien avec sa situation, ça sonne creux.",
    },
  },

  prix_close: {
    options: [
      {
        good: "En agence, un site comme ça c'est 1000 à 3000€. Nous, c'est 299€ — un seul chantier capté via le site et il est déjà rentabilisé. On l'active pour votre activité ?",
        ok: "Donc voilà, ce sera 299€. Qu'est-ce que vous en pensez ?",
        bad: "Alors c'est 299€, mais si vous préférez réfléchir je vous rappelle la semaine prochaine, pas de souci.",
      },
      {
        good: "Le prix c'est 299€, une fois, et le site vous appartient. Comparé à un seul chantier que vous décrochez grâce à lui, le calcul est vite fait. On le met en route ?",
        ok: "C'est 299€ tout compris. Vous voulez qu'on parte là-dessus ?",
        bad: "299€... bon écoutez, prenez votre temps, vous m'en redonnerez des nouvelles quand vous voulez.",
      },
    ],
    feedback: {
      good: "Ancrage (agence vs 299€) + ROI + close direct : tu demandes l'engagement clairement, puis tu te tais.",
      ok: "Tu annonces le prix sans ancrage ni ROI : la valeur n'est pas posée, l'objection prix arrive.",
      bad: "Tu fuis le close et tu lui offres une porte de sortie : l'appel meurt en 'je vous rappelle'.",
    },
  },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Un tour de simulateur scripté, riche et spécifique au persona — sans rien spoiler. */
export function fallbackTurn(scenario: Scenario, node: PhaseNode): SimTurn {
  const bank = BANK[node.phase];
  const p = scenario.persona;

  // Une variante au hasard parmi celles de la phase → les parties diffèrent.
  const variant = bank.options[Math.floor(Math.random() * bank.options.length)];

  const options: SimOption[] = [
    { text: fill(variant.good, p), quality: "good", feedback: bank.feedback.good },
    { text: fill(variant.ok, p), quality: "ok", feedback: bank.feedback.ok },
    { text: fill(variant.bad, p), quality: "bad", feedback: bank.feedback.bad },
  ];

  return {
    artisanLine: node.artisanSeed ?? "Ouais… je vous écoute, mais faites vite.",
    options: shuffle(options),
  };
}

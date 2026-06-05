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
        good: "Je vais être franc avec vous, c'est un appel de prospection — mais deux secondes, parce que j'ai déjà monté un exemple de site pour un {metier} et j'aimerais juste vous poser deux questions avant de vous le montrer. Ça marche ?",
        ok: "Bonjour, désolé de vous déranger en plein travail, je serai bref. Est-ce que vous m'accordez deux minutes pour vous expliquer la raison de mon appel ?",
        bad: "Bonjour, je me présente, je travaille avec pas mal d'artisans dans votre région pour les aider à développer leur visibilité en ligne. Je voulais voir avec vous où vous en êtes là-dessus.",
      },
      {
        good: "Vous êtes en plein boulot, je respecte, je vais droit au but : j'ai regardé votre activité de {metier} et je vous ai déjà préparé quelque chose. Deux questions rapides et je vous montre, d'accord ?",
        ok: "Bonjour ! J'espère que je ne tombe pas trop mal. Je voulais échanger un instant avec vous au sujet de votre présence sur internet, vous avez un moment ?",
        bad: "Bonjour, vous êtes bien le {metier} à {ville} ? Parfait. Alors, est-ce que vous seriez intéressé pour avoir plus de clients grâce à un site internet ?",
      },
    ],
    feedback: {
      good: "Honnêteté désarmante + accroche concrète (« j'ai déjà créé un truc ») : tu prends le contrôle et tu gagnes les 10 secondes d'attention.",
      ok: "Poli, mais tu demandes la permission et tu t'excuses : position basse, aucun hook. Il répond « non merci » par réflexe.",
      bad: "Ça sonne pro, mais c'est une intro générique sans accroche : soit tu te présentes trop longtemps, soit tu poses la question fermée qui déclenche le « ça m'intéresse pas » automatique.",
    },
  },

  decouverte: {
    options: [
      {
        good: "Avant de vous montrer quoi que ce soit — aujourd'hui vos clients arrivent comment ? Et si demain vous vouliez plus de chantiers, vous pouvez actionner un levier ou vous attendez que ça tombe ?",
        ok: "D'accord. Et aujourd'hui, vous diriez que vous avez assez de chantiers, ou vous en cherchez ?",
        bad: "Et pour qu'on vous trouve, vous avez quoi en place aujourd'hui ? Un site, une fiche Google, quelque chose ?",
      },
      {
        good: "Juste pour bien comprendre : le bouche-à-oreille, c'est régulier ou il y a des creux ? Vous avez la main dessus, ou ça dépend uniquement des autres ?",
        ok: "Et vos clients, ils sont plutôt contents du travail j'imagine ? Ils vous recommandent ?",
        bad: "Et est-ce que ça vous arrive de perdre des clients parce qu'ils ne vous trouvent pas sur Google ?",
      },
    ],
    feedback: {
      good: "Question ouverte sur l'acquisition + test de dépendance : tu récoltes la matière brute sans orienter, exactement ce qu'il faut pour la suite.",
      ok: "Question sympa mais fermée / hors-sujet : il répond par oui-non et tu n'apprends rien d'exploitable pour la douleur.",
      bad: "Le piège : ça ressemble à de la découverte, mais tu cadres déjà sur « internet / Google ». Tu orientes vers ta solution avant d'avoir compris son monde — il sent la vente arriver.",
    },
  },

  douleurs: {
    options: [
      {
        good: "Quand c'est plus calme, ça se passe comment pour vous ? Vous le vivez comment, ces périodes-là ?",
        ok: "Et ces périodes creuses, ça finit par peser sur le chiffre, non ?",
        bad: "Donc si je comprends bien, le vrai problème c'est que vous dépendez trop du bouche-à-oreille et que ça vous met en insécurité, c'est ça ?",
      },
      {
        good: "Vous dites que des fois les gens trouvent quelqu'un d'autre — ça vous fait quoi quand ça arrive ? C'est arrivé combien de fois cette année à votre avis ?",
        ok: "Du coup les mois calmes, c'est un peu stressant pour vous j'imagine ?",
        bad: "En fait ce qui vous manque c'est de la régularité et de la visibilité, voilà votre vrai souci — on est d'accord ?",
      },
    ],
    feedback: {
      good: "Tu creuses le ressenti avec SES mots, sans rien suggérer : la douleur sort d'elle-même et tu peux la reprendre au pont.",
      ok: "Tu suggères doucement la douleur (« ça pèse, c'est stressant ») : il acquiesce mollement, mais c'est toi qui l'as dite, pas lui.",
      bad: "Le piège : c'est une belle reformulation… mais prématurée. Tu mets les mots dans sa bouche avant qu'il les ait dits — il peut répondre « non, pas vraiment » et tout s'effondre.",
    },
  },

  ambitions: {
    options: [
      {
        good: "Et si vous aviez ces chantiers qui rentrent régulièrement, sans courir après — ça changerait quoi pour vous concrètement ?",
        ok: "Donc dans l'idéal, vous aimeriez en avoir un peu plus, de ces chantiers ?",
        bad: "Et si vous aviez un outil qui vous ramène des demandes en continu, automatiquement, ça vous parlerait ?",
      },
      {
        good: "Si demain c'était vous qu'on trouve en premier quand on cherche un {metier} à {ville}, ça ressemblerait à quoi votre quotidien ?",
        ok: "Vous aimeriez gagner en visibilité, c'est ça le fond ?",
        bad: "Imaginez un site qui travaille pour vous pendant que vous êtes sur le chantier — c'est exactement ça que vous voulez, non ?",
      },
    ],
    feedback: {
      good: "Tu le fais se projeter sur SA vie, pas sur ton produit : tu récupères le carburant émotionnel qui servira au close.",
      ok: "Question fermée qui appelle un « oui » tiède : tu obtiens un accord mou au lieu de le laisser formuler son vrai désir.",
      bad: "Le piège : ça a l'air d'une question d'ambition, mais tu as glissé ta solution dedans (« un outil », « un site »). Tu pitches déguisé — l'ambition reste la tienne, pas la sienne.",
    },
  },

  pont: {
    options: [
      {
        good: "Si je résume avec vos mots : aujourd'hui vous subissez les creux, et vous voudriez des demandes régulières pour être tranquille. C'est bien ça ?",
        ok: "Donc en gros vous voulez plus de régularité dans le boulot. On est d'accord ?",
        bad: "Donc vous voulez de la régularité et être trouvé en ligne — et c'est exactement ce que je vais vous montrer.",
      },
      {
        good: "Donc si je comprends bien : ces demandes vous passent sous le nez, et vous voudriez être celui qu'on trouve. On est d'accord là-dessus ?",
        ok: "Si j'ai bien suivi, le souci c'est surtout les périodes creuses, c'est ça ?",
        bad: "Parfait, tout ce que vous me dites confirme que vous avez besoin d'un site — laissez-moi vous le présenter.",
      },
    ],
    feedback: {
      good: "Tu reformules douleur ET ambition avec ses mots et tu fais VALIDER : il s'engage sur le problème avant de voir le prix.",
      ok: "Reformulation incomplète (tu ne reprends que la douleur, pas l'ambition) : l'accord est partiel, le pont tient à moitié.",
      bad: "Le piège : la reformulation est nickel… mais tu enchaînes direct sur la démo sans attendre son « oui c'est ça ». Tu sautes la validation, et tout l'argumentaire qui suit porte dans le vide.",
    },
  },

  presentation: {
    options: [
      {
        good: "Du coup je vous ai préparé un site qui ressort quand on tape « {metier} {ville} », avec vos réalisations et un bouton appeler. Si c'était le vôtre, vous pensez que ça pourrait vous amener des demandes en plus ?",
        ok: "Voilà le site : galerie de vos réalisations, vos coordonnées, un formulaire de contact et les avis clients. C'est propre et complet.",
        bad: "Regardez : ce type de site, mes clients artisans captent en moyenne 3 à 4 demandes de plus par mois grâce à lui. C'est ça que ça va vous apporter.",
      },
      {
        good: "Concrètement : quelqu'un cherche un {metier} à {ville}, tombe sur votre site, voit vos chantiers et vous appelle en 30 secondes. Ça, ça collerait à ce que vous me décriviez tout à l'heure ?",
        ok: "Le site est moderne, rapide, il s'affiche bien sur mobile et il y a le référencement Google inclus dans l'offre.",
        bad: "Franchement c'est l'outil qu'il vous faut : visible, pro, et au-dessus de ce que font vos concurrents du coin.",
      },
    ],
    feedback: {
      good: "Tu relies le site à SA situation validée et tu refais valider l'intérêt : présentation sur-mesure, il se projette comme propriétaire.",
      ok: "Tu décris bien le site, mais comme un catalogue : aucune connexion à sa douleur, aucune question pour l'embarquer.",
      bad: "Le piège : un bénéfice chiffré, ça sonne convaincant — mais c'est une promesse invérifiable, déconnectée de SA douleur, et tu ne lui demandes pas de valider. Tu affirmes au lieu de le faire adhérer.",
    },
  },

  prix_close: {
    options: [
      {
        good: "En agence, un site comme ça c'est 1000 à 3000€. Nous, c'est 299€ — un seul chantier capté via le site et il est déjà rentabilisé. On l'active pour votre activité ?",
        ok: "Alors, c'est 299€, et franchement vu ce que ça peut vous rapporter c'est vite rentabilisé. Qu'est-ce que vous en dites ?",
        bad: "C'est 299€ seulement, vous ne prenez vraiment aucun risque à ce prix-là, tous les artisans le prennent. On y va ?",
      },
      {
        good: "Le prix, c'est 299€, une fois, et le site vous appartient. Comparé à un seul chantier que vous décrochez grâce à lui, le calcul est vite fait. On le met en route ?",
        ok: "Ce sera 299€ tout compris, sans abonnement. Ça vous semble correct comme tarif ?",
        bad: "299€. Et si jamais vous voulez y réfléchir, je vous laisse mon numéro et vous me rappelez quand vous êtes prêt, pas de pression.",
      },
    ],
    feedback: {
      good: "Ancrage (agence vs 299€) + ROI + close direct, puis tu te tais : tu demandes l'engagement clairement et tu laisses le silence travailler.",
      ok: "Le piège : tu évoques bien la rentabilité, mais sans ancrage chiffré, et tu finis sur une question ouverte (« qu'est-ce que vous en dites ? ») qui invite à temporiser plutôt qu'à signer.",
      bad: "Le piège : ça paraît assuré, mais « aucun risque / tout le monde le prend » dévalorise l'offre et sonne pression bas de gamme — ou tu offres carrément une porte de sortie. L'appel meurt en « je vous rappelle ».",
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

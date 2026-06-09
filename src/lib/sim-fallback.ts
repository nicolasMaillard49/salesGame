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
// `lead` = ce que l'artisan dit AVANT que le commercial choisisse sa réplique.
// C'est sa réaction à la phase précédente — jamais la réponse à la question
// que le commercial s'apprête à poser (sinon il aurait un temps d'avance).
type PhaseBank = { lead: string; options: Tone[]; feedback: Tone };

// Réplique avec le métier en minuscule ("plombier") et la ville telle quelle.
function fill(line: string, p: Scenario["persona"]): string {
  const metier = p.metier.trim().toLowerCase();
  return line.replaceAll("{metier}", metier).replaceAll("{ville}", p.ville.trim());
}

const BANK: Record<PhaseSkill, PhaseBank> = {
  ouverture: {
    lead: "Allô ? Oui c'est moi. C'est pour quoi exactement ?",
    options: [
      {
        good: "Je vais être franc avec vous, c'est un appel de prospection. Mais accordez-moi deux secondes : j'ai déjà monté un exemple de site pour un {metier}, et j'aimerais vous poser deux questions avant de vous le montrer.",
        ok: "Bonjour, désolé de vous déranger en plein travail, je serai bref. Est-ce que vous m'accordez deux minutes pour que je vous explique tranquillement la raison exacte de mon appel aujourd'hui ?",
        bad: "Bonjour, je me présente, je travaille avec beaucoup d'artisans de votre région pour les aider à développer leur visibilité en ligne, et je voulais voir un peu avec vous où vous en êtes là-dessus aujourd'hui.",
      },
      {
        good: "Vous êtes en plein boulot, je respecte, je vais droit au but : j'ai regardé votre activité de {metier} et je vous ai déjà préparé quelque chose. Deux questions rapides et je vous montre.",
        ok: "Bonjour ! J'espère que je ne tombe pas trop mal. Je voulais échanger un moment avec vous au sujet de votre présence sur internet, vous avez deux minutes devant vous là ?",
        bad: "Bonjour, vous êtes bien le {metier} à {ville} ? Parfait. Alors je vous explique en deux mots : est-ce que vous seriez intéressé pour avoir plus de clients grâce à un site internet bien référencé sur Google ?",
      },
    ],
    feedback: {
      good: "Honnêteté désarmante + accroche concrète (« j'ai déjà créé un truc ») : tu prends le contrôle et tu gagnes les 10 secondes d'attention.",
      ok: "Poli, mais tu demandes la permission et tu t'excuses : position basse, aucun hook. Il répond « non merci » par réflexe.",
      bad: "Ça sonne pro, mais c'est une intro générique sans accroche : soit tu te présentes trop longtemps, soit tu poses la question fermée qui déclenche le « ça m'intéresse pas » automatique.",
    },
  },

  decouverte: {
    lead: "Bon… vous avez déjà préparé un truc à ce qu'il paraît ? Allez-y, posez vos questions, mais je vous préviens, je suis pas un grand fan d'internet.",
    options: [
      {
        good: "Avant de vous montrer quoi que ce soit, aujourd'hui vos clients arrivent comment ? Et si demain vous vouliez plus de chantiers, vous pouvez actionner un levier ou vous attendez que ça tombe ?",
        ok: "D'accord. Et aujourd'hui, vous diriez que vous avez plutôt assez de chantiers comme ça, ou vous en cherchez encore activement de votre côté ?",
        bad: "Et aujourd'hui, pour qu'un nouveau client vous trouve facilement, vous avez quoi en place ? Un site internet, une fiche Google, une page sur les réseaux, ce genre de choses ?",
      },
      {
        good: "Et pour trouver de nouveaux clients, vous faites comment aujourd'hui ? Vous avez la main là-dessus ou ça dépend surtout des autres ?",
        ok: "Et vos clients, ils sont plutôt contents du travail j'imagine ? Ils vous recommandent facilement autour d'eux ?",
        bad: "Et ça vous arrive de perdre des clients parce qu'ils ne vous trouvent pas sur Google quand ils cherchent un {metier} dans le coin ?",
      },
    ],
    feedback: {
      good: "Question ouverte sur l'acquisition + test de dépendance : tu récoltes la matière brute sans orienter, exactement ce qu'il faut pour la suite.",
      ok: "Question sympa mais fermée / hors-sujet : il répond par oui-non et tu n'apprends rien d'exploitable pour la douleur.",
      bad: "Le piège : ça ressemble à de la découverte, mais tu cadres déjà sur « internet / Google ». Tu orientes vers ta solution avant d'avoir compris son monde — il sent la vente arriver.",
    },
  },

  douleurs: {
    lead: "Comment je trouve mes clients ? Surtout le bouche-à-oreille, les gens du coin qui me connaissent. Après c'est sûr que c'est pas toujours très régulier.",
    options: [
      {
        good: "Quand c'est plus calme, ça se passe comment pour vous ? Vous le vivez comment, ces périodes-là ?",
        ok: "Et ces périodes creuses, ça finit par peser sur le chiffre, non ?",
        bad: "Donc si je comprends bien, le vrai problème c'est que vous dépendez trop du bouche-à-oreille et que ça vous met en insécurité, c'est ça ?",
      },
      {
        good: "Et ne pas trop savoir d'où viendra le prochain chantier, ça vous pèse, ou vous êtes serein avec ça ?",
        ok: "Du coup les mois calmes, c'est un peu stressant pour vous, surtout pour les factures, j'imagine ?",
        bad: "En fait ce qui vous manque vraiment, c'est de la régularité et un peu plus de visibilité dans le coin. Voilà votre vrai souci au fond, on est d'accord là-dessus ?",
      },
    ],
    feedback: {
      good: "Tu creuses le ressenti avec SES mots, sans rien suggérer : la douleur sort d'elle-même et tu peux la reprendre au pont.",
      ok: "Tu suggères doucement la douleur (« ça pèse, c'est stressant ») : il acquiesce mollement, mais c'est toi qui l'as dite, pas lui.",
      bad: "Le piège : c'est une belle reformulation… mais prématurée. Tu mets les mots dans sa bouche avant qu'il les ait dits — il peut répondre « non, pas vraiment » et tout s'effondre.",
    },
  },

  ambitions: {
    lead: "Faut dire que les périodes plus creuses c'est jamais l'idéal, on sait jamais trop de quoi demain sera fait, ça met un peu la pression.",
    options: [
      {
        good: "Et si vous aviez ces chantiers qui rentrent régulièrement, sans courir après, ça changerait quoi pour vous concrètement ?",
        ok: "Donc dans l'idéal, vous aimeriez en avoir un peu plus, de ces chantiers ?",
        bad: "Et si vous aviez un outil qui vous ramène des demandes en continu, automatiquement, sans que vous ayez à lever le petit doigt pour ça, ça vous parlerait comme idée ?",
      },
      {
        good: "Si demain c'était vous qu'on trouve en premier quand on cherche un {metier} à {ville}, ça ressemblerait à quoi votre quotidien ?",
        ok: "Vous aimeriez gagner en visibilité dans le secteur, c'est ça le fond ?",
        bad: "Imaginez un site qui travaille pour vous pendant que vous êtes sur le chantier et qui vous ramène des demandes tout seul, c'est exactement ça que vous voulez au fond, non ?",
      },
    ],
    feedback: {
      good: "Tu le fais se projeter sur SA vie, pas sur ton produit : tu récupères le carburant émotionnel qui servira au close.",
      ok: "Question fermée qui appelle un « oui » tiède : tu obtiens un accord mou au lieu de le laisser formuler son vrai désir.",
      bad: "Le piège : ça a l'air d'une question d'ambition, mais tu as glissé ta solution dedans (« un outil », « un site »). Tu pitches déguisé — l'ambition reste la tienne, pas la sienne.",
    },
  },

  pont: {
    lead: "Ce que je voudrais ? Surtout que ça rentre plus régulièrement, sans avoir à courir après le boulot tout le temps.",
    options: [
      {
        good: "Si je résume avec vos mots : aujourd'hui vous subissez les creux, et vous voudriez des demandes régulières pour être tranquille. C'est bien ça ?",
        ok: "Donc en gros vous voulez plus de régularité dans le boulot. On est d'accord ?",
        bad: "Donc vous voulez de la régularité et être trouvé en ligne, et c'est exactement ce que je vais vous montrer tout de suite avec le site.",
      },
      {
        good: "Donc si je comprends bien, ces demandes vous passent sous le nez, et vous voudriez être celui qu'on trouve. On est d'accord là-dessus ?",
        ok: "Si j'ai bien suivi, le souci c'est surtout les périodes creuses, c'est ça ?",
        bad: "Parfait, tout ce que vous me dites confirme que vous avez clairement besoin d'un site, alors laissez-moi vous le présenter en détail.",
      },
    ],
    feedback: {
      good: "Tu reformules douleur ET ambition avec ses mots et tu fais VALIDER : il s'engage sur le problème avant de voir le prix.",
      ok: "Reformulation incomplète (tu ne reprends que la douleur, pas l'ambition) : l'accord est partiel, le pont tient à moitié.",
      bad: "Le piège : la reformulation est nickel… mais tu enchaînes direct sur la démo sans attendre son « oui c'est ça ». Tu sautes la validation, et tout l'argumentaire qui suit porte dans le vide.",
    },
  },

  presentation: {
    lead: "Ouais… c'est assez ça en fait, vous résumez bien. Bon, vous vouliez me montrer quelque chose, non ?",
    options: [
      {
        good: "Du coup je vous ai préparé un site qui ressort quand on tape « {metier} {ville} », avec vos réalisations et un bouton appeler. Si c'était le vôtre, ça pourrait vous amener des demandes en plus ?",
        ok: "Voilà le site : une galerie de toutes vos réalisations, vos coordonnées bien visibles, un formulaire de contact simple et les avis de vos clients. C'est propre, moderne et vraiment complet.",
        bad: "Regardez, ce type de site, mes clients artisans en captent en moyenne 3 à 4 demandes de plus par mois grâce à lui, c'est exactement ça que ça va vous apporter concrètement à vous aussi.",
      },
      {
        good: "Concrètement : quelqu'un cherche un {metier} à {ville}, tombe sur votre site, voit vos chantiers et vous appelle en 30 secondes. Ça collerait à ce que vous me décriviez tout à l'heure ?",
        ok: "Le site est moderne, rapide, il s'affiche parfaitement sur mobile comme sur ordinateur, et le référencement Google est inclus directement dans l'offre, sans surcoût.",
        bad: "Franchement c'est vraiment l'outil qu'il vous faut : visible, pro, parfaitement à jour, et clairement au-dessus de ce que font la plupart de vos concurrents du coin en ce moment, vous allez vite voir la différence.",
      },
    ],
    feedback: {
      good: "Tu relies le site à SA situation validée et tu refais valider l'intérêt : présentation sur-mesure, il se projette comme propriétaire.",
      ok: "Tu décris bien le site, mais comme un catalogue : aucune connexion à sa douleur, aucune question pour l'embarquer.",
      bad: "Le piège : un bénéfice chiffré, ça sonne convaincant — mais c'est une promesse invérifiable, déconnectée de SA douleur, et tu ne lui demandes pas de valider. Tu affirmes au lieu de le faire adhérer.",
    },
  },

  // ——— CLOSING : 6 étapes fines (la partie la plus dure de l'appel) ———

  pre_close: {
    lead: "Ouais… franchement c'est plutôt bien foutu votre truc, ça donne envie je dois dire.",
    options: [
      {
        good: "Si c'était le vôtre et qu'un client tombait dessus en cherchant un {metier} à {ville}, vous pensez que ça pourrait vous ramener des demandes en plus ?",
        ok: "Donc il vous plaît ce site ? On peut partir là-dessus alors.",
        bad: "Parfait. Alors je vous explique : c'est 299€ et on peut le mettre en ligne dès aujourd'hui, on y va ?",
      },
      {
        good: "Avant qu'on parle des détails — vous vous voyez l'utiliser au quotidien, ce site, pour capter les clients du coin ?",
        ok: "Bon, ça a l'air de vous parler en tout cas. Je continue ?",
        bad: "Génial, vu que ça vous plaît, le tarif c'est 299€, je vous envoie le lien de paiement tout de suite ?",
      },
    ],
    feedback: {
      good: "Tu fais valider l'intérêt AVANT de parler argent : un « oui, ça m'aiderait » arraché ici rend le prix presque acquis ensuite.",
      ok: "Tu sens que ça plaît mais tu ne fais pas verbaliser le bénéfice : sans son « oui ça m'aiderait », tu annonceras le prix dans le vide.",
      bad: "Le piège : tu sautes au prix sans avoir fait dire que le site lui sert. Tu brûles une étape — la valeur n'est pas posée, le chiffre tombe à nu.",
    },
  },

  annonce_prix: {
    lead: "Ouais, clairement ça pourrait m'aider à avoir plus de demandes… Bon, dites-moi tout : ça coûte combien votre truc ?",
    options: [
      {
        good: "Un site comme ça en agence, c'est 1000 à 3000€. Nous, c'est 299€, complet et mis en ligne. Un seul chantier capté grâce à lui et il est déjà remboursé.",
        ok: "C'est 299€. Franchement, pour ce que c'est, c'est donné, hein.",
        bad: "Alors c'est 299€… mais bon, attendez, on peut voir, si c'est trop pour vous je peux peut-être faire un petit geste.",
      },
      {
        good: "En agence on est sur du 1000 à 3000€ pour ce type de site. Là c'est 299€, une fois, et le site vous appartient. Le calcul est vite fait dès le premier chantier capté.",
        ok: "Le prix c'est 299€, tout compris, sans abonnement. Voilà.",
        bad: "Je vais être honnête, c'est 299€, je sais que ça peut faire beaucoup d'un coup pour un artisan, mais bon…",
      },
    ],
    feedback: {
      good: "Ancrage AVANT le chiffre (agence 1000-3000€) puis 299€ + ROI : le prix sonne comme une évidence rentable, pas comme une dépense.",
      ok: "Tu lâches le chiffre nu, sans ancrage ni ROI : il n'a aucun repère de valeur, le prix flotte tout seul et appelle la négociation.",
      bad: "Le piège : tu t'excuses du prix ou tu ouvres la négo toi-même. Tu signales que 299€ c'est cher — il s'engouffre dans la brèche.",
    },
  },

  close_direct: {
    lead: "Ok… 299€, d'accord. (un silence) Mouais, faut voir.",
    options: [
      {
        good: "On l'active pour votre activité ?",
        ok: "Alors, qu'est-ce que vous en pensez, ça vous tente ?",
        bad: "Voilà, donc comme je disais c'est vraiment un super outil, en plus le référencement est inclus, et franchement les autres artisans en sont tous très contents, donc voilà…",
      },
      {
        good: "Du coup, on le met en route pour {ville} ?",
        ok: "Vous voulez qu'on parte là-dessus alors ?",
        bad: "Bon, écoutez, je vous laisse réfléchir tranquillement et on en reparle quand vous voulez, y'a pas de souci hein, prenez votre temps.",
      },
    ],
    feedback: {
      good: "Une question d'action fermée, puis silence total : tu demandes clairement la vente et tu laisses la pression du vide travailler pour toi.",
      ok: "Question molle et ouverte (« ça vous tente ? ») : elle invite à temporiser au lieu d'acter. Tu ne demandes pas vraiment l'engagement.",
      bad: "Le piège : tu meubles le silence en re-pitchant (ou tu offres une porte de sortie). Tu casses la tension du close — il s'échappe en « je réfléchis ».",
    },
  },

  isoler_frein: {
    lead: "Écoutez… c'est intéressant, mais je sais pas, faut que j'y réfléchisse un peu là.",
    options: [
      {
        good: "Je comprends. Juste pour être sûr : qu'est-ce qui vous ferait hésiter, exactement ? Et à part ça, le site vous plaît et vous voyez l'intérêt ?",
        ok: "D'accord, mais qu'est-ce qu'il y a à réfléchir ? C'est pas si compliqué pourtant.",
        bad: "Pas de souci, prenez le temps qu'il vous faut et rappelez-moi quand vous serez prêt.",
      },
      {
        good: "Ça marche. Dites-moi franchement ce qui vous bloque — c'est le prix, le moment, ou un doute sur si ça marche pour vous ?",
        ok: "Vous voulez réfléchir à quoi précisément, au prix ?",
        bad: "Je sens que vous hésitez, mais croyez-moi, vous ne le regretterez pas, tous mes clients me remercient après, vraiment.",
      },
    ],
    feedback: {
      good: "Tu isoles le vrai frein (« qu'est-ce qui vous bloque ? ») et tu verrouilles le reste (« à part ça, c'est oui ? ») : tu sauras quoi traiter au lieu de tirer à l'aveugle.",
      ok: "Tu cherches à isoler, mais sur un ton qui braque (« c'est pas compliqué ») : il se ferme au lieu de livrer sa vraie objection.",
      bad: "Le piège : « prenez votre temps / rappelez-moi » valide la fuite. « Je réfléchis » est presque toujours un non poli — tu le laisses filer.",
    },
  },

  relance_projection: {
    lead: "C'est surtout que je sais pas si c'est le bon moment, je préfère réfléchir tranquille avant de me lancer.",
    options: [
      {
        good: "Je vous pose la vraie question : si vous continuez exactement comme aujourd'hui, dans 3 mois il se passe quoi ? Et si on met ça en place maintenant, ça donne quoi ?",
        ok: "Le truc, c'est que si vous attendez, vos concurrents qui ont un site continuent de prendre ces demandes. Autant s'y mettre, non ?",
        bad: "Écoutez, c'est le moment ou jamais, c'est une offre exceptionnelle, si vous ne le prenez pas maintenant vous allez le regretter, croyez-moi.",
      },
      {
        good: "Projetez-vous deux secondes : dans un mois le site est en ligne, vous avez déjà décroché un chantier grâce à lui, il est remboursé. Vous préférez vivre ça, ou rester comme aujourd'hui ?",
        ok: "Franchement, que vous le preniez ou pas, ça change rien pour moi — mais pour vous, ça peut vraiment faire une différence.",
        bad: "Bon, si je vous fais -50€ là tout de suite, à 249€, vous le prenez ? Allez, je peux faire ça pour vous, exceptionnellement.",
      },
    ],
    feedback: {
      good: "Tu fais vivre le contraste inaction/action (ou l'escalier de projection) : il décide en visualisant SA situation, pas sous ta pression. C'est ça qui débloque.",
      ok: "Bonne intuition (urgence concurrence, détachement) mais survolée : tu énonces l'idée sans la faire vivre, l'impact émotionnel ne prend pas.",
      bad: "Le piège : pression (« vous allez le regretter ») ou remise bradée. Tu casses la valeur et tu sens le vendeur aux abois — ça renforce l'hésitation.",
    },
  },

  verrou_paiement: {
    lead: "Bon… allez, c'est d'accord, on va le faire.",
    options: [
      {
        good: "Parfait. Vous préférez régler par carte ou par virement ?",
        ok: "Super, vous ne le regretterez pas ! Je suis vraiment content, on va faire du bon boulot ensemble, vous allez voir.",
        bad: "Génial ! Alors laissez-moi vous réexpliquer tout ce que le site contient et comment ça va se passer, dans les moindres détails, avant qu'on aille plus loin.",
      },
      {
        good: "Nickel. Je vous envoie le lien de paiement sur WhatsApp ou par mail ?",
        ok: "Excellent choix, franchement bravo, c'est la meilleure décision que vous pouviez prendre aujourd'hui, vraiment.",
        bad: "Top ! Bon, par contre je vous préviens, après le paiement il faudra remplir des trucs, m'envoyer vos photos, vos textes… ça peut vous prendre un peu de temps hein.",
      },
    ],
    feedback: {
      good: "Tu transformes le oui en acte par une question logistique fermée (carte ou virement / WhatsApp ou mail) : la vente est verrouillée sans laisser de blanc.",
      ok: "Tu célèbres au lieu d'encaisser : chaque seconde de blabla après le « oui » rouvre la porte au doute. Acte d'abord, félicite après.",
      bad: "Le piège : tu re-expliques ou tu charges la mule (« ça va vous prendre du temps »). Tu réintroduis de la friction juste après le oui — il peut se rétracter.",
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
  // node.phase peut théoriquement valoir la phase héritée `prix_close` (type du
  // schéma), mais simPhases ne produit jamais ce nœud : fallback de sûreté.
  const bank = BANK[node.phase as PhaseSkill] ?? BANK.annonce_prix;
  const p = scenario.persona;

  // Une variante au hasard parmi celles de la phase → les parties diffèrent.
  const variant = bank.options[Math.floor(Math.random() * bank.options.length)];

  const options: SimOption[] = [
    { text: fill(variant.good, p), quality: "good", feedback: bank.feedback.good },
    { text: fill(variant.ok, p), quality: "ok", feedback: bank.feedback.ok },
    { text: fill(variant.bad, p), quality: "bad", feedback: bank.feedback.bad },
  ];

  // L'artisan ne dit jamais la réponse de la phase à venir : `lead` est seulement
  // sa réaction à la phase précédente — et à l'ouverture, un simple décroché.
  // (Le `artisanSeed` du scénario n'est plus utilisé : il portait déjà l'attitude/
  //  la réponse du persona, ce qui spoilait ou alourdissait le 1er tour.)
  return {
    artisanLine: fill(bank.lead, p),
    options: shuffle(options),
  };
}

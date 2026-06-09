// Données du playbook interactif : l'appel complet, branche par branche.
// Chaque nœud = une réplique idéale du commercial + les réponses possibles du
// prospect (qui mènent au nœud suivant). On peut démarrer à n'importe quel nœud
// (les fiches « Phases » et « Closing » pointent chacune sur le bon nœud).

export type Reaction = { label: string; to: string };
export type PlaybookNode = {
  step: string; // ex. "Phase 2 · Découverte"
  tone?: string; // couleur d'accent
  prospect?: string; // ce que le prospect vient de dire (contexte)
  say: string[]; // la/les phrase(s) à dire (variantes)
  note: string; // intention / pourquoi
  warn?: string; // piège à éviter
  reactions: Reaction[];
  win?: boolean;
};

export const START = "ouverture";

export const TREE: Record<string, PlaybookNode> = {
  // ——————————————————— DÉCOUVERTE (du décroché à la présentation) ———————————————————
  ouverture: {
    step: "Phase 1 · Ouverture",
    tone: "#19c3e4",
    prospect: "Allô ? Oui c'est moi. C'est pour quoi exactement ?",
    say: [
      "Je vais être franc : c'est un appel de prospection. Mais accordez-moi 10 secondes — j'ai déjà préparé un exemple de site pour un [métier] comme vous, et j'aimerais juste vous poser deux questions avant.",
      "Vous êtes en plein boulot, je respecte, je vais droit au but : j'ai regardé votre activité et je vous ai déjà préparé quelque chose. Deux questions rapides et je vous montre.",
    ],
    note: "Honnêteté désarmante + accroche concrète (« j'ai déjà créé un truc ») : tu prends le contrôle et tu gagnes les 10 secondes d'attention.",
    reactions: [
      { label: "« Bon… allez-y, je vous écoute. »", to: "decouverte" },
      { label: "« Attendez, c'est de la prospection là ?! »", to: "ouv_demasque" },
      { label: "« J'ai pas le temps, je suis sur un chantier. »", to: "ouv_presse" },
    ],
  },
  ouv_demasque: {
    step: "Ouverture · Il démasque",
    tone: "#ff5d6c",
    prospect: "« C'est encore un commercial qui veut me fourguer un truc… »",
    say: [
      "Oui, et je vous le dis cash — c'est justement pour ça que j'ai pas voulu vous promettre du vent : je vous ai déjà fait le site. Vous jugez sur pièce, 2 minutes.",
      "Honnêtement ? Si je vous embête, vous raccrochez. Mais ce serait dommage, j'ai vraiment préparé un exemple pour vous.",
    ],
    note: "Ne confirme jamais platement « oui c'est de la vente » sans rebond : tu assumes cash et tu ramènes sur le concret.",
    warn: "« Oui, c'est de la prospection monsieur. » tout court → il raccroche immédiatement.",
    reactions: [{ label: "« Bon, 2 minutes alors. »", to: "decouverte" }],
  },
  ouv_presse: {
    step: "Ouverture · Il est pressé",
    tone: "#ff9d2e",
    prospect: "« Là je suis en plein chantier, faites vite. »",
    say: ["T'es en plein boulot, respect, je te garde pas : deux questions et je te montre l'exemple que j'ai préparé. Si ça t'intéresse pas, tu raccroches."],
    note: "Tu reconnais qu'il est débordé et tu réduis l'engagement perçu (2 questions). Tu gardes le lead sans forcer.",
    reactions: [{ label: "« Allez, vas-y. »", to: "decouverte" }],
  },
  decouverte: {
    step: "Phase 2 · Découverte",
    tone: "#19c3e4",
    prospect: "« Bon… vous vouliez me demander quoi ? »",
    say: [
      "Aujourd'hui, vos clients ils arrivent comment principalement ?",
      "Pour trouver de nouveaux clients, vous faites comment ? Vous avez la main là-dessus ou ça dépend surtout des autres ?",
    ],
    note: "Question ouverte sur l'acquisition, sans orienter vers « internet/Google » : tu récoltes la matière brute.",
    warn: "« Vous avez un site, une fiche Google ? » → tu cadres déjà sur ta solution, il sent la vente arriver.",
    reactions: [
      { label: "« Surtout le bouche-à-oreille. »", to: "douleurs" },
      { label: "« J'ai déjà un site, hein. »", to: "dec_site" },
      { label: "« J'ai bien assez de clients comme ça. »", to: "dec_assez" },
    ],
  },
  dec_site: {
    step: "Découverte · Il a déjà un site",
    tone: "#19c3e4",
    prospect: "« J'ai déjà un site, moi. »",
    say: ["Il est actif comment ? Quand quelqu'un cherche [métier] à [ville] sur Google, vous sortez à quelle position ?"],
    note: "S'il ne sait pas à quelle position il sort, c'est qu'il ne sort pas. Tu le fais constater lui-même, sans le braquer.",
    reactions: [{ label: "« Euh… aucune idée en fait. »", to: "douleurs" }],
  },
  dec_assez: {
    step: "Découverte · « J'ai assez de clients »",
    tone: "#19c3e4",
    prospect: "« Franchement, j'ai assez de boulot comme ça. »",
    say: ["Tant mieux, c'est bon signe. Et si demain vous vouliez choisir des chantiers plus intéressants, vous pourriez actionner quelque chose, ou vous prenez ce qui vient ?"],
    note: "Tu ne contredis pas : tu ouvres une brèche sur la qualité et le choix des chantiers plutôt que le volume.",
    reactions: [{ label: "« C'est sûr que choisir, ce serait pas mal… »", to: "douleurs" }],
  },
  douleurs: {
    step: "Phase 3 · Douleurs",
    tone: "#ff9d2e",
    prospect: "« …après c'est vrai que c'est pas toujours très régulier. »",
    say: [
      "Quand c'est plus calme, ça se passe comment pour vous ? Vous le vivez comment, ces périodes-là ?",
      "Et ne pas trop savoir d'où viendra le prochain chantier, ça vous pèse, ou vous êtes serein avec ça ?",
    ],
    note: "Tu creuses le RESSENTI avec ses mots, sans rien suggérer : la douleur doit sortir de lui.",
    warn: "« Donc votre problème c'est la dépendance au bouche-à-oreille ? » → tu mets les mots dans sa bouche trop tôt.",
    reactions: [
      { label: "« Ouais, les mois creux ça stresse pour les factures. »", to: "ambitions" },
      { label: "« Bah non, j'ai pas vraiment de problème. »", to: "doul_aucun" },
    ],
  },
  doul_aucun: {
    step: "Douleurs · « Pas de problème »",
    tone: "#ff9d2e",
    prospect: "« Non franchement, tout roule. »",
    say: ["Beaucoup d'artisans s'en sortent bien, et pourtant y'a des mois où ils se demandent d'où viendra le prochain chantier. Ça vous est déjà arrivé ? C'était comment l'hiver dernier à la même période ?"],
    note: "Tu normalises puis tu creuses sur une période précise (l'hiver dernier) pour faire émerger une vraie douleur.",
    reactions: [{ label: "« Bon… l'hiver c'est vrai que c'est plus dur. »", to: "ambitions" }],
  },
  ambitions: {
    step: "Phase 4 · Ambitions",
    tone: "#7b4fe0",
    prospect: "« Disons que les creux, c'est jamais l'idéal. »",
    say: [
      "Et si vous aviez ces chantiers qui rentrent régulièrement, sans courir après, ça changerait quoi pour vous concrètement ?",
      "Si demain c'était vous qu'on trouve en premier quand on cherche un [métier] à [ville], ça ressemblerait à quoi votre quotidien ?",
    ],
    note: "Tu le fais se projeter sur SA vie, pas sur ton produit : c'est le carburant émotionnel du closing.",
    warn: "« Imaginez un site qui vous ramène des demandes tout seul… » → tu pitches déguisé, l'ambition reste la tienne.",
    reactions: [
      { label: "« J'aimerais être tranquille, arrêter de courir. »", to: "pont" },
      { label: "« Pouvoir choisir mes chantiers, clairement. »", to: "pont" },
    ],
  },
  pont: {
    step: "Phase 5 · Le Pont",
    tone: "#4b7bff",
    prospect: "« …voilà, que ça rentre plus régulièrement quoi. »",
    say: ["Si je résume avec vos mots : aujourd'hui vous subissez les creux, et vous voudriez des demandes régulières pour être tranquille. C'est bien ça ?"],
    note: "Tu reformules douleur ET ambition avec SES mots et tu fais VALIDER : il s'engage sur le problème avant de voir le prix.",
    warn: "N'enchaîne pas direct sur la démo : attends son « oui c'est ça » avant de présenter.",
    reactions: [
      { label: "« Oui, c'est exactement ça. »", to: "presentation" },
      { label: "« Bof, pas vraiment en fait. »", to: "pont_non" },
    ],
  },
  pont_non: {
    step: "Pont · Il corrige",
    tone: "#4b7bff",
    prospect: "« Non, c'est pas tant la régularité… »",
    say: ["D'accord, je veux bien comprendre : alors c'est quoi le plus important pour vous là-dedans ?"],
    note: "S'il corrige, tu n'insistes pas : tu repars creuser pour reformuler juste. Un pont faux fait tout s'effondrer.",
    reactions: [{ label: "Il précise, tu reformules juste → il valide", to: "presentation" }],
  },
  presentation: {
    step: "Phase 6 · Présentation",
    tone: "#00c06a",
    prospect: "« Bon, vous vouliez me montrer quelque chose, non ? »",
    say: ["Du coup je vous ai préparé un site qui ressort quand on tape « [métier] [ville] », avec vos réalisations et un bouton pour vous appeler. Si c'était le vôtre, ça pourrait vous amener des demandes en plus ?"],
    note: "Tu relies le site à SA situation validée et tu refais valider l'intérêt : il se projette comme propriétaire.",
    reactions: [
      { label: "« Ah ouais, c'est pas mal ça… »", to: "pre_close" },
      { label: "« Mouais, je sais pas si ça marche pour moi. »", to: "douleurs" },
    ],
  },

  // ——————————————————— CLOSING (6 étapes) ———————————————————
  pre_close: {
    step: "Étape 1 · Pré-close",
    tone: "#00c06a",
    prospect: "« Ouais… franchement c'est plutôt bien foutu, ça donne envie. »",
    say: [
      "Si c'était le tien et qu'un client tombait dessus en cherchant un [métier] à [ville]… ça pourrait t'amener des demandes en plus ?",
      "Avant qu'on parle des détails — tu te vois l'utiliser au quotidien, ce site, pour capter les clients du coin ?",
    ],
    note: "Tu fais valider l'intérêt AVANT de parler argent : un « oui, ça m'aiderait » arraché ici rend le prix presque acquis.",
    reactions: [
      { label: "« Oui, ça pourrait clairement m'aider. »", to: "annonce_prix" },
      { label: "« Mouais… je sais pas si ça marche pour moi. »", to: "pas_creuse" },
    ],
  },
  pas_creuse: {
    step: "Pré-close · Encore tiède",
    tone: "#ff9d2e",
    prospect: "« Je sais pas trop si c'est pour moi… »",
    say: ["Qu'est-ce qui te ferait douter que ça marche pour toi ?"],
    note: "Un « peut-être » = tu n'as pas assez creusé. Tu lèves le doute avant de revenir au prix.",
    reactions: [{ label: "Il lâche son doute, tu le lèves → « ok ça pourrait aider »", to: "annonce_prix" }],
  },
  annonce_prix: {
    step: "Étape 2 · Annonce du prix",
    tone: "#00c06a",
    prospect: "« Bon, dis-moi tout : ça coûte combien ? »",
    say: [
      "Un site comme ça en agence, c'est 1000 à 3000€. Nous, c'est 299€, complet et mis en ligne. Un seul chantier capté grâce à lui et il est déjà remboursé.",
      "En agence on est sur du 1000 à 3000€. Là c'est 299€, une fois, et le site t'appartient. Le calcul est vite fait dès le premier chantier.",
    ],
    note: "Ancrage AVANT le chiffre (agence 1000-3000€) puis 299€ + ROI : le prix sonne comme une évidence rentable.",
    warn: "Jamais « c'est 299€ mais bon si c'est trop je peux faire un geste » → tu signales toi-même que c'est cher.",
    reactions: [{ label: "Il encaisse le prix — tu enchaînes direct", to: "close_direct" }],
  },
  close_direct: {
    step: "Étape 3 · Close direct + silence",
    tone: "#00c06a",
    prospect: "« Ok… 299€, d'accord. (un silence) Mouais, faut voir. »",
    say: ["On l'active pour ton activité ?", "Du coup, on le met en route pour [ville] ?"],
    note: "UNE question d'action fermée, puis SILENCE total. La prochaine personne qui parle a perdu.",
    warn: "Ne meuble pas le silence en re-pitchant, et n'offre jamais « je te laisse réfléchir ».",
    reactions: [
      { label: "« Oui, allez, on y va. »", to: "verrou" },
      { label: "« Faut que j'y réfléchisse. »", to: "isoler" },
      { label: "« C'est trop cher. »", to: "obj_cher" },
      { label: "« Je dois en parler à ma femme / mon associé. »", to: "obj_asso" },
      { label: "« Pas maintenant, je suis débordé. »", to: "obj_timing" },
    ],
  },
  isoler: {
    step: "Étape 4 · Isoler le frein",
    tone: "#ff9d2e",
    prospect: "« Écoutez… c'est intéressant, mais faut que j'y réfléchisse. »",
    say: [
      "Je comprends. Qu'est-ce qui te ferait hésiter, exactement ? Et à part ça, le site te plaît et tu vois l'intérêt ?",
      "Dis-moi franchement ce qui te bloque — c'est le prix, le moment, ou un doute sur si ça marche pour toi ?",
    ],
    note: "« Je réfléchis » est presque toujours un non poli. Tu n'dis JAMAIS « prends ton temps » : tu isoles le vrai frein.",
    reactions: [
      { label: "« Le site me plaît, c'est juste le prix. »", to: "obj_cher" },
      { label: "« C'est surtout le moment. »", to: "obj_timing" },
      { label: "« Faut que j'en parle à mon associé. »", to: "obj_asso" },
      { label: "« Non, rien de précis, je préfère réfléchir. »", to: "relance" },
    ],
  },
  relance: {
    step: "Étape 5 · Relance par projection",
    tone: "#7b4fe0",
    prospect: "« Rien de spécial… je préfère réfléchir tranquille. »",
    say: ["Pas de vrai frein = il est juste tiède. Tu débloques par l'émotion, calmement. Choisis ta technique :"],
    note: "Trois leviers possibles. Un seul suffit — choisis celui qui colle au prospect.",
    reactions: [
      { label: "🔻 Inaction vs Action", to: "t_inaction" },
      { label: "🧘 Détachement + recadrage", to: "t_detach" },
      { label: "🪜 Escalier de projection", to: "t_escalier" },
    ],
  },
  t_inaction: {
    step: "Relance · Inaction vs Action",
    tone: "#7b4fe0",
    say: [
      "Si tu continues exactement comme aujourd'hui, selon toi il se passe quoi dans 3 mois ? (laisse-le répondre)",
      "Donc on est d'accord : si rien ne change, rien ne change. Et si on met ça en place aujourd'hui, ça donne quoi dans 2-3 mois ?",
      "La vraie question : tu préfères rester dans une situation que tu subis… ou tenter quelque chose pour en sortir ? On avance ou on laisse comme ça ?",
    ],
    note: "Tu crées le contraste rester/agir et tu bloques la fuite mentale. Direct, assertif — jamais agressif.",
    reactions: [
      { label: "« Ok, t'as raison, on y va. »", to: "verrou" },
      { label: "« Mouais, toujours pas sûr. »", to: "relance_echec" },
    ],
  },
  t_detach: {
    step: "Relance · Détachement + recadrage",
    tone: "#7b4fe0",
    say: [
      "Je vais être honnête : que tu le fasses ou pas, ça ne change rien pour moi. (pause)",
      "Moi je sais ce que j'apporte à mes clients, ça tourne très bien de leur côté. Donc 299€, tu te doutes que c'est pas ça qui va changer ma vie.",
      "Par contre, pour toi… ça peut clairement faire une différence. C'est pas le moment de faire un premier pas pour changer ça ?",
    ],
    note: "Tu enlèves la pression de vente, tu reprends le pouvoir. Détaché, confiant, calme — jamais arrogant ni nerveux.",
    reactions: [
      { label: "« Ok, allez. »", to: "verrou" },
      { label: "« Mouais, toujours pas sûr. »", to: "relance_echec" },
    ],
  },
  t_escalier: {
    step: "Relance · Escalier de projection",
    tone: "#7b4fe0",
    say: [
      "Projette-toi avec moi deux secondes… Dans les prochains jours, le site est en ligne, les gens tombent dessus.",
      "Dans 1-2 semaines t'as tes premiers appels. Dans 1 mois, ton premier client venu du site — t'as rentabilisé. Dans 3 mois ça tourne régulièrement.",
      "Dans 6 mois tu regardes en arrière et tu te dis que t'as bien fait. Tu veux que ça devienne ta réalité, ou rester comme aujourd'hui ?",
    ],
    note: "Le cerveau distingue mal imagination et réalité. Ralentis le débit, micro-silences : il doit visualiser.",
    reactions: [
      { label: "« Ok, allez, on y va. »", to: "verrou" },
      { label: "« Mouais, toujours pas sûr. »", to: "relance_echec" },
    ],
  },
  relance_echec: {
    step: "Démasquer le vrai frein",
    tone: "#ff5d6c",
    say: [
      "Entre nous — quand tu dis que tu veux réfléchir, c'est vraiment que t'as besoin de temps, ou y'a quelque chose qui te bloque et que t'as pas dit ?",
      "Je vais être franc : je maintiens pas le tarif 299€ après cet appel. On fait simple, je l'active maintenant et tu prends la main.",
    ],
    note: "Tu redémasques le frein caché, puis tu poses l'urgence tarif. Honnête, pas menaçant.",
    reactions: [
      { label: "Il lâche le vrai frein (prix / asso / timing)", to: "isoler" },
      { label: "« Bon… ok, allez. »", to: "verrou" },
    ],
  },
  obj_cher: {
    step: "Objection · « C'est trop cher »",
    tone: "#ff5d6c",
    prospect: "« 299€, franchement c'est trop cher. »",
    say: [
      "Trop cher par rapport à quoi exactement ? (laisse-le répondre)",
      "Un site comme ça en agence c'est 1000 à 3000€. Là 299€. Un seul chantier trouvé via le site, ça vaut combien pour toi ?",
      "La vraie question c'est pas « est-ce que 299€ c'est cher », c'est « est-ce que ce site peut me ramener au moins un client ? » — et tu m'as dit toi-même que tu pourrais en prendre plus.",
    ],
    note: "Tu ne te défends pas : tu creuses le « par rapport à quoi », puis tu ramènes à la valeur d'un seul chantier.",
    reactions: [{ label: "« Ok, vu comme ça… »", to: "close_direct" }],
  },
  obj_asso: {
    step: "Objection · « J'en parle à ma femme / mon associé »",
    tone: "#ff5d6c",
    say: [
      "Bien sûr. Pour ce type de décision, c'est toi qui tranches ou vous décidez ensemble ? (si « c'est moi » → « alors qu'est-ce qui te retient vraiment ? »)",
      "Si elle était là maintenant, elle aurait une objection à un site 299€ qui peut vous amener des clients ?",
      "On l'active maintenant et tu lui montres ce soir. Tu verras sa réaction direct.",
    ],
    note: "Tu vérifies qui décide vraiment, puis tu neutralises l'objection imaginaire.",
    reactions: [{ label: "« C'est bon, on peut y aller. »", to: "close_direct" }],
  },
  obj_timing: {
    step: "Objection · « Pas maintenant »",
    tone: "#ff5d6c",
    say: [
      "C'est un problème de timing ou de budget ?",
      "Timing → La mise en ligne prend 48h, ça te prend pas de temps. Pendant que tu bosses, le site travaille en arrière-plan.",
      "Budget → Un seul chantier et il est remboursé, il se finance tout seul dès le 1er mois. On peut même faire en plusieurs fois.",
    ],
    note: "Tu tranches d'abord timing vs budget, puis tu lèves le bon frein — pas les deux à l'aveugle.",
    reactions: [{ label: "« Ok, c'est vrai… »", to: "close_direct" }],
  },
  verrou: {
    step: "Étape 6 · Verrou & paiement",
    tone: "#00c06a",
    prospect: "« Allez, c'est d'accord, on le fait. »",
    say: [
      "Parfait. Tu préfères régler par carte ou par virement ?",
      "Je t'envoie le lien de paiement sur WhatsApp ou par mail ?",
      "On le met avec ton numéro actuel ou un numéro dédié ?",
    ],
    note: "Dès le « oui » : tu ne célèbres pas, tu ne re-vends pas. Tu verrouilles par une question logistique fermée.",
    warn: "Ne rajoute pas de friction (« après faudra m'envoyer plein de trucs… ») → il peut se rétracter.",
    reactions: [{ label: "Il choisit son moyen de paiement 💳", to: "win" }],
  },
  win: {
    step: "🎉 Vendu",
    tone: "#00c06a",
    say: ["Le site est vendu. Tu confirmes le créneau de mise en ligne, et maintenant — seulement maintenant — tu peux le féliciter."],
    note: "Tu as mené l'appel du décroché au paiement sans jamais lâcher le lead. Bravo.",
    win: true,
    reactions: [],
  },
};

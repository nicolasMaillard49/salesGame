"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

// Playbook interactif du closing : un arbre de décision jouable. À chaque étape
// on voit la (ou les) phrase(s) exacte(s) à dire, l'intention, le piège, puis on
// clique sur la réaction du prospect pour dérouler la branche correspondante.
// Phrases issues de la formation (source/01 & source/03).

type Reaction = { label: string; to: string };
type Node = {
  step: string;
  tone?: string; // couleur d'accent du badge d'étape
  prospect?: string; // ce que le prospect vient de dire (contexte)
  say: string[]; // la/les phrase(s) à dire (variantes)
  note: string; // intention / pourquoi
  warn?: string; // piège à éviter
  reactions: Reaction[];
  win?: boolean;
};

const TREE: Record<string, Node> = {
  pre_close: {
    step: "Étape 1 · Pré-close",
    tone: "#19c3e4",
    prospect: "Tu viens de lui montrer le site — « Ouais… c'est plutôt bien foutu, ça donne envie. »",
    say: [
      "Si c'était le tien et qu'un client tombait dessus en cherchant un [métier] à [ville]… ça pourrait t'amener des demandes en plus ?",
      "Avant qu'on parle des détails — tu te vois l'utiliser au quotidien, ce site, pour capter les clients du coin ?",
    ],
    note: "Tu fais valider l'intérêt AVANT de parler argent. Pas un mot sur le prix tant que tu n'as pas arraché un vrai « oui ».",
    reactions: [
      { label: "« Oui, ça pourrait clairement m'aider »", to: "annonce_prix" },
      { label: "« Mouais… je sais pas si ça marche pour moi »", to: "pas_creuse" },
    ],
  },
  pas_creuse: {
    step: "Retour découverte",
    tone: "#ff9d2e",
    say: ["Qu'est-ce qui te ferait douter que ça marche pour toi ?"],
    note: "Un « peut-être » = tu n'as pas assez creusé la douleur. Tu repars chercher l'accord, tu ne forces pas le prix sur un tiède.",
    reactions: [{ label: "Il lâche son doute, tu le lèves, il revient à « oui »", to: "annonce_prix" }],
  },
  annonce_prix: {
    step: "Étape 2 · Annonce du prix",
    tone: "#19c3e4",
    prospect: "« Bon, et ça coûte combien ton truc ? »",
    say: [
      "Un site comme ça en agence, c'est 1000 à 3000€. Nous, c'est 299€, complet et mis en ligne. Un seul chantier capté grâce à lui et il est déjà remboursé.",
      "En agence on est sur du 1000 à 3000€. Là c'est 299€, une fois, et le site t'appartient. Le calcul est vite fait dès le premier chantier.",
    ],
    note: "Ancrage AVANT le chiffre. Tu annonces sans hésiter, tu enchaînes sur le ROI.",
    warn: "Jamais « c'est 299€ mais bon si c'est trop je peux faire un geste » → tu signales toi-même que c'est cher.",
    reactions: [{ label: "Il encaisse le prix — tu enchaînes direct", to: "close_direct" }],
  },
  close_direct: {
    step: "Étape 3 · Close direct + silence",
    tone: "#00c06a",
    say: ["On l'active pour ton activité ?", "Du coup, on le met en route ?"],
    note: "UNE question d'action fermée, puis SILENCE absolu. La prochaine personne qui parle a perdu.",
    warn: "Ne meuble pas le silence en re-pitchant, et n'offre jamais « je te laisse réfléchir ».",
    reactions: [
      { label: "« Oui, allez, on y va »", to: "verrou" },
      { label: "« Faut que j'y réfléchisse »", to: "isoler" },
      { label: "« C'est trop cher »", to: "obj_cher" },
      { label: "« Je dois en parler à ma femme / mon associé »", to: "obj_asso" },
      { label: "« Pas maintenant, je suis débordé »", to: "obj_timing" },
    ],
  },
  isoler: {
    step: "Étape 4 · Isoler le frein",
    tone: "#ff9d2e",
    prospect: "« Je sais pas… faut que j'y réfléchisse. »",
    say: [
      "Je comprends. Qu'est-ce qui te ferait hésiter exactement ? Et à part ça, le site te plaît et tu vois l'intérêt ?",
      "Dis-moi franchement ce qui te bloque — c'est le prix, le moment, ou un doute sur si ça marche pour toi ?",
    ],
    note: "« Je réfléchis » est presque toujours un non poli. Tu ne dis JAMAIS « prends ton temps ». Tu isoles le vrai frein et tu verrouilles le reste.",
    reactions: [
      { label: "« Le site me plaît, c'est juste le prix »", to: "obj_cher" },
      { label: "« C'est surtout le moment »", to: "obj_timing" },
      { label: "« Faut que j'en parle à mon associé »", to: "obj_asso" },
      { label: "« Non, rien de précis, je préfère réfléchir »", to: "relance" },
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
      { label: "« Ok, t'as raison, on y va »", to: "verrou" },
      { label: "« Mouais, toujours pas sûr »", to: "relance_echec" },
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
      { label: "« Ok, allez »", to: "verrou" },
      { label: "« Mouais, toujours pas sûr »", to: "relance_echec" },
    ],
  },
  t_escalier: {
    step: "Relance · Escalier de projection",
    tone: "#7b4fe0",
    say: [
      "Projette-toi avec moi deux secondes… Dans les prochains jours, le site est en ligne, les gens tombent dessus.",
      "Dans 1-2 semaines t'as tes premiers appels. Dans 1 mois, ton premier client venu du site — t'as rentabilisé. Dans 3 mois ça tourne régulièrement.",
      "Dans 6 mois tu regardes en arrière et tu te dis que t'as bien fait de passer à l'action. Tu veux que ça devienne ta réalité, ou rester comme aujourd'hui ?",
    ],
    note: "Le cerveau distingue mal imagination et réalité. Ralentis le débit, micro-silences : il doit visualiser, pas juste écouter.",
    reactions: [
      { label: "« Ok, allez, on y va »", to: "verrou" },
      { label: "« Mouais, toujours pas sûr »", to: "relance_echec" },
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
      { label: "« Bon… ok, allez »", to: "verrou" },
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
    reactions: [{ label: "« C'est bon, on peut y aller »", to: "close_direct" }],
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
    note: "Dès le « oui » : tu ne célèbres pas, tu ne re-vends pas. Tu verrouilles par une question logistique fermée. Acte d'abord, félicite après.",
    warn: "Ne rajoute pas de friction (« après faudra m'envoyer plein de trucs… ») → il peut se rétracter.",
    reactions: [{ label: "Il choisit son moyen de paiement 💳", to: "win" }],
  },
  win: {
    step: "🎉 Vendu",
    tone: "#00c06a",
    say: ["Le site est vendu. Tu confirmes le créneau de mise en ligne, et maintenant — seulement maintenant — tu peux le féliciter."],
    note: "Tu as mené le closing du pré-close au paiement sans jamais lâcher le lead. Bravo.",
    win: true,
    reactions: [],
  },
};

const START = "pre_close";

export default function ClosingPlaybook() {
  const [path, setPath] = useState<string[]>([START]);
  const current = path[path.length - 1];
  const node = TREE[current];

  const go = (to: string) => setPath((p) => [...p, to]);
  const back = () => setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));
  const restart = () => setPath([START]);

  return (
    <div className="glass p-5 sm:p-6 flex flex-col gap-4 reveal">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="display text-lg flex items-center gap-2">
            <Icon name="target" size={18} className="text-[var(--green-deep)]" />
            Closing interactif
          </h2>
          <p className="text-[var(--ink-soft)] text-[13px] mt-0.5">
            Déroule le closing branche par branche. À chaque étape : la phrase exacte à dire, puis clique sur la réaction du prospect.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {path.length > 1 && (
            <button onClick={back} className="mono text-[12px] px-3 py-1.5 rounded-full border border-[var(--glass-line)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition inline-flex items-center gap-1">
              <Icon name="arrowRight" size={13} style={{ transform: "rotate(180deg)" }} /> Retour
            </button>
          )}
          <button onClick={restart} className="mono text-[12px] px-3 py-1.5 rounded-full border border-[var(--glass-line)] text-[var(--ink-soft)] hover:text-[var(--ink)] transition">
            Recommencer
          </button>
        </div>
      </div>

      {/* Fil des étapes parcourues */}
      <div className="flex flex-wrap items-center gap-1.5">
        {path.map((id, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[var(--ink-faint)] text-[11px]">›</span>}
            <span
              className="mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{
                color: i === path.length - 1 ? "#fff" : "var(--ink-faint)",
                background: i === path.length - 1 ? (TREE[id].tone ?? "var(--green-deep)") : "var(--glass)",
                border: "1px solid var(--glass-line)",
              }}
            >
              {TREE[id].step.split(" · ")[0]}
            </span>
          </span>
        ))}
      </div>

      {/* Carte de l'étape courante */}
      <div className="flex flex-col gap-3">
        <span
          className="self-start mono text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-full"
          style={{ color: node.tone ?? "var(--green-deep)", background: `${node.tone ?? "#00c06a"}1f`, border: `1px solid ${node.tone ?? "#00c06a"}55` }}
        >
          {node.step}
        </span>

        {node.prospect && (
          <div className="convo-msg convo-them">
            <span className="convo-who"><Icon name="worker" size={16} /></span>
            <div className="convo-body">
              <span className="block mono text-[9px] tracking-[.14em] uppercase opacity-60 mb-0.5">Prospect</span>
              {node.prospect}
            </div>
          </div>
        )}

        {!node.win && (
          <p className="mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">Ce que tu dis</p>
        )}
        <div className="flex flex-col gap-2">
          {node.say.map((line, i) => (
            <p key={i} className="mono text-[13px] leading-relaxed text-[var(--ink)] bg-[var(--good-wash)] border border-[rgba(0,184,107,.25)] rounded-xl px-3.5 py-2.5">
              {line}
            </p>
          ))}
        </div>

        <p className="text-[13px] text-[var(--ink-soft)] flex gap-2">
          <Icon name="brain" size={15} className="text-[var(--green-deep)] shrink-0 mt-0.5" />
          <span>{node.note}</span>
        </p>

        {node.warn && (
          <p className="text-[13px] text-[var(--ink)] bg-[var(--bad-wash)] border border-[rgba(255,93,108,.3)] rounded-xl px-3.5 py-2.5 flex gap-2">
            <span aria-hidden="true">⚠️</span>
            <span>{node.warn}</span>
          </p>
        )}
      </div>

      {/* Réactions du prospect */}
      {node.win ? (
        <div className="flex items-center gap-3 flex-wrap pt-1">
          <span className="display text-2xl text-[var(--green-deep)]">Vendu ! 🎉</span>
          <button onClick={restart} className="btn btn-primary">Rejouer le closing <Icon name="arrowRight" size={16} strokeWidth={2.5} /></button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">Le prospect répond…</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {node.reactions.map((r, i) => (
              <button
                key={i}
                onClick={() => go(r.to)}
                className="text-left text-[13.5px] px-3.5 py-3 rounded-xl border border-[var(--glass-line)] bg-[var(--glass)] hover:border-[var(--green)] hover:text-[var(--ink)] text-[var(--ink-soft)] transition flex items-center justify-between gap-2 group"
              >
                <span>{r.label}</span>
                <Icon name="arrowRight" size={15} strokeWidth={2.5} className="shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--green-deep)] transition" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

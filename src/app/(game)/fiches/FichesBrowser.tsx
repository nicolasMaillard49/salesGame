"use client";

import { useMemo, useState } from "react";
import type { Fiche } from "@/lib/content/schema";
import Icon, { type IconName } from "@/components/Icon";
import Playbook from "./Playbook";

const CATS: { key: Fiche["category"] | "all"; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "ouverture", label: "Ouverture" },
  { key: "decouverte", label: "Découverte" },
  { key: "closing", label: "Closing" },
  { key: "objection", label: "Objections" },
  { key: "phase", label: "Phases" },
  { key: "mindset", label: "Mindset" },
];

const CAT_COLOR: Record<Fiche["category"], string> = {
  ouverture: "#19c3e4",
  decouverte: "#7b4fe0",
  closing: "#00c06a",
  objection: "#ff5d6c",
  phase: "#ff9d2e",
  mindset: "#4b7bff",
};

const CAT_ICON: Record<Fiche["category"], IconName> = {
  ouverture: "chat",
  decouverte: "search",
  closing: "target",
  objection: "shield",
  phase: "phone",
  mindset: "brain",
};

// Icône qui décrit la situation précise de la fiche (sinon, icône de catégorie).
const ICON_BY_ID: Record<string, IconName> = {
  "ouverture-10-techniques": "chat",
  "ouverture-base-script": "phone",
  "ouverture-scripts-bonus": "users",
  "mec-prenom-tutoiement-tunnel": "chat",
  "mindset-posture-mec": "flame",
  "mindset-le-pont": "bridge",
  "mindset-pricing": "euro",
  "mindset-creneaux-canal": "clock",
  "phase-prise-rdv": "calendar",
  "phase-0-1-briseglace-situation": "phone",
  "phase-2-douleurs": "alert",
  "phase-3-ambitions": "star",
  "phase-4-pont-presentation": "bridge",
  "decouverte-techniques": "search",
  "closing-anatomie": "target",
  "closing-pre-close": "checkCircle",
  "closing-annonce-prix": "euro",
  "closing-close-direct": "handshake",
  "closing-isoler-frein": "search",
  "closing-relance": "trendingUp",
  "closing-verrou-paiement": "lock",
  "closing-inaction-action": "repeat",
  "closing-detachement": "moon",
  "closing-escalier-projection": "trendingUp",
  "objection-bouche-a-oreille": "users",
  "objection-travaille-seul": "worker",
  "objection-deja-appele": "phone",
  "objection-prix-cold": "euro",
  "objection-site-sans-trafic": "search",
  "objection-je-reflechis": "clock",
  "objection-en-parler-conjoint": "users",
  "objection-trop-cher": "euro",
  "objection-pas-maintenant": "clock",
  "objection-deja-essaye": "repeat",
  "objection-demasque": "alert",
  "objection-pas-confiance": "shield",
  "objection-jai-quelquun": "users",
  "objection-clientele-pas-internet": "mapPin",
  "objection-confirmer-rdv": "calendar",
};

// Fiches → nœud du playbook interactif (pour « jouer cette étape »), phases ET closing.
const PLAYBOOK_NODE: Record<string, string> = {
  // Phases de découverte
  "phase-0-1-briseglace-situation": "ouverture",
  "decouverte-techniques": "decouverte",
  "phase-2-douleurs": "douleurs",
  "phase-3-ambitions": "ambitions",
  "mindset-le-pont": "pont",
  "phase-4-pont-presentation": "pont",
  // Closing
  "closing-anatomie": "pre_close",
  "closing-pre-close": "pre_close",
  "closing-annonce-prix": "annonce_prix",
  "closing-close-direct": "close_direct",
  "closing-isoler-frein": "isoler",
  "closing-relance": "relance",
  "closing-verrou-paiement": "verrou",
  "closing-inaction-action": "t_inaction",
  "closing-detachement": "t_detach",
  "closing-escalier-projection": "t_escalier",
};

function iconFor(f: Fiche): IconName {
  return ICON_BY_ID[f.id] ?? CAT_ICON[f.category];
}

export default function FichesBrowser({ fiches }: { fiches: Fiche[] }) {
  const [cat, setCat] = useState<Fiche["category"] | "all">("all");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [playbookStart, setPlaybookStart] = useState<string | null>(null);
  const present = useMemo(() => new Set(fiches.map((f) => f.category)), [fiches]);
  const list = cat === "all" ? fiches : fiches.filter((f) => f.category === cat);

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function launchPlaybook(node: string) {
    setPlaybookStart(node);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Bandeau visuel + entrée closing interactif */}
      <div className="glass overflow-hidden relative flex flex-col sm:flex-row reveal">
        <div className="relative sm:w-48 h-28 sm:h-auto shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-closer.webp" alt="" className="absolute inset-0 w-full h-full object-cover img-kenburns" />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(7,20,14,.35))] sm:bg-[linear-gradient(90deg,transparent,var(--glass))]" />
        </div>
        <div className="p-5 flex-1 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="display text-2xl">Bibliothèque</h1>
            <p className="text-[var(--ink-soft)] text-sm mt-1">{fiches.length} fiches dépliantes — scripts, techniques, objections.</p>
          </div>
          <button
            onClick={() => (playbookStart ? setPlaybookStart(null) : launchPlaybook("ouverture"))}
            className="btn btn-primary self-start"
          >
            <Icon name="target" size={16} strokeWidth={2.4} />
            {playbookStart ? "Masquer l'appel" : "Appel interactif"}
          </button>
        </div>
      </div>

      {/* Playbook interactif (ouvert au nœud choisi) */}
      {playbookStart && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Appel interactif — tu peux le prendre en cours de route</span>
            <button onClick={() => setPlaybookStart(null)} className="mono text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink)] transition">Fermer ✕</button>
          </div>
          <Playbook key={playbookStart} startId={playbookStart} />
        </div>
      )}

      {/* Filtres catégorie */}
      <div className="flex flex-wrap gap-2">
        {CATS.filter((c) => c.key === "all" || present.has(c.key as Fiche["category"])).map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`mono text-[12px] px-3.5 py-2 rounded-full border transition ${
              cat === c.key
                ? "bg-[var(--green-deep)] text-white border-transparent"
                : "bg-[var(--glass)] border-[var(--glass-line)] text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Cartes dépliantes */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {list.map((f) => {
          const isOpen = open.has(f.id);
          const color = CAT_COLOR[f.category];
          const node = PLAYBOOK_NODE[f.id];
          const phrases = f.examples ?? (f.example ? [f.example] : []);
          return (
            <article key={f.id} className="glass overflow-hidden flex flex-col">
              <button
                onClick={() => toggle(f.id)}
                aria-expanded={isOpen}
                className="text-left p-5 flex items-start gap-3.5 w-full hover:bg-[var(--glass-strong)] transition"
              >
                <span
                  className="shrink-0 grid place-items-center rounded-xl"
                  style={{ width: 42, height: 42, color, background: `${color}1f`, border: `1px solid ${color}55` }}
                >
                  <Icon name={iconFor(f)} size={20} strokeWidth={2} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="eyebrow" style={{ color }}>{f.category}</span>
                  <h2 className="display text-base mt-1 leading-snug">{f.title}</h2>
                  <p className="text-[var(--ink-soft)] text-[13px] mt-1">{f.summary}</p>
                </span>
                <Icon name="chevronRight" size={18} className="shrink-0 mt-1 text-[var(--ink-faint)] transition-transform" style={{ transform: isOpen ? "rotate(90deg)" : "none" }} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 -mt-1 flex flex-col gap-3 border-t border-[var(--glass-edge)] pt-4">
                  <ul className="flex flex-col gap-1.5">
                    {f.points.map((p, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>

                  {phrases.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="mono text-[9px] uppercase tracking-[.14em] text-[var(--ink-faint)]">À dire</span>
                      {phrases.map((ex, i) => (
                        <p key={i} className="mono text-[12.5px] text-[var(--ink)] bg-[var(--good-wash)] border border-[rgba(0,184,107,.25)] rounded-xl px-3 py-2 leading-relaxed">
                          {ex}
                        </p>
                      ))}
                    </div>
                  )}

                  {node && (
                    <button
                      onClick={() => launchPlaybook(node)}
                      className="btn-arcade self-start mt-1"
                    >
                      <Icon name="target" size={15} strokeWidth={2.4} /> Jouer cette étape
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

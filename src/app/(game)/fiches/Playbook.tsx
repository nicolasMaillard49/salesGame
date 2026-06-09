"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import ArtisanAvatar from "@/components/ArtisanAvatar";
import { TREE, START } from "./playbook-data";

// Playbook interactif de l'appel : un arbre de décision jouable. À chaque étape
// on voit la/les phrase(s) exacte(s) à dire, puis on clique sur la réaction du
// prospect pour dérouler la branche. On peut démarrer à n'importe quel nœud.
export default function Playbook({ startId = START, metier = "plombier" }: { startId?: string; metier?: string }) {
  const entry = TREE[startId] ? startId : START;
  const [path, setPath] = useState<string[]>([entry]);
  const current = path[path.length - 1];
  const node = TREE[current];

  const go = (to: string) => setPath((p) => [...p, to]);
  const back = () => setPath((p) => (p.length > 1 ? p.slice(0, -1) : p));
  const restart = () => setPath([entry]);

  return (
    <div className="glass p-5 sm:p-6 flex flex-col gap-4 reveal">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="display text-lg flex items-center gap-2">
            <Icon name="target" size={18} className="text-[var(--green-deep)]" />
            Appel interactif
          </h2>
          <p className="text-[var(--ink-soft)] text-[13px] mt-0.5">
            Déroule l&apos;appel branche par branche. À chaque étape : la phrase exacte à dire, puis clique sur la réaction du prospect.
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
            <span className="convo-who overflow-hidden"><ArtisanAvatar metier={metier} size={30} className="rounded-[9px]" /></span>
            <div className="convo-body">
              <span className="block mono text-[9px] tracking-[.14em] uppercase opacity-60 mb-0.5">Prospect</span>
              {node.prospect}
            </div>
          </div>
        )}

        {!node.win && <p className="mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)]">Ce que tu dis</p>}
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
        <div className="flex items-center gap-4 flex-wrap pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-closer.webp" alt="" className="w-20 h-20 rounded-2xl object-cover ring-1 ring-[var(--glass-line)]" />
          <span className="display text-2xl text-[var(--green-deep)]">Vendu ! 🎉</span>
          <button onClick={restart} className="btn btn-primary">Rejouer <Icon name="arrowRight" size={16} strokeWidth={2.5} /></button>
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

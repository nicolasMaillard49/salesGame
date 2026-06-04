"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Objection, ObjectionOption } from "@/lib/content/schema";
import type { Boss } from "@/lib/bosses";
import { recordAnswer, shuffle, startSession } from "@/lib/client";
import { SKILL_LABELS } from "@/lib/types";
import Icon from "@/components/Icon";

const MAX_LIVES = 3;
const VERDICT: Record<ObjectionOption["quality"], { cls: string; label: string }> = {
  good: { cls: "v-good", label: "Touché" },
  ok: { cls: "v-ok", label: "Sans effet" },
  bad: { cls: "v-bad", label: "Tu encaisses" },
};

export default function BossGame({ bosses, objections }: { bosses: Boss[]; objections: Objection[] }) {
  const [boss, setBoss] = useState<Boss | null>(null);
  const [pool, setPool] = useState<Objection[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const deckRef = useRef<Objection[]>([]);
  const lastIdRef = useRef<string | null>(null);
  const [hp, setHp] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [cur, setCur] = useState<Objection | null>(null);
  const [options, setOptions] = useState<ObjectionOption[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [outcome, setOutcome] = useState<"win" | "lose" | null>(null);

  function draw(p: Objection[]) {
    // appelé uniquement depuis des handlers (start/next), pas pendant le render
    if (deckRef.current.length === 0) {
      // Re-mélange en garantissant que la 1ère carte ≠ dernière objection jouée
      let next = shuffle([...p]);
      if (p.length > 1 && lastIdRef.current !== null && next[0].id === lastIdRef.current) {
        // Déplacer la 1ère carte en fin de deck pour éviter la répétition
        next = [...next.slice(1), next[0]];
      }
      deckRef.current = next;
    }
    const o = deckRef.current.shift()!;
    lastIdRef.current = o.id;
    setCur(o);
    setOptions(shuffle(o.options));
    setPicked(null);
    setRevealed(false);
  }

  async function start(b: Boss) {
    const p = objections.filter((o) => b.objections.includes(o.id));
    if (p.length === 0) return;
    setBoss(b);
    setPool(p);
    setHp(b.hp);
    setLives(MAX_LIVES);
    setOutcome(null);
    deckRef.current = [];
    lastIdRef.current = null;
    startSession("drill", `boss:${b.id}`).then(setSessionId);
    draw(p);
  }

  async function pick(idx: number, opt: ObjectionOption) {
    if (revealed || !cur || !boss) return;
    setPicked(idx);
    setRevealed(true);
    if (sessionId) await recordAnswer({ sessionId, skill: cur.id, quality: opt.quality, itemRef: `boss:${cur.id}`, chosen: opt.text });
    if (opt.quality === "good") setHp((h) => Math.max(0, h - 1));
    else if (opt.quality === "bad") setLives((l) => Math.max(0, l - 1));
  }

  function next() {
    if (hp <= 0) return setOutcome("win");
    if (lives <= 0) return setOutcome("lose");
    draw(pool);
  }

  // sélection
  if (!boss) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="display text-2xl">Boss d’objection</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">Bats l’artisan en enchaînant les bonnes répliques. 3 vies. Une mauvaise réponse et tu encaisses.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3.5">
          {bosses.map((b) => (
            <button key={b.id} onClick={() => start(b)} className="glass mode text-left">
              <span className="mode-ic" style={{ color: "var(--bad)", background: "linear-gradient(135deg, rgba(255,93,108,.16), rgba(255,157,46,.1))", borderColor: "rgba(255,93,108,.25)" }}>
                <Icon name="shield" size={24} />
              </span>
              <h2 className="display text-lg mt-4">{b.name}</h2>
              <p className="text-sm text-[var(--ink-soft)] capitalize">{b.metier}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-2">{b.intro}</p>
              <p className="mono text-[11px] text-[var(--bad)] mt-3">{b.hp} PV · {b.objections.length} objections</p>
            </button>
          ))}
        </div>
        <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]">← Hub</Link>
      </div>
    );
  }

  if (outcome) {
    const win = outcome === "win";
    return (
      <div className="glass p-10 text-center flex flex-col items-center gap-4">
        <span className="mode-ic" style={win ? {} : { color: "var(--bad)", background: "var(--bad-wash)", borderColor: "rgba(255,93,108,.3)" }}>
          <Icon name={win ? "trophy" : "shield"} size={24} />
        </span>
        <h1 className="display text-2xl">{win ? `${boss.name} vaincu !` : "Tu as craqué…"}</h1>
        <p className="text-[var(--ink-soft)] text-sm">{win ? "Toutes ses objections gérées. Closer confirmé." : `${boss.name} a eu raison de toi. Réessaie.`}</p>
        <div className="flex gap-3 mt-2">
          <Link href="/" className="btn btn-glass">← Hub</Link>
          <button onClick={() => start(boss)} className="btn btn-primary">Revanche</button>
        </div>
      </div>
    );
  }

  if (!cur) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* barre de boss */}
      <div className="glass p-4 flex items-center gap-4">
        <span className="mode-ic" style={{ color: "var(--bad)", background: "linear-gradient(135deg, rgba(255,93,108,.16), rgba(255,157,46,.1))", borderColor: "rgba(255,93,108,.25)" }}>
          <Icon name="shield" size={22} />
        </span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="display text-base">{boss.name}</span>
            <span className="mono text-[12px] text-[var(--ink-faint)]">{hp} PV</span>
          </div>
          <div className="timer-bar mt-1.5">
            <div className="h-full rounded-full" style={{ width: `${(hp / boss.hp) * 100}%`, background: "linear-gradient(90deg,#ff5d6c,#ff9d2e)", transition: "width .3s ease" }} />
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <span key={i} className="w-3.5 h-3.5 rounded-full" style={{ background: i < lives ? "var(--good)" : "var(--glass-edge)", boxShadow: i < lives ? "0 0 8px var(--good)" : "none" }} />
          ))}
        </div>
      </div>

      <div className="flex items-start gap-4">
        <span className="face"><Icon name="worker" size={22} /></span>
        <div className="bubble-b">
          <span className="block mono text-[10px] uppercase tracking-[.16em] text-[var(--ink-faint)] mb-1">{boss.name} — {SKILL_LABELS[cur.id]}</span>
          <q className="bubble-q">{cur.artisanLine}</q>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((opt, idx) => {
          const isPicked = idx === picked;
          let state = "";
          if (revealed) state = opt.quality === "good" ? "good" : isPicked ? "bad" : "dim";
          return (
            <button key={idx} disabled={revealed} onClick={() => pick(idx, opt)} className={`opt-b ${state}`}>
              <span className="opt-key">{String.fromCharCode(65 + idx)}</span>
              <span className="txt">{opt.text}</span>
              {revealed && (
                <span className="fb">
                  <span className={`verdict ${VERDICT[opt.quality].cls}`}>{VERDICT[opt.quality].label}</span>
                  <span>{opt.feedback}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {revealed && (
        <button onClick={next} className="btn-arcade self-start mt-2">
          {hp <= 0 ? "Achever" : lives <= 0 ? "Voir le résultat" : "Continuer"}
          <Icon name="arrowRight" size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

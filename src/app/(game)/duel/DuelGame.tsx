"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Objection, ObjectionOption } from "@/lib/content/schema";
import { recordAnswer, startSession } from "@/lib/client";
import { SKILL_LABELS } from "@/lib/types";
import Icon from "@/components/Icon";

const N = 5;
const VERDICT: Record<ObjectionOption["quality"], { cls: string; label: string }> = {
  good: { cls: "v-good", label: "Correct" },
  ok: { cls: "v-ok", label: "Passable" },
  bad: { cls: "v-bad", label: "À éviter" },
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededPick(items: Objection[], seed: number, n: number): Objection[] {
  const rng = mulberry32(seed);
  const a = items.map((_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, items.length)).map((i) => items[i]);
}
function seededOptions(opts: ObjectionOption[], seed: number): ObjectionOption[] {
  const rng = mulberry32(seed + 99);
  const a = [...opts];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function enc(o: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function dec(s: string): { s: number; sc: number; n: string } | null {
  try {
    const b = s.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(b))));
  } catch {
    return null;
  }
}

export default function DuelGame({ objections, challenge }: { objections: Objection[]; challenge: string | null }) {
  const chal = useMemo(() => (challenge ? dec(challenge) : null), [challenge]);
  const [seed, setSeed] = useState<number | null>(chal?.s ?? null);
  const round = useMemo(() => (seed == null ? [] : seededPick(objections, seed, N)), [objections, seed]);

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [started, setStarted] = useState(false);

  const obj = round[i];
  const options = useMemo(() => (obj && seed != null ? seededOptions(obj.options, seed + i) : []), [obj, seed, i]);

  function begin() {
    if (seed == null) setSeed(Math.floor(Math.random() * 1e9));
    setStarted(true);
    startSession("drill", "duel").then(setSessionId);
  }
  function pick(idx: number, opt: ObjectionOption) {
    if (revealed || !obj) return;
    setPicked(idx);
    setRevealed(true);
    if (opt.quality === "good") setScore((s) => s + 1);
    if (sessionId) recordAnswer({ sessionId, skill: obj.id, quality: opt.quality, itemRef: `duel:${obj.id}`, chosen: opt.text });
  }
  function next() {
    if (i + 1 >= round.length) setDone(true);
    else {
      setI((n) => n + 1);
      setPicked(null);
      setRevealed(false);
    }
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/duel?c=${enc({ s: seed, sc: score, n: name || "Un collègue" })}` : "";

  // intro
  if (!started) {
    return (
      <div className="flex flex-col gap-5 max-w-xl">
        <div>
          <h1 className="display text-2xl">Duel</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">
            {chal ? <>{chal.n} te défie : {chal.sc}/{N} sur ces objections. À toi de faire mieux.</> : `${N} objections tirées au sort. Fais ton score, puis défie un collègue avec le même tirage.`}
          </p>
        </div>
        <button onClick={begin} className="btn btn-primary self-start">
          {chal ? "Relever le défi" : "Lancer le duel"} <Icon name="arrowRight" size={16} strokeWidth={2.5} />
        </button>
        <Link href="/" className="mono text-sm text-[var(--ink-faint)] hover:text-[var(--ink)]">← Hub</Link>
      </div>
    );
  }

  if (done) {
    const win = chal ? score > chal.sc : null;
    const tie = chal ? score === chal.sc : false;
    return (
      <div className="flex flex-col gap-5">
        <div className="glass p-10 text-center flex flex-col items-center gap-3">
          <span className="mode-ic"><Icon name="trophy" size={24} /></span>
          <h1 className="display text-2xl">{chal ? (tie ? "Égalité !" : win ? "Tu gagnes le duel !" : "Battu de peu…") : "Duel terminé"}</h1>
          <p className="display text-5xl text-[var(--green-deep)]">{score}<span className="text-[var(--ink-faint)] text-2xl">/{round.length}</span></p>
          {chal && <p className="mono text-[var(--ink-soft)]">{chal.n} : {chal.sc}/{round.length}</p>}

          {!chal && (
            <div className="w-full max-w-md mt-3 flex flex-col gap-2">
              <input className="field" placeholder="Ton nom (pour le défi)" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="flex gap-2">
                <input className="field flex-1 text-xs" readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()} />
                <button
                  className="btn btn-primary"
                  onClick={() => { navigator.clipboard?.writeText(shareUrl); setCopied(true); }}
                >
                  {copied ? "Copié ✓" : "Copier"}
                </button>
              </div>
              <p className="mono text-[11px] text-[var(--ink-faint)]">Envoie ce lien : ton adversaire jouera le même tirage.</p>
            </div>
          )}

          <div className="flex gap-3 mt-3">
            <Link href="/" className="btn btn-glass">← Hub</Link>
            <Link href="/duel" className="btn btn-primary">Nouveau duel</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!obj) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="hud-chip"><Icon name="target" size={15} /> Duel {chal ? `vs ${chal.n}` : ""}</span>
        <span className="counter-label">Manche <b>{i + 1}</b>/{round.length} · {score} pts</span>
      </div>
      <div className="flex items-start gap-4">
        <span className="face"><Icon name="worker" size={22} /></span>
        <div className="bubble-b">
          <span className="block mono text-[10px] uppercase tracking-[.16em] text-[var(--ink-faint)] mb-1">Artisan — {SKILL_LABELS[obj.id]}</span>
          <q className="bubble-q">{obj.artisanLine}</q>
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
          {i + 1 >= round.length ? "Voir le score" : "Manche suivante"}
          <Icon name="arrowRight" size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

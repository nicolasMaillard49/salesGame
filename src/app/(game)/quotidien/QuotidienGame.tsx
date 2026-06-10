"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Objection, ObjectionOption } from "@/lib/content/schema";
import { recordAnswer, shuffle, startSession, voiceMatchOption } from "@/lib/client";
import { useVoicePref } from "@/lib/voice";
import { VoiceAnswer, VoiceModeToggle } from "@/components/VoiceAnswer";
import { SKILL_LABELS } from "@/lib/types";
import Icon from "@/components/Icon";

// En vocal, si la réponse dite ne matche aucune option, on retombe sur la pire.
function worstIdx(opts: ObjectionOption[]): number {
  const b = opts.findIndex((o) => o.quality === "bad");
  return b >= 0 ? b : opts.length - 1;
}

const VERDICT: Record<ObjectionOption["quality"], { cls: string; label: string }> = {
  good: { cls: "v-good", label: "Correct" },
  ok: { cls: "v-ok", label: "Passable" },
  bad: { cls: "v-bad", label: "À éviter" },
};

function utcDay(offset = 0): string {
  return new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
}

export default function QuotidienGame({
  objection,
  alreadyDone,
  streak,
}: {
  objection: Objection;
  alreadyDone: boolean;
  streak: number;
}) {
  const options = useMemo(() => shuffle(objection.options), [objection]);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{ streak: number; bestStreak: number; alreadyDone: boolean } | null>(null);
  const [voiceMode, setVoiceMode] = useVoicePref();
  const [voiceScoring, setVoiceScoring] = useState(false);
  const [voiceErr, setVoiceErr] = useState<string | null>(null);

  async function submitVoice(spoken: string) {
    if (revealed) return;
    setVoiceErr(null);
    setVoiceScoring(true);
    const idx = await voiceMatchOption({ prompt: objection.artisanLine, spoken, options: options.map((o) => o.text) });
    setVoiceScoring(false);
    if (idx === null) { setVoiceErr("Évaluation IA indisponible — réessaie."); return; }
    const i = idx >= 0 ? idx : worstIdx(options);
    pick(i, options[i]);
  }

  async function pick(idx: number, opt: ObjectionOption) {
    if (revealed) return;
    setPicked(idx);
    setRevealed(true);
    const sid = await startSession("drill", "quotidien");
    if (sid) {
      await recordAnswer({ sessionId: sid, skill: objection.id, quality: opt.quality, itemRef: `daily:${objection.id}`, chosen: opt.text });
    }
    const res = await fetch("/api/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ today: utcDay(0), yesterday: utcDay(-1) }),
    });
    if (res.ok) setResult(await res.json());
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="display text-2xl">Défi du jour</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">Une objection par jour pour entretenir ta série.</p>
        </div>
        <span className="combo-badge"><Icon name="flame" size={14} /> {(result?.streak ?? streak)} j</span>
      </div>

      {alreadyDone && !result && (
        <p className="mono text-[13px] text-[var(--ink-soft)] glass px-4 py-3">
          Déjà relevé aujourd’hui — tu peux quand même t’entraîner, ça ne change pas ta série.
        </p>
      )}

      <div className="flex items-start gap-4 mt-1">
        <span className="face"><Icon name="worker" size={22} /></span>
        <div className="bubble-b">
          <span className="block mono text-[10px] uppercase tracking-[.16em] text-[var(--ink-faint)] mb-1">Artisan — {SKILL_LABELS[objection.id]}</span>
          <q className="bubble-q">{objection.artisanLine}</q>
        </div>
      </div>

      {!revealed && (
        <div className="glass p-4">
          <VoiceModeToggle on={voiceMode} onChange={setVoiceMode} />
        </div>
      )}

      {voiceMode && !revealed ? (
        <VoiceAnswer
          key={objection.id}
          prompt={objection.artisanLine}
          hints={options.filter((o) => o.quality === "good").map((o) => o.text)}
          submitting={voiceScoring}
          error={voiceErr}
          onSubmit={submitVoice}
        />
      ) : (
        <>
          <p className="mono text-[11px] uppercase tracking-wide text-[var(--ink-faint)] mt-2">Choisis ta meilleure réponse</p>

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
        </>
      )}

      {result && (
        <div className="glass p-5 flex items-center justify-between gap-4 flex-wrap">
          <p className="flex items-center gap-2 font-semibold">
            <Icon name="flame" size={18} className="text-[var(--bad)]" />
            {result.alreadyDone ? "Série déjà validée aujourd’hui" : `Série : ${result.streak} jour${result.streak > 1 ? "s" : ""} !`}
            <span className="mono text-[12px] text-[var(--ink-faint)]">record {result.bestStreak}</span>
          </p>
          <Link href="/" className="btn btn-primary">Retour au hub <Icon name="arrowRight" size={16} strokeWidth={2.5} /></Link>
        </div>
      )}
    </div>
  );
}

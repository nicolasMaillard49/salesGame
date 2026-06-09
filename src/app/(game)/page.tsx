import Link from "next/link";
import { getStore } from "@/lib/db";
import { getDailyObjection, getObjections, getQuiz, getScenarios } from "@/lib/content";
import { RANKS, decayedScore, isRusty, masteryLevel, progressToNextRank, rankForXp } from "@/lib/progression";
import { SKILL_LABELS, type SkillId } from "@/lib/types";
import Icon, { type IconName } from "@/components/Icon";
import ArtisanAvatar from "@/components/ArtisanAvatar";
import MasterySection, { type MasteryRow } from "@/components/MasterySection";
import { BOSSES } from "@/lib/bosses";

export const dynamic = "force-dynamic";

const ROMAN = ["I", "II", "III", "IV", "V"];

function Ring({ ratio }: { ratio: number }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(7,20,14,.08)" strokeWidth="11" />
      <circle cx="66" cy="66" r={r} fill="none" stroke="url(#ringG)" strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0.04, ratio))} />
      <defs>
        <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#19e487" />
          <stop offset="1" stopColor="#028a55" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function trainHref(skill: string): string {
  return skill.startsWith("obj_") ? `/drill?skill=${skill}` : `/quiz?skill=${skill}`;
}

export default async function HubPage() {
  const store = getStore();
  const [{ progress, mastery }, trends] = await Promise.all([store.getSnapshot(), store.getTrends()]);
  const rank = rankForXp(progress.xpTotal);
  const rankIdx = RANKS.findIndex((r) => r.name === rank.name);
  const next = progressToNextRank(progress.xpTotal);
  // server component (async) : timestamp par requête, pas de render client
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const rows: MasteryRow[] = (Object.entries(mastery) as [SkillId, { score: number; attempts: number; updatedAt?: number | null }][])
    .map(([skill, m]) => {
      const s = decayedScore(m.score, m.updatedAt ?? null, now);
      return {
        skill,
        label: SKILL_LABELS[skill],
        score: s,
        attempts: m.attempts,
        weak: s < 0.5,
        rusty: isRusty(m.updatedAt ?? null, now),
        level: masteryLevel(s),
        trend: trends[skill] ?? null,
      };
    })
    .sort((a, b) => a.score - b.score);

  // Reco de session : priorités = rouillées d'abord, puis plus faibles (parmi les jouées)
  const priorities = rows
    .filter((r) => r.attempts > 0)
    .sort((a, b) => Number(b.rusty) - Number(a.rusty) || a.score - b.score)
    .slice(0, 2);

  // Teaser conversation (carte "reprends ton appel")
  const objs = getObjections();
  const teaser = objs.find((o) => o.id === "obj_bouche_a_oreille") ?? objs[0];
  const teaserGood = teaser?.options.find((o) => o.quality === "good");

  const today = new Date().toISOString().slice(0, 10);
  const daily = getDailyObjection(today);
  const dailyDone = progress.lastDay === today;

  const modes: { href: string; title: string; desc: string; count: string; icon: IconName; color: string }[] = [
    { href: "/quiz", title: "Quiz", desc: "Mémorise scripts & prix", count: `${getQuiz().length} questions`, icon: "brain", color: "#7b4fe0" },
    { href: "/drill", title: "Drill objections", desc: "Réponds vite et juste", count: `${objs.length} objections`, icon: "shield", color: "#ff5d6c" },
    { href: "/sim", title: "Simulateur d'appel", desc: "Mène un appel complet", count: `${getScenarios().length} scénarios`, icon: "phone", color: "#19c3e4" },
    { href: "/sim?closing=1", title: "Closing intensif", desc: "Le site est posé, à toi de closer", count: "6 étapes de closing", icon: "target", color: "#ff5d6c" },
    { href: "/prospect", title: "Vrai prospect", desc: "Répète sur un artisan réel", count: "appel sur-mesure", icon: "worker", color: "#00c06a" },
    { href: "/boss", title: "Boss d'objection", desc: "Bats les artisans coriaces", count: `${BOSSES.length} boss`, icon: "shield", color: "#ff9d2e" },
    { href: "/duel", title: "Duel", desc: "Défie un collègue", count: "même tirage", icon: "target", color: "#4b7bff" },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Suivi mémoire */}
      {store.backend === "memory" && (
        <p className="mono text-[11px] text-[#9a6a00] bg-[var(--ok-wash)] border border-[rgba(232,163,23,.3)] rounded-xl px-3 py-2">
          Suivi local (Supabase non connecté) — la progression repart à zéro au redémarrage.
        </p>
      )}

      {/* HERO + CONVERSATION (2 colonnes sur desktop) */}
      <div className="grid lg:grid-cols-2 gap-[18px] items-stretch">
      {/* HERO */}
      <section className="glass hero reveal" style={{ animationDelay: "0.05s" }}>
        <div className="ring-wrap">
          <Ring ratio={next.ratio} />
          <div className="ring-center">
            <div>
              <div className="display text-3xl">{ROMAN[rankIdx] ?? "I"}</div>
              <div className="eyebrow mt-1">Niveau</div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-[200px] relative z-[1]">
          <p className="eyebrow">Rang actuel</p>
          <h1 className="display text-[clamp(30px,5vw,42px)]">{rank.name}</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">
            {next.next ? (
              <>Plus que <b className="text-[var(--green-deep)]">{next.remaining} XP</b> pour atteindre <b>{next.next}</b>.</>
            ) : (
              <>Rang maximum atteint.</>
            )}
          </p>
          <p className="flex items-baseline gap-2 mt-3.5">
            <b className="mono text-[26px] text-[var(--green-deep)]">{progress.xpTotal}</b>
            {next.next && <small className="mono text-[12px] text-[var(--ink-faint)]">/ {progress.xpTotal + next.remaining} XP</small>}
          </p>
        </div>
      </section>

      {/* CONVERSATION FEATURE */}
      {teaser && teaserGood && (
        <section className="glass reveal !p-0 overflow-hidden flex flex-col" style={{ animationDelay: "0.12s" }}>
          <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-[var(--glass-edge)]">
            <span className="flex items-center gap-2.5 display text-base">
              <Icon name="chat" size={18} className="text-[var(--green-deep)]" />
              Entraîne-toi sur un appel
            </span>
            <span className="phase-dots"><i className="on" /><i className="on" /><i /><i /><i /></span>
          </div>
          <div className="px-[22px] py-5 flex flex-col justify-center gap-3 flex-1 bg-[linear-gradient(180deg,rgba(255,255,255,.25),transparent)]">
            <div className="convo-msg convo-them">
              <span className="convo-who overflow-hidden"><ArtisanAvatar metier="plombier" size={30} className="rounded-[9px]" /></span>
              <div className="convo-body"><span className="block mono text-[9px] tracking-[.14em] uppercase opacity-60 mb-0.5">Artisan</span>{teaser.artisanLine}</div>
            </div>
            <div className="convo-msg convo-me">
              <span className="convo-who" />
              <div className="convo-body"><span className="block mono text-[9px] tracking-[.14em] uppercase opacity-70 mb-0.5">Bonne réponse</span>{teaserGood.text}</div>
            </div>
          </div>
          <div className="flex items-center justify-between px-[22px] py-4 gap-3 flex-wrap">
            <span className="flex items-center gap-2.5">
              <span className="face-stack flex -space-x-2">
                {["plombier", "couvreur", "paysagiste"].map((m) => (
                  <ArtisanAvatar key={m} metier={m} size={26} className="rounded-full ring-2 ring-[var(--glass)]" />
                ))}
              </span>
              <span className="mono text-[12px] text-[var(--ink-faint)]">12 phases · l&apos;artisan réagit en live</span>
            </span>
            <Link href="/sim" className="btn btn-primary">Lancer un appel <Icon name="arrowRight" size={16} strokeWidth={2.5} /></Link>
          </div>
        </section>
      )}
      </div>

      {/* DÉFI DU JOUR */}
      {daily && (
        <Link href="/quotidien" className="glass mode reveal !flex flex-row items-center gap-4" style={{ animationDelay: "0.16s" }}>
          <span className="mode-ic" style={{ color: "var(--bad)", background: "linear-gradient(135deg, rgba(255,93,108,.16), rgba(255,157,46,.1))", borderColor: "rgba(255,93,108,.25)" }}>
            <Icon name="flame" size={24} />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="display text-lg">Défi du jour</h3>
              {progress.streak > 0 && (
                <span className="combo-badge" style={{ fontSize: "12px", padding: "4px 10px" }}>
                  <Icon name="flame" size={12} /> {progress.streak} j
                </span>
              )}
            </div>
            <p className="text-[var(--ink-soft)] text-[13.5px] mt-0.5">
              {dailyDone ? "Relevé aujourd'hui — reviens demain pour entretenir ta série." : `Relève l'objection du jour : ${SKILL_LABELS[daily.id]}.`}
            </p>
          </div>
          <span className="mono text-[12px] shrink-0" style={{ color: dailyDone ? "var(--green-deep)" : "var(--ink-faint)" }}>
            {dailyDone ? "✓ Fait" : "Relever →"}
          </span>
        </Link>
      )}

      {/* RECO DE SESSION */}
      {priorities.length > 0 && (
        <section className="glass reveal p-5 flex items-center gap-4 flex-wrap" style={{ animationDelay: "0.17s" }}>
          <span className="mode-ic" style={{ color: "#19c3e4", background: "linear-gradient(135deg, #19c3e428, #19c3e410)", borderColor: "#19c3e440" }}>
            <Icon name="target" size={24} />
          </span>
          <div className="flex-1 min-w-[200px]">
            <h3 className="display text-lg">Ta prochaine séance</h3>
            <p className="text-[var(--ink-soft)] text-[13.5px] mt-0.5">
              Concentre-toi sur {priorities.map((p) => p.label).join(" et ")}
              {priorities.some((p) => p.rusty) ? " — à rafraîchir." : "."}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {priorities.map((p) => (
              <Link key={p.skill} href={trainHref(p.skill)} className="btn btn-glass" style={{ fontSize: "13px", minHeight: "40px", padding: "8px 16px" }}>
                {p.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* MODES */}
      <section className="grid sm:grid-cols-3 gap-3.5 reveal" style={{ animationDelay: "0.18s" }}>
        {modes.map((m) => (
          <Link key={m.href} href={m.href} className="glass mode">
            <span className="mode-ic" style={{ color: m.color, background: `linear-gradient(135deg, ${m.color}28, ${m.color}10)`, borderColor: `${m.color}40` }}>
              <Icon name={m.icon} size={24} />
            </span>
            <h3 className="display text-lg mt-4">{m.title}</h3>
            <p className="text-[var(--ink-soft)] text-[13.5px] mt-1">{m.desc}</p>
            <span className="mt-[18px] flex items-center justify-between">
              <span className="mono text-[12px] text-[var(--green-deep)] font-semibold">{m.count}</span>
              <span className="mode-arr"><Icon name="arrowRight" size={16} strokeWidth={2.5} /></span>
            </span>
          </Link>
        ))}
      </section>

      {/* MAÎTRISE */}
      <MasterySection rows={rows} />

      {/* BIBLIOTHÈQUE */}
      <Link href="/fiches" className="glass mode reveal flex-row items-center gap-4 !flex" style={{ animationDelay: "0.3s" }}>
        <span className="mode-ic"><Icon name="book" size={24} /></span>
        <div className="flex-1">
          <h3 className="display text-lg">Bibliothèque de fiches</h3>
          <p className="text-[var(--ink-soft)] text-[13.5px] mt-0.5">Tous les scripts, techniques et réponses aux objections — à réviser entre deux parties.</p>
        </div>
        <span className="mode-arr"><Icon name="arrowRight" size={18} strokeWidth={2.5} /></span>
      </Link>
    </div>
  );
}

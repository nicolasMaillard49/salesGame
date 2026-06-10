import Link from "next/link";
import { getDailyObjection } from "@/lib/content";
import { getActiveOffer } from "@/lib/offer-server";
import { getStore } from "@/lib/db";
import QuotidienGame from "./QuotidienGame";

export const dynamic = "force-dynamic";

export default async function QuotidienPage() {
  const today = new Date().toISOString().slice(0, 10);
  const offer = await getActiveOffer();
  const obj = getDailyObjection(today, offer);
  const { progress } = await getStore().getSnapshot();

  if (!obj) {
    return (
      <div className="glass p-6">
        <p>Pas d’objection du jour disponible.</p>
        <Link href="/" className="mono text-sm text-[var(--green-deep)]">← Hub</Link>
      </div>
    );
  }
  return (
    <QuotidienGame
      objection={obj}
      alreadyDone={progress.lastDay === today}
      streak={progress.streak}
    />
  );
}

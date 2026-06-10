import Link from "next/link";
import { getQuiz } from "@/lib/content";
import { getActiveOffer } from "@/lib/offer-server";
import { isSkillId } from "@/lib/types";
import QuizGame from "./QuizGame";

export const dynamic = "force-dynamic";

export default async function QuizPage({ searchParams }: { searchParams: Promise<{ skill?: string }> }) {
  const { skill } = await searchParams;
  const offer = await getActiveOffer();
  let items = getQuiz(offer);
  if (skill && isSkillId(skill)) {
    const filtered = items.filter((q) => q.skill === skill);
    if (filtered.length >= 3) items = filtered;
  }
  if (items.length === 0) {
    return (
      <div className="glass p-6">
        <p>Aucune question pour l’instant.</p>
        <Link href="/" className="mono text-sm text-[var(--green-deep)]">← Hub</Link>
      </div>
    );
  }
  return <QuizGame items={items} />;
}

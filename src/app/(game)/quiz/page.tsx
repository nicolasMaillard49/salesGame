import Link from "next/link";
import { getQuiz } from "@/lib/content";
import QuizGame from "./QuizGame";

export const dynamic = "force-dynamic";

export default function QuizPage() {
  const items = getQuiz();
  if (items.length === 0) {
    return (
      <div className="card p-6">
        <p>Aucune question de quiz pour l’instant.</p>
        <Link href="/" className="text-[var(--color-violet-bright)] text-sm">← Hub</Link>
      </div>
    );
  }
  return <QuizGame items={items} />;
}

import { getObjections } from "@/lib/content";
import DuelGame from "./DuelGame";

export const dynamic = "force-dynamic";

export default async function DuelPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  return <DuelGame objections={getObjections()} challenge={c ?? null} />;
}

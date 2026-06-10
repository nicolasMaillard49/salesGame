import { getObjections } from "@/lib/content";
import { getActiveOffer } from "@/lib/offer-server";
import DuelGame from "./DuelGame";

export const dynamic = "force-dynamic";

export default async function DuelPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const offer = await getActiveOffer();
  return <DuelGame objections={getObjections(offer)} challenge={c ?? null} />;
}

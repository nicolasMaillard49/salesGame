import { getObjections } from "@/lib/content";
import { getBosses } from "@/lib/bosses";
import { getActiveOffer } from "@/lib/offer-server";
import BossGame from "./BossGame";

export const dynamic = "force-dynamic";

export default async function BossPage() {
  const offer = await getActiveOffer();
  return <BossGame bosses={getBosses(offer)} objections={getObjections(offer)} />;
}

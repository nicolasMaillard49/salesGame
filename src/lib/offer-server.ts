import "server-only";
import { cookies } from "next/headers";
import { OFFER_COOKIE, isOffer, type Offer } from "./types";

// Lit le parcours actif (Sites Web / Google Ads) depuis le cookie, côté serveur.
export async function getActiveOffer(): Promise<Offer> {
  const v = (await cookies()).get(OFFER_COOKIE)?.value;
  return isOffer(v) ? v : "web";
}

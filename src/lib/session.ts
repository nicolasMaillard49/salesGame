import "server-only";
import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
export const SESSION_COOKIE = "sg_session";
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 jours

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/** Crée un token de session signé (auth réussie). */
export function createSessionToken(): string {
  const payload = b64url(Buffer.from(JSON.stringify({ a: 1, iat: Date.now() })));
  return `${payload}.${sign(payload)}`;
}

/** Vérifie la signature et la fraîcheur du token. */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  // comparaison à temps constant
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.a !== 1 || typeof data.iat !== "number") return false;
    return Date.now() - data.iat < MAX_AGE_S * 1000;
  } catch {
    return false;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_S;

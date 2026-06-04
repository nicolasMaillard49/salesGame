# Sales Game

Jeu d'entraînement à la vente (prospection + closing) basé sur la matière de formation.
Next.js 16 · React 19 · Tailwind v4 · TypeScript.

## Lancer

```bash
npm install
npm run dev      # http://localhost:3000
```

Mot de passe d'accès : **0902** (variable `APP_PASSWORD` dans `.env.local`).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de dev |
| `npm run build` / `npm run start` | Build + prod |
| `npm test` | Tests Vitest (logique progression + validation contenu) |
| `npm run lint` | ESLint |

## Contenu (extensible)

La matière pédagogique vit dans `content/` — **éditable sans toucher au code** :
- `quiz.json` — 180 questions QCM / textes à trous
- `objections.json` — **102 objections** (16 types × variantes) + réponses qualifiées (good/ok/bad)
- `scenarios.json` — scénarios du simulateur (personas + 7 phases)
- `fiches.json` — 33 fiches de révision (bibliothèque `/fiches`)

Les **boss d'objection** sont définis dans `src/lib/bosses.ts` (7 boss : nom, métier, PV, pool d'objections).
Ajouter un **nouveau type d'objection** = enregistrer son `SkillId` dans `src/lib/types.ts`
(`OBJECTION_SKILLS` + `SKILL_LABELS`) **puis** ajouter ses items dans `objections.json`.

Schémas validés par Zod (`src/lib/content/schema.ts`). Source brute dans `source/`.
Pour ajouter du contenu : ajoute des entrées dans ces JSON (les tests vérifient la validité).

## Simulateur (Haiku)

`/api/sim` appelle Anthropic Haiku (`ANTHROPIC_API_KEY` dans `.env.local`) pour jouer l'artisan
et générer 3 options qualifiées. Sans clé ou en cas d'échec → fallback scripté (mode démo).

## Suivi de progression (Supabase)

Par défaut : **fallback mémoire** (repart à zéro au redémarrage).
Pour activer le suivi persistant :

1. Crée un projet Supabase (ou local : `npx supabase init && npx supabase start`).
2. Applique `supabase/migrations/0001_init.sql`.
3. Renseigne `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`.

L'app bascule automatiquement sur Supabase dès que ces deux variables sont remplies.

## Sécurité

- Auth = simple porte mot de passe (cookie signé HMAC), hors Supabase.
- Clés (Anthropic, Supabase) **jamais exposées au client** : tout passe par des routes API serveur.
- `.env.local` est gitignored.

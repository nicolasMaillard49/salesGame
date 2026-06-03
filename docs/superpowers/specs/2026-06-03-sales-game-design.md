# sales-game — Spec design (V1)

> Date : 2026-06-03 · Statut : approuvé (design global), V1 en construction autonome.

## But

Web-app de gamification pour monter en compétence sur la prospection et le closing, basée sur la matière de formation (Sendpage / Léo) + techniques de closing. Outil personnel, mono-utilisateur.

## Décisions cadrées

| Sujet | Décision |
|---|---|
| Format | Hub + 3 mini-jeux + progression globale |
| Interaction | 100 % texte, répliques à choix multiples |
| IA | Anthropic **Haiku** (simulateur uniquement) |
| Plateforme | Web Next.js / React |
| Options simulateur | **Hybride** : ancrées dans les scripts + variation Haiku |
| Progression | XP/rangs + déblocages + stats de maîtrise par compétence |
| Auth | **Hors Supabase** : porte mot de passe `0902`, vérifiée côté serveur, cookie signé |
| Persistance | **Supabase** (DB only), accès via routes API Next |
| Contenu | Couche JSON extensible (plus de data à venir) |

## Architecture

- **Next.js App Router + React 19 + Tailwind v4 + TypeScript**.
- **Porte mot de passe** : `/login` → `POST /api/auth` (compare à `APP_PASSWORD=0902`) → cookie httpOnly signé (`HMAC` avec `AUTH_SECRET`). `middleware.ts` protège toutes les routes sauf `/login` et assets.
- **Supabase = base de données** seulement. Accès **exclusivement côté serveur** (routes API Next, clé `service_role`). Aucune clé (Supabase/Haiku) exposée au client.
- **Haiku** via `POST /api/sim` (SDK `@anthropic-ai/sdk`, modèle `claude-haiku-4-5`).
- Persistance : voir couche `lib/db` (interface) + implémentation Supabase. Fallback en mémoire/JSON local si Supabase indisponible (le jeu reste jouable, le suivi est dégradé).

## Compétences trackées (clé de voûte de la maîtrise)

`ouverture`, `decouverte`, `douleurs`, `ambitions`, `pont`, `presentation`, `prix_close`, et une par objection : `obj_reflechir`, `obj_femme_associe`, `obj_trop_cher`, `obj_pas_maintenant`, `obj_deja_essaye`, `obj_rappelle`, `obj_bouche_a_oreille`, `obj_seul`, `obj_deja_appele`, `obj_site_sans_trafic`, `obj_prix_mail`.

## Couche contenu (`content/`)

Source de vérité pédagogique, validée par schémas Zod (`lib/content/schema.ts`). **Extensible** : ajouter une entrée = ajouter un objet JSON, zéro changement de code.

### `content/quiz.json`
```ts
QuizItem = {
  id: string
  skill: SkillId
  type: "qcm" | "trou"        // QCM ou texte à trous
  prompt: string
  options?: string[]           // pour qcm
  answer: string | number      // index (qcm) ou texte attendu (trou)
  explanation: string
  difficulty: 1 | 2 | 3
}
```

### `content/objections.json`
```ts
Objection = {
  id: string                   // = SkillId d'objection
  label: string                // "C'est trop cher"
  artisanLine: string          // ce que dit l'artisan
  options: { text: string; quality: "good" | "ok" | "bad"; feedback: string }[]
  difficulty: 1 | 2 | 3
}
```

### `content/scenarios.json`
Arbre des 7 phases pour le simulateur. Chaque nœud porte un **rubric** (objectif + bonne intention) qui guide Haiku.
```ts
Scenario = {
  id: string
  persona: { metier: string; ville: string; humeur: string; contexte: string }
  difficulty: 1 | 2 | 3
  phases: PhaseNode[]
}
PhaseNode = {
  phase: SkillId               // ouverture, decouverte, ...
  objectif: string             // rubric pour Haiku
  artisanSeed?: string         // amorce optionnelle de l'artisan
  bonneIntention: string       // ce qu'une bonne réplique doit faire
}
```

## Modèle de données Supabase

```sql
create table sessions (
  id uuid primary key default gen_random_uuid(),
  game_type text not null,            -- 'quiz' | 'drill' | 'sim'
  scenario_id text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  score int default 0,
  xp int default 0
);

create table answers (
  id bigserial primary key,
  session_id uuid references sessions(id) on delete cascade,
  skill text not null,
  item_ref text,
  quality text not null,              -- 'good' | 'ok' | 'bad'
  chosen text,
  time_ms int,
  created_at timestamptz default now()
);

create table progress (
  id int primary key default 1,       -- singleton (check id = 1)
  xp_total int default 0,
  rank text default 'Débutant',
  unlocked jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);

create table mastery (
  skill text primary key,
  score real default 0,               -- 0..1 taux de réussite glissant
  attempts int default 0,
  updated_at timestamptz default now()
);
```

## Logique de progression (`lib/progression.ts` — pure, testée)

- **XP par réponse** : good = 10, ok = 4, bad = 0 (× multiplicateur de difficulté). Bonus simulateur si phase complétée.
- **Rangs** (paliers XP) : Débutant (0) → Apprenti (200) → Closer (600) → Top Closer (1500) → Légende (3500).
- **Maîtrise par compétence** : moyenne glissante de la qualité (good=1, ok=0.5, bad=0), `score = score*(1-α) + q*α` avec α=0.25. Affiche les compétences faibles (< 0.5).
- **Déblocages** : scénarios/objections de difficulté 2 à XP≥600, difficulté 3 à XP≥1500 (ou maîtrise moyenne seuil).

## Flux simulateur (`/api/sim`)

1. Client envoie `{ scenarioId, phaseIndex, history }`.
2. Serveur charge le `PhaseNode` (objectif + bonneIntention) + persona.
3. Appel Haiku avec system prompt : « tu joues un artisan français [persona], réagis à la dernière réplique, puis propose 3 options de réponse pour le commercial — une *good* (suit le rubric), une *ok*, une *bad* — au format JSON strict ».
4. Parse JSON (1 retry si invalide → sinon **fallback** : options scriptées issues du scénario).
5. Client affiche réplique + options ; le choix est scoré (`quality`), enregistré, et fait avancer la phase.

## Gestion d'erreurs

- Haiku indispo / JSON invalide → fallback scripté ; le simulateur reste jouable.
- Supabase indispo → persistance dégradée (mémoire) + bandeau d'info ; quiz/drill jouables.
- Pas de `ANTHROPIC_API_KEY` → simulateur en mode démo scripté.

## Tests

- `lib/progression` : XP, rangs, maîtrise glissante, déblocages (unitaires, Vitest).
- `lib/content/schema` : validation des 3 JSON de contenu.
- `/api/sim` : parsing + fallback avec Haiku mocké.
- Smoke : build Next + lancement.

## Arborescence cible

```
sales-game/
├─ source/                  # matière brute (déjà là)
├─ content/                 # quiz.json, objections.json, scenarios.json
├─ supabase/                # migrations SQL
├─ src/
│  ├─ app/
│  │  ├─ login/             # porte mdp
│  │  ├─ (game)/            # hub + jeux (protégés)
│  │  │  ├─ page.tsx        # hub + dashboard
│  │  │  ├─ quiz/
│  │  │  ├─ drill/
│  │  │  └─ sim/
│  │  └─ api/               # auth, sim, sessions, progress
│  ├─ lib/                  # db, progression, content, anthropic
│  └─ components/
├─ middleware.ts
└─ .env.local               # ANTHROPIC_API_KEY, APP_PASSWORD, AUTH_SECRET, SUPABASE_*
```

## Hors périmètre V1 (YAGNI)

- Multi-utilisateurs / comptes.
- Vocal / audio.
- Génération de contenu par IA hors simulateur.
- Déploiement cloud (local d'abord ; migration Supabase cloud documentée pour plus tard).

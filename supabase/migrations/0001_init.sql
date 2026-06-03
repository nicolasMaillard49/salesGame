-- sales-game — schéma initial (suivi de progression)

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  game_type text not null,
  scenario_id text,
  started_at timestamptz default now(),
  ended_at timestamptz,
  score int default 0,
  xp int default 0
);

create table if not exists answers (
  id bigserial primary key,
  session_id uuid references sessions(id) on delete cascade,
  skill text not null,
  item_ref text,
  quality text not null check (quality in ('good','ok','bad')),
  chosen text,
  time_ms int,
  created_at timestamptz default now()
);
create index if not exists answers_session_idx on answers(session_id);
create index if not exists answers_skill_idx on answers(skill);

create table if not exists progress (
  id int primary key default 1 check (id = 1),
  xp_total int default 0,
  rank text default 'Débutant',
  unlocked jsonb default '[]'::jsonb,
  updated_at timestamptz default now()
);
insert into progress (id) values (1) on conflict (id) do nothing;

create table if not exists mastery (
  skill text primary key,
  score real default 0,
  attempts int default 0,
  updated_at timestamptz default now()
);

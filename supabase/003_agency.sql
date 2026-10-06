-- ARK305 · Fase Agencia: perfiles públicos estilo Linkme + analítica de clics.
-- Pégalo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- NOTA: este archivo se entrega, NO se aplica remotamente desde aquí.

-- ---------- Perfiles de la agencia ----------
create table if not exists public.agency_profiles (
  id           uuid primary key default gen_random_uuid(),
  handle       text unique not null check (handle ~ '^[a-z0-9._]{2,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio          text not null default '' check (char_length(bio) <= 160),
  tagline      text not null default '' check (char_length(tagline) <= 80),
  avatar_url   text check (avatar_url is null or char_length(avatar_url) <= 500),
  cover_url    text check (cover_url is null or char_length(cover_url) <= 500),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists agency_profiles_handle_idx on public.agency_profiles (handle);

-- ---------- Links del perfil ----------
create table if not exists public.agency_links (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.agency_profiles (id) on delete cascade,
  kind       text not null check (kind in ('social', 'product', 'link')),
  section    text not null default 'links' check (char_length(section) <= 30),
  title      text not null check (char_length(title) between 1 and 80),
  subtitle   text not null default '' check (char_length(subtitle) <= 80),
  url        text not null check (char_length(url) between 1 and 500),
  image_url  text check (image_url is null or char_length(image_url) <= 500),
  position   integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists agency_links_profile_idx on public.agency_links (profile_id, section, position);

-- ---------- Clics (analítica, sin PII) ----------
create table if not exists public.agency_clicks (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.agency_profiles (id) on delete cascade,
  link_id    uuid references public.agency_links (id) on delete set null,
  clicked_at timestamptz not null default now(),
  referrer   text check (referrer is null or char_length(referrer) <= 500),
  user_agent text check (user_agent is null or char_length(user_agent) <= 500)
);
create index if not exists agency_clicks_profile_idx on public.agency_clicks (profile_id, clicked_at desc);
create index if not exists agency_clicks_link_idx on public.agency_clicks (link_id);

-- updated_at automático (idempotente aunque schema.sql no se haya corrido)
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists agency_profiles_touch on public.agency_profiles;
create trigger agency_profiles_touch
  before update on public.agency_profiles
  for each row execute function public.touch_updated_at();

-- ---------- RLS ----------
alter table public.agency_profiles enable row level security;
alter table public.agency_links enable row level security;
alter table public.agency_clicks enable row level security;

-- Lectura pública: solo perfiles y links activos (la página /p/[handle]).
drop policy if exists "agency_profiles_public_read" on public.agency_profiles;
create policy "agency_profiles_public_read" on public.agency_profiles
  for select using (is_active = true);
drop policy if exists "agency_links_public_read" on public.agency_links;
create policy "agency_links_public_read" on public.agency_links
  for select using (is_active = true);

-- Escritura: solo usuarios con sesión (el panel).
drop policy if exists "agency_profiles_auth_write" on public.agency_profiles;
create policy "agency_profiles_auth_write" on public.agency_profiles
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
drop policy if exists "agency_links_auth_write" on public.agency_links;
create policy "agency_links_auth_write" on public.agency_links
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Clics: cualquiera puede insertar (tracking anónimo); leer solo con sesión.
drop policy if exists "agency_clicks_public_insert" on public.agency_clicks;
create policy "agency_clicks_public_insert" on public.agency_clicks
  for insert with check (true);
drop policy if exists "agency_clicks_auth_read" on public.agency_clicks;
create policy "agency_clicks_auth_read" on public.agency_clicks
  for select using (auth.role() = 'authenticated');

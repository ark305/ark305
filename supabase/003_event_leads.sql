-- ARK Video · leads del evento (reservas y solicitudes de videógrafos desde /video).
-- Pégalo en Supabase → SQL Editor → Run. Se puede correr más de una vez.
-- El público solo puede INSERTAR; leer, editar o borrar los leads requiere la service_role (panel de Supabase).

create table if not exists public.event_leads (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  name         text not null check (char_length(name) between 1 and 80),
  email        text check (email is null or char_length(email) <= 120),
  phone        text check (phone is null or char_length(phone) <= 30),
  instagram    text check (instagram is null or char_length(instagram) <= 60),
  videographer text,
  package      text,
  price        numeric,
  slot         text,
  brief        text check (brief is null or char_length(brief) <= 800),
  plan_title   text,
  locale       text not null default 'es',
  source       text not null default 'ark-video',
  check (email is not null or phone is not null)
);

alter table public.event_leads enable row level security;

drop policy if exists "event_leads_public_insert" on public.event_leads;
create policy "event_leads_public_insert" on public.event_leads
  for insert to anon, authenticated with check (true);

grant insert on public.event_leads to anon, authenticated;

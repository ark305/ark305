-- ARK305 · Experiencias Lifestyle / Business y feed que aprende.
-- Pégalo en Supabase → SQL Editor → Run (después de schema.sql). Se puede correr más de una vez.

-- Qué le interesa a cada persona: lifestyle, business o las dos.
alter table public.profiles add column if not exists experience text
  check (experience is null or experience in ('lifestyle', 'business', 'both'));

-- Gustos que aprende el feed (tema → puntos). Solo lo lee y escribe su dueño a través de la app.
alter table public.profiles add column if not exists taste jsonb not null default '{}'::jsonb;

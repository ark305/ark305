-- ARK305 · Reservas reales: catálogo de servicios de lujo, disponibilidad y reservas.
-- Pégalo en Supabase → SQL Editor → Run (después de schema.sql). Se puede correr más de una vez.
--
-- Reglas:
--   · Catálogo y disponibilidad: lectura pública.
--   · Reservar, cancelar y cambiar estado: SOLO vía funciones (book_slot, cancel_booking,
--     set_booking_status), que validan quién es la persona y bloquean el horario de forma atómica.
--   · Nadie puede editar slots o reservas directamente con la llave pública.
--   · Cada cliente ve solo sus reservas; el proveedor ve las de sus servicios.

-- 1. Catálogo (se llama catalog_services porque public.services ya son los servicios de los perfiles).
create table if not exists public.catalog_services (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  type          text not null check (type in ('driver', 'yacht', 'chef', 'videographer', 'photographer', 'cleaning')),
  description   text not null default '',
  price         numeric(10, 2) not null check (price >= 0),
  price_unit    text not null,
  provider_name text not null,
  provider_id   uuid references auth.users on delete set null,
  rating        numeric(2, 1) check (rating between 0 and 5),
  image_url     text,
  created_at    timestamptz not null default now()
);

-- 2. Horarios disponibles.
create table if not exists public.availability_slots (
  id          uuid primary key default gen_random_uuid(),
  service_id  uuid not null references public.catalog_services on delete cascade,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  available   boolean not null default true,
  check (end_time > start_time),
  unique (service_id, date, start_time)
);
create index if not exists availability_slots_date_idx on public.availability_slots (date, service_id);

-- 3. Reservas.
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  service_id  uuid not null references public.catalog_services on delete restrict,
  slot_id     uuid not null references public.availability_slots on delete restrict,
  status      text not null default 'confirmed'
              check (status in ('requested', 'confirmed', 'en_route', 'arrived', 'in_service', 'done', 'cancelled')),
  guests      int not null default 1 check (guests between 1 and 50),
  notes       text check (notes is null or char_length(notes) <= 500),
  price       numeric(10, 2) not null,
  price_unit  text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- Un horario solo puede tener una reserva activa.
create unique index if not exists bookings_one_active_per_slot on public.bookings (slot_id) where status <> 'cancelled';
create index if not exists bookings_user_idx on public.bookings (user_id, created_at desc);

-- 4. Seguridad (RLS).
alter table public.catalog_services   enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings           enable row level security;

drop policy if exists catalog_read on public.catalog_services;
create policy catalog_read on public.catalog_services for select using (true);

drop policy if exists slots_read on public.availability_slots;
create policy slots_read on public.availability_slots for select using (true);

drop policy if exists bookings_read_own on public.bookings;
create policy bookings_read_own on public.bookings for select to authenticated using (
  user_id = auth.uid()
  or exists (select 1 from public.catalog_services s where s.id = service_id and s.provider_id = auth.uid())
);

revoke insert, update, delete on public.catalog_services, public.availability_slots, public.bookings from anon, authenticated;
grant select on public.catalog_services, public.availability_slots to anon, authenticated;
grant select on public.bookings to authenticated;

-- 5. Reservar: bloquea el horario y crea la reserva en una sola operación.
--    Si otra persona lo tomó primero, lanza 'slot_taken' y no cambia nada.
create or replace function public.book_slot(p_slot uuid, p_guests int default 1, p_notes text default null)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  s   public.availability_slots;
  svc public.catalog_services;
  b   public.bookings;
begin
  if auth.uid() is null then raise exception 'auth_required' using errcode = '28000'; end if;

  update public.availability_slots set available = false
   where id = p_slot and available
     and (date + start_time) > (now() at time zone 'America/New_York')
  returning * into s;
  if not found then raise exception 'slot_taken' using errcode = 'P0001'; end if;

  select * into svc from public.catalog_services where id = s.service_id;
  insert into public.bookings (user_id, service_id, slot_id, guests, notes, price, price_unit)
  values (auth.uid(), svc.id, s.id, greatest(1, least(coalesce(p_guests, 1), 50)), left(p_notes, 500), svc.price, svc.price_unit)
  returning * into b;
  return b;
end $$;

-- 6. Cancelar: solo el cliente, antes de que el proveedor salga. Libera el horario.
create or replace function public.cancel_booking(p_booking uuid)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare b public.bookings;
begin
  if auth.uid() is null then raise exception 'auth_required' using errcode = '28000'; end if;
  update public.bookings set status = 'cancelled', updated_at = now()
   where id = p_booking and user_id = auth.uid() and status in ('requested', 'confirmed')
  returning * into b;
  if not found then raise exception 'not_cancellable' using errcode = 'P0001'; end if;
  update public.availability_slots set available = true where id = b.slot_id;
  return b;
end $$;

-- 7. Estado del servicio: solo el proveedor dueño del servicio, y solo hacia adelante.
create or replace function public.set_booking_status(p_booking uuid, p_status text)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  b     public.bookings;
  steps text[] := array['requested', 'confirmed', 'en_route', 'arrived', 'in_service', 'done'];
begin
  if auth.uid() is null then raise exception 'auth_required' using errcode = '28000'; end if;
  select bk.* into b from public.bookings bk
    join public.catalog_services s on s.id = bk.service_id
   where bk.id = p_booking and s.provider_id = auth.uid()
   for update of bk;
  if not found then raise exception 'not_allowed' using errcode = 'P0001'; end if;
  if b.status = 'cancelled' or coalesce(array_position(steps, p_status), 0) <= array_position(steps, b.status) then
    raise exception 'bad_transition' using errcode = 'P0001';
  end if;
  update public.bookings set status = p_status, updated_at = now() where id = b.id returning * into b;
  return b;
end $$;

revoke all on function public.book_slot(uuid, int, text), public.cancel_booking(uuid), public.set_booking_status(uuid, text) from public, anon;
grant execute on function public.book_slot(uuid, int, text), public.cancel_booking(uuid), public.set_booking_status(uuid, text) to authenticated;

-- 8. Catálogo inicial: seis servicios de Miami (proveedores de ejemplo; IDs fijos para poder correrlo varias veces).
insert into public.catalog_services (id, name, type, description, price, price_unit, provider_name, rating, image_url) values
  ('11111111-1111-1111-1111-000000000001', 'Private driver',  'driver',       'Chofer privado en SUV de lujo por Miami.',             85,  'hour',   'Elite Drive MIA',   4.9, null),
  ('11111111-1111-1111-1111-000000000002', '60ft yacht',      'yacht',        'Yate de 60 pies con capitán por la bahía de Biscayne.', 450, 'hour',   'Biscayne Yacht Co', 5.0, null),
  ('11111111-1111-1111-1111-000000000003', 'Private chef',    'chef',         'Chef privado en tu residencia o a bordo.',             150, 'person', 'Chef Laurent',      4.8, null),
  ('11111111-1111-1111-1111-000000000004', 'Videographer',    'videographer', 'Videógrafo para eventos y contenido.',                 750, 'day',    'ARK Films',         5.0, null),
  ('11111111-1111-1111-1111-000000000005', 'Photographer',    'photographer', 'Fotógrafo para eventos, retratos y residencias.',      500, 'day',    'Luz Studio',        4.9, null),
  ('11111111-1111-1111-1111-000000000006', 'Home cleaning',   'cleaning',     'Limpieza profesional de residencias.',                 45,  'hour',   'Pristine MIA',      4.7, null)
on conflict (id) do nothing;

-- 9. Disponibilidad de hoy y los próximos 13 días, de 8am a 10pm en bloques de 2 horas.
insert into public.availability_slots (service_id, date, start_time, end_time)
select s.id, d::date, make_time(h, 0, 0), make_time(h + 2, 0, 0)
  from public.catalog_services s
 cross join generate_series(current_date, current_date + 13, interval '1 day') d
 cross join generate_series(8, 20, 2) h
on conflict (service_id, date, start_time) do nothing;

-- El yate de 6pm a 8pm del sábado 17 de octubre ya está tomado (para mostrar cómo ARK IA maneja conflictos).
update public.availability_slots set available = false
 where service_id = '11111111-1111-1111-1111-000000000002' and date = '2026-10-17' and start_time = '18:00'
   and not exists (select 1 from public.bookings b where b.slot_id = availability_slots.id);

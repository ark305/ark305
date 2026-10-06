-- ARK305 · Agencia: datos semilla — perfil @itakaark.
-- Requiere 003_agency.sql. Se puede correr más de una vez (upsert por handle).
-- NOTA: se entrega, NO se aplica remotamente desde aquí.

insert into public.agency_profiles (handle, display_name, bio, tagline, avatar_url, cover_url, is_active)
values (
  'itakaark',
  '@itakaark',
  'Emprendedor entre Miami y Latinoamérica. Marca, contenido y tecnología.',
  'Descubre. Conecta. Crea. Crece.',
  'https://medialinks.ark305.com/uploads/img/b6/b6415e9cdbed7cfd9ab7f94c983bc033b0aa0c348f4612b0430f67cd03ff0b8f.webp',
  'https://medialinks.ark305.com/uploads/img/b6/b6415e9cdbed7cfd9ab7f94c983bc033b0aa0c348f4612b0430f67cd03ff0b8f.webp',
  true
)
on conflict (handle) do update set
  display_name = excluded.display_name,
  bio = excluded.bio,
  tagline = excluded.tagline,
  avatar_url = excluded.avatar_url,
  cover_url = excluded.cover_url,
  is_active = true,
  updated_at = now();

-- Limpia los links previos del perfil para que la semilla sea idempotente.
delete from public.agency_links
where profile_id = (select id from public.agency_profiles where handle = 'itakaark');

insert into public.agency_links (profile_id, kind, section, title, subtitle, url, image_url, position) values
-- Destacado
((select id from public.agency_profiles where handle = 'itakaark'), 'product', 'destacado', 'Libro Todo Conectado — $5', 'La entrada al sistema', 'https://buy.stripe.com/6oUcN75zR09zg59dHwd3i0C', '/agency/todo-conectado-cover.jpg', 0),
-- Productos
((select id from public.agency_profiles where handle = 'itakaark'), 'product', 'productos', 'Pack Implementación — $47', 'Todo Conectado, paso a paso', 'https://buy.stripe.com/cNi5kF5zRbSh5qv1YOd3i0D', null, 1),
((select id from public.agency_profiles where handle = 'itakaark'), 'product', 'productos', 'Workshop en Vivo — $97', 'Tu primer sistema IA', 'https://buy.stripe.com/cNi6oJ9Q72hH06bgTId3i0G', null, 2),
((select id from public.agency_profiles where handle = 'itakaark'), 'product', 'productos', 'Auditoría IA Express — $297', 'Para negocios no digitalizados', 'https://buy.stripe.com/bJe28tgev09z4mrfPEd3i0F', null, 3),
((select id from public.agency_profiles where handle = 'itakaark'), 'product', 'productos', 'Curso Todo Conectado — $497', 'Preventa', 'https://buy.stripe.com/28EdRb2nF1dD4mr7j8d3i0E', null, 4),
-- Herramientas
((select id from public.agency_profiles where handle = 'itakaark'), 'link', 'herramientas', 'Tu CRM con IA (HighLevel)', '$97/mes', 'https://www.gohighlevel.com/?fp_ref=ark-305-77', null, 5),
((select id from public.agency_profiles where handle = 'itakaark'), 'link', 'herramientas', 'ark305.com', 'La plataforma', 'https://ark305.com', null, 6),
-- Redes sociales
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@itakaark', 'Instagram · Personal', 'https://www.instagram.com/itakaark', null, 10),
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@arkbillionaire', 'Instagram', 'https://www.instagram.com/arkbillionaire', null, 11),
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@itakaarkfitness', 'Instagram', 'https://www.instagram.com/itakaarkfitness', null, 12),
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@arkproservices', 'Instagram', 'https://www.instagram.com/arkproservices', null, 13),
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@ark305university', 'Instagram', 'https://www.instagram.com/ark305university', null, 14),
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@ark305realty', 'Instagram', 'https://www.instagram.com/ark305realty', null, 15),
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@itakavolthome', 'Instagram', 'https://www.instagram.com/itakavolthome', null, 16),
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@gobiernodelorinoco', 'Instagram', 'https://www.instagram.com/gobiernodelorinoco', null, 17),
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@ark305group', 'TikTok', 'https://www.tiktok.com/@ark305group', null, 18),
((select id from public.agency_profiles where handle = 'itakaark'), 'social', 'redes', '@ARK305GROUP', 'YouTube', 'https://www.youtube.com/@ARK305GROUP', null, 19);

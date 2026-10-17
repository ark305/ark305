# Archie · configuración del backend de ARK305

Proyecto **ARK305 Life OS** · entorno `master` · id `a9726866-7936-4111-8505-9093aba8f639`.

El front usa el esquema que Archie ya generó (`member`, `provider`, `service_offering`, `experience_booking`, `experience_package`, `event`, `plan`, `files`) y le suma unos campos para lo que la app ya hacía: perfil público `@usuario`, galería, redes, Diagnóstico ARK, gustos del feed y el catálogo bilingüe.

Orden: **1 → 3 → 4 → 5**. Sin el paso 1 la app no puede leer ni guardar perfiles.

Los campos del paso 1 también están en código, listos para aplicar, en `archie/schema-additions.json`.

---

## 1. Campos nuevos (Data → cada tabla → Add field)

Todos aceptan vacío (nullable) salvo donde dice otra cosa. En GraphQL salen en camelCase (`photo_url` → `photoUrl`).

### `member`

| Campo | Tipo | Notas |
|---|---|---|
| `auth_id` | varchar(64) | **único**. Id del usuario de Archie Auth dueño del perfil |
| `handle` | varchar(30) | **único**. ark305.com/@handle |
| `kind` | varchar(20) | no nulo, default `member` (member, provider, creator, remote, brand) |
| `role` | varchar(60) | no nulo, default `''` |
| `role_en` | varchar(60) | |
| `area` | varchar(60) | no nulo, default `''` |
| `tagline` | varchar(80) | no nulo, default `''` |
| `tagline_en` | varchar(80) | |
| `photo_url` | varchar(500) | |
| `banner_url` | varchar(500) | |
| `gallery` | jsonb | no nulo, default `[]` |
| `instagram` | varchar(200) | |
| `tiktok` | varchar(200) | |
| `facebook` | varchar(200) | |
| `bio_link` | boolean | no nulo, default `false` |
| `shared` | boolean | no nulo, default `false` |
| `followers` | integer | no nulo, default `0` |
| `near` | boolean | no nulo, default `false` |
| `is_private` | boolean | no nulo, default `false` (solo lo ve el nivel VIP) |
| `experience` | varchar(20) | lifestyle, business o both |
| `taste` | jsonb | no nulo, default `{}` |
| `diagnosis` | jsonb | |
| `ai_day` | date | límite diario de ARK IA |
| `ai_count` | integer | no nulo, default `0` |
| `is_demo_data` | boolean | no nulo, default `false` |

### `provider`

| Campo | Tipo | Notas |
|---|---|---|
| `member_id` | uuid | relación → `member.id`, al borrar: SET NULL |

(`is_demo_data` ya existe.)

### `service_offering`

| Campo | Tipo | Notas |
|---|---|---|
| `slug` | varchar(40) | **único**. Id del catálogo que usa el front (`yacht`, `chef`…) |
| `title_en` | varchar(80) | |
| `description_en` | text | |
| `kicker` | varchar(30) | |
| `kicker_en` | varchar(30) | |
| `detail` | varchar(80) | |
| `detail_en` | varchar(80) | |
| `action` | varchar(10) | no nulo, default `book` (book, request, view) |
| `photo_url` | varchar(500) | |
| `position` | integer | no nulo, default `0` |
| `unit` | varchar(2) | h = por hora, p = por persona, f = fija, m = mensual |
| `hours` | jsonb | opciones de horas, ej. `[2,3,4]` |
| `outing` | boolean | no nulo, default `false` (salidas que necesitan chofer) |
| `is_demo_data` | boolean | no nulo, default `false` |

### `experience_package`

`slug` varchar(40) único · `title_en` varchar(80) · `description_en` text · `photo_url` varchar(500) · `items` jsonb · `is_demo_data` boolean default `false`

### `event`

`slug` varchar(40) único · `title_en` varchar(80) · `photo_url` varchar(500) · `going` integer default `0` · `is_demo_data` boolean default `false`

### `plan`

`slug` varchar(20) único · `name_en` varchar(60) · `is_demo_data` boolean default `false`

---

## 2. Permisos

No se tocan en este cambio. Los permisos de los roles se quedan como están en Archie.

---

## 3. Almacenamiento de fotos (App Services → File Storage)

Activar **Archie Storage**. Sin esto, subir fotos falla con `STORAGE_NOT_ENABLED`.

Revisar que la URL que devuelve una subida sea permanente (no una URL firmada que vence). Si vence, hay que guardar el `fileId` y pedir la URL al mostrarla.

---

## 4. Llaves y variables

En **Settings → API Keys** copia la llave **Anon API Key** (ya existe, rol Guest). Si no se puede ver, crea una nueva con rol Guest.

`.env.local` (y en Vercel):

```
NEXT_PUBLIC_ARCHIE_PROJECT_ID=a9726866-7936-4111-8505-9093aba8f639
NEXT_PUBLIC_ARCHIE_ENVIRONMENT=master
NEXT_PUBLIC_ARCHIE_API_URL=https://archie-core.services.archie.com
NEXT_PUBLIC_ARCHIE_ANON_KEY=anon ...
```

Confirma con el equipo de Archie que `NEXT_PUBLIC_ARCHIE_API_URL` es la URL correcta del gateway (la del GraphQL es `https://archie-core.services.archie.com/graphql`).

En **Archie Auth → Allowed redirect URIs** agrega `https://ark305.com` y `http://localhost:3000`.

---

## 5. Datos de ejemplo

Crea una llave de API con rol **Operator (Admin)** (solo para esto; bórrala después) y corre:

```bash
ARCHIE_SEED_KEY="..." npx tsx scripts/seed-archie.ts
```

Carga los 21 perfiles de ejemplo, sus proveedores, los 18 servicios del catálogo + la vitrina de Lente 305, los 4 días armados, los 3 eventos y los 3 niveles. Todo queda con `is_demo_data = true`. Se puede correr otra vez sin duplicar.

Archie solo tiene 7 categorías de servicio (driver, yacht, chef, videographer, photographer, cleaner, security). Helicóptero, mesas VIP, botellas y restaurante quedaron en la más cercana; conviene agregar categorías (por ejemplo `air`, `nightlife`, `dining`) al enum `service_category_type`.

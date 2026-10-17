# ARK305 — app

La app real de ARK305, hecha con el diseño nuevo (negro, dorado y crema).

## Cómo abrirla en tu compu

```bash
npm install
npm run dev
```

Luego abre http://localhost:3000.

## Cómo funciona

Una sola cuenta con **dos modos** (se cambian con el interruptor del Perfil o del menú ☰):

- **Buscar:** feed de la comunidad, Mi día con ARK IA, Descubrir y Comunidad.
- **Ofrecer:** Panel, Crear, Gana dinero y Comunidad.

Y **tres niveles**: Personal (gratis), Business y Súper Premium VIP (incluye ARK Private).
Por ahora el modo y el nivel se guardan en el navegador y cambiar de nivel no cobra nada.

## Pantallas

| Dirección | Pantalla |
|---|---|
| `/` | Inicio (Buscar): feed, historias y ARK IA |
| `/mi-dia` | Mi día: ARK IA arma tu día, días armados y reserva |
| `/descubrir` | Buscar personas por tipo de perfil |
| `/panel` | Panel (Ofrecer): reservas, ventas, ARK IA para vender y herramientas |
| `/crear` · `/ganar` | Crear y Gana dinero (Ofrecer) |
| `/equipo` | Armar equipo con ARK IA (Business) |
| `/revender` | Revender paquetes con tu margen y tu marca (Business · Ofrecer) |
| `/documentos` | Presupuestos, contratos, facturas y reportes (Business) |
| `/talento` | Talento (Business): 138 posiciones presenciales y remotas |
| `/comunidad` | Academia, Equipos, Grupos y Eventos |
| `/niveles` | Personal, Business y Súper Premium VIP |
| `/private` | ARK Private (solo VIP; código de prueba ARKPRIVATE) |
| `/perfil` | Tu perfil, con el interruptor de modo y tu nivel |
| `/@usuario` | Perfil público de cualquier persona (por ejemplo `/@lente305`) |

## Dónde está cada cosa

- `src/app/` — una carpeta por pantalla.
- `src/components/` — piezas que se repiten (barra de abajo, perfil, íconos).
- `src/lib/dictionaries/` — todos los textos en español (`es.ts`) e inglés (`en.ts`).
- `src/lib/archie/` — conexión con Archie (configuración, GraphQL, sesión en el servidor y en el teléfono).
- `src/lib/profiles-db.ts` y `src/lib/actions.ts` — leer y guardar perfiles, servicios, gustos, diagnóstico y reservas en Archie.
- `src/lib/mock-data.ts`, `catalog.ts`, `levels.ts`, `community.ts`, `private.ts` — datos de ejemplo. El script `scripts/seed-archie.ts` los carga en Archie.
  Las fotos de ejemplo son de Unsplash (licencia libre) y se reemplazan por las fotos reales de cada proveedor.
- `src/proxy.ts` — hace que `ark305.com/@usuario` abra el perfil.

## Backend: Archie

El backend es el proyecto **ARK305 Life OS** en Archie (base de datos, API GraphQL, inicio de sesión y fotos). La app se conecta con el SDK de Archie (`@archie/js-sdk` y `@archie/react-sdk`).

- **Cuentas:** correo y contraseña con Archie Auth. La sesión vive en el navegador; el token se copia a la cookie `ark_token` para que el servidor sepa quién eres, y el servidor lo verifica con las llaves públicas de Archie.
- **Perfiles:** tabla `member` (con `handle`, galería, redes, diagnóstico y gustos). Quien ofrece servicios tiene un `provider` y sus `service_offering`.
- **Reservas:** "Reservar todo" en Mi día crea una `experience_booking` por servicio.
- **Fotos:** almacenamiento de Archie (`files`).

Para configurarlo sigue `docs/archie-setup.md` (campos nuevos, permisos, fotos, llaves y datos de ejemplo). Copia `.env.example` a `.env.local` y llena la llave anon. Sin esas variables la app funciona en modo demo, con el perfil de ejemplo.

## Experiencias

- **Lifestyle** (dorado): experiencias, Mi día con IA, reservar.
- **Business** (azul acero): talento, equipos, revender paquetes, documentos.
- **Las dos**: feed mixto con selector Todo · Lifestyle · Business.

La persona elige al registrarse (o la primera vez que abre la app) y lo cambia en su perfil.
El feed aprende de lo que ves, guardas, reservas y ocultas (`src/lib/taste.ts`).

Niveles: **Gratis**, **Pro** ($79/mes) y **Súper Premium VIP** ($2,500/mes). Las tarifas de ARK están en `/niveles`.

## Idioma

La app se abre en inglés si el teléfono está en inglés y en español en los demás casos. Se cambia en el menú (☰) del perfil.

## Estado

**Fase 1:** las pantallas son reales, pero los datos son de ejemplo. ARK IA es una vista previa que entiende palabras clave; la IA completa llega en la Fase 5. Los botones que todavía no funcionan muestran "Muy pronto en ARK305".

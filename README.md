# ARK305 — app

La app real de ARK305, hecha con el diseño nuevo (negro, dorado y crema).

> **Para entender el proyecto:** consulte la [guía del producto, estado actual y líneas de trabajo](docs/GUIA_DEL_PROYECTO.md). Distingue las funciones implementadas, las demostraciones y las prioridades propuestas; algunas referencias a fases en este README son anteriores al código actual.

## Cómo abrirla en tu compu

```bash
npm run install:apps
npm run dev:api
# En otra terminal:
npm run dev
```

Abrir http://localhost:3100. La API Nest escucha en http://127.0.0.1:3001/api/v1.

## Organización y configuración actual

- `frontend/`: aplicación Next completa, pruebas web, recursos públicos, package y lockfile propios.
- `backend/`: Nest, pruebas y dependencias independientes.
- `supabase/`: esquema y migraciones compartidas; no se aplican automáticamente.
- El `package.json` raíz solo delega comandos. No hay workspace npm ni imports de código entre las aplicaciones.

Configurar `frontend/.env.local` desde `frontend/.env.example` y `backend/.env.local` desde `backend/.env.example`. La web recibe únicamente configuración pública de Supabase y `ARK_API_URL`; las variables Meta y los secretos pertenecen al servidor. El antiguo `.env.local` raíz no es utilizado por los lanzadores y no debe copiarse completo al frontend.

Comprobar desde la raíz: `npm run test:web`, `npm run test:api`, `npm run lint`, `npm run typecheck`, `npm run build` y `npm run build:api`.

En Vercel, el proyecto web deberá usar **Root Directory: frontend**, y el backend su configuración independiente. Este cambio local no modifica ni publica despliegues remotos. Las secciones históricas siguientes describen también demostraciones, no garantías de implementación.

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

- `frontend/src/app/` — una carpeta por pantalla.
- `frontend/src/components/` — piezas que se repiten (barra de abajo, perfil, íconos).
- `frontend/src/lib/dictionaries/` — todos los textos en español (`es.ts`) e inglés (`en.ts`).
- `frontend/src/lib/mock-data.ts`, `catalog.ts`, `levels.ts`, `community.ts`, `private.ts` — datos de ejemplo. En la Fase 2 se cambian por datos reales de Supabase.
  Las fotos de ejemplo son de Unsplash (licencia libre) y se reemplazan por las fotos reales de cada proveedor.
- `frontend/src/proxy.ts` — hace que `ark305.com/@usuario` abra el perfil.

## Cuentas (Fase 2)

Inicio de sesión con enlace al correo y perfiles reales en Supabase.

1. En Supabase → SQL Editor, corre `supabase/schema.sql` (tablas, reglas de privacidad y carpeta de fotos).
2. Copiar `frontend/.env.example` a `frontend/.env.local` y configurar la URL y la clave pública del proyecto, además de `ARK_API_URL`.
3. En Vercel agrega las mismas dos variables.

Sin esas variables la app funciona en modo demo, con el perfil de ejemplo.

## Experiencias

- **Lifestyle** (dorado): experiencias, Mi día con IA, reservar.
- **Business** (azul acero): talento, equipos, revender paquetes, documentos.
- **Las dos**: feed mixto con selector Todo · Lifestyle · Business.

La persona elige al registrarse (o la primera vez que abre la app) y lo cambia en su perfil.
El feed aprende de lo que ves, guardas, reservas y ocultas (`frontend/src/lib/taste.ts`).
Para guardar la experiencia y los gustos en la cuenta, corre también `supabase/002_experiences.sql`.

Niveles: **Gratis**, **Pro** ($79/mes) y **Súper Premium VIP** ($2,500/mes). Las tarifas de ARK están en `/niveles`.

## Idioma

La app se abre en inglés si el teléfono está en inglés y en español en los demás casos. Se cambia en el menú (☰) del perfil.

## Estado

**Fase 1:** las pantallas son reales, pero los datos son de ejemplo. ARK IA es una vista previa que entiende palabras clave; la IA completa llega en la Fase 5. Los botones que todavía no funcionan muestran "Muy pronto en ARK305".

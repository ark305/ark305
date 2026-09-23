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
| `/comunidad` | Academia, Equipos, Grupos y Eventos |
| `/niveles` | Personal, Business y Súper Premium VIP |
| `/private` | ARK Private (solo VIP; código de prueba ARKPRIVATE) |
| `/perfil` | Tu perfil, con el interruptor de modo y tu nivel |
| `/@usuario` | Perfil público de cualquier persona (por ejemplo `/@lente305`) |

## Dónde está cada cosa

- `src/app/` — una carpeta por pantalla.
- `src/components/` — piezas que se repiten (barra de abajo, perfil, íconos).
- `src/lib/dictionaries/` — todos los textos en español (`es.ts`) e inglés (`en.ts`).
- `src/lib/mock-data.ts`, `catalog.ts`, `levels.ts`, `community.ts`, `private.ts` — datos de ejemplo. En la Fase 2 se cambian por datos reales de Supabase.
  Las fotos de ejemplo son de Unsplash (licencia libre) y se reemplazan por las fotos reales de cada proveedor.
- `src/proxy.ts` — hace que `ark305.com/@usuario` abra el perfil.

## Idioma

La app se abre en inglés si el teléfono está en inglés y en español en los demás casos. Se cambia en el menú (☰) del perfil.

## Estado

**Fase 1:** las pantallas son reales, pero los datos son de ejemplo. ARK IA es una vista previa que entiende palabras clave; la IA completa llega en la Fase 5. Los botones que todavía no funcionan muestran "Muy pronto en ARK305".

# ARK305 — app

La app real de ARK305, hecha con el diseño nuevo (negro, dorado y crema).

## Cómo abrirla en tu compu

```bash
npm install
npm run dev
```

Luego abre http://localhost:3000.

## Pantallas

| Dirección | Pantalla |
|---|---|
| `/` | Inicio: funciones y Concierge IA |
| `/perfil` | Tu perfil, con la lista "Hazte visible" |
| `/@usuario` | Perfil público de cualquier persona (por ejemplo `/@lente305`) |
| `/descubrir` | Buscar personas y servicios |
| `/ganar` | Gana dinero |
| `/crear` | Crear |

## Dónde está cada cosa

- `src/app/` — una carpeta por pantalla.
- `src/components/` — piezas que se repiten (barra de abajo, perfil, íconos).
- `src/lib/dictionaries/` — todos los textos en español (`es.ts`) e inglés (`en.ts`).
- `src/lib/mock-data.ts` — perfiles y servicios de ejemplo. En la Fase 2 se cambian por datos reales de Supabase.
- `src/proxy.ts` — hace que `ark305.com/@usuario` abra el perfil.

## Idioma

La app se abre en inglés si el teléfono está en inglés y en español en los demás casos. Se cambia en el menú (☰) del perfil.

## Estado

**Fase 1:** las pantallas son reales, pero los datos son de ejemplo. Los botones que todavía no funcionan muestran "Muy pronto en ARK305".

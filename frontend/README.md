# Web ARK305

Aplicación Next.js independiente. Ejecutar desde esta carpeta:

```sh
npm ci
npm run dev
```

La web escucha en http://localhost:3100. Configurar `.env.local` usando `.env.example`; Nest debe estar disponible en `ARK_API_URL`. No incluir claves de Meta ni claves secretas de Supabase en este paquete.

`src/app/` contiene rutas y adaptadores web; `src/components/`, la interfaz; `public/`, recursos estáticos; `test/`, pruebas web. Los datos y reglas del servidor pertenecen a `../backend/` y se consumen por HTTP, nunca mediante imports entre aplicaciones.

Comprobaciones: `npm test`, `npm run lint`, `npm run typecheck` y `npm run build`.

En Vercel, seleccionar esta carpeta como raíz del proyecto web. No se modifica el despliegue remoto al mover los archivos localmente.

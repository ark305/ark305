# Recorrido principal de Mi día

El plan creado con Meta puede convertirse en solicitudes individuales de interés a través de Next.js y NestJS. Una solicitud con estado `received` solo confirma recepción: no garantiza disponibilidad, proveedor, precio, reserva ni cobro.

## Ruta local

1. Configurar las variables públicas de Supabase para la web e iniciar sesión.
2. Configurar NestJS con `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`, aplicar la migración de solicitudes al entorno local autorizado e iniciar `npm run dev:api`.
3. Iniciar Next.js con `npm run dev -- --port 3100` para no ocupar el puerto 3000 del otro proyecto. La web usa `ARK_API_URL` del entorno del servidor; si se omite, llama a `http://127.0.0.1:3001`.
4. En Mi día, generar o añadir servicios, elegir una fecha común y enviar. Consultar el historial para confirmar qué solicitudes recibió NestJS.

La integración requiere una sesión válida y la tabla `public.service_requests` creada. El navegador no llama directamente a NestJS: usa `POST` y `GET /api/service-requests` en Next.js, que reenvía solo el Bearer y el JSON permitido al API autenticado `POST`/`GET /api/v1/service-requests`.

`ARK_API_URL` debe ser un origen HTTP de loopback o HTTPS, sin credenciales, ruta, consulta ni fragmento. Se configura solo en el servidor Next.js. No se reenvían cookies, claves de Supabase ni destinos proporcionados por el navegador; las redirecciones se rechazan y las solicitudes tienen un límite de cinco segundos.

## Envío y resultados

- Cada elemento se guarda como una solicitud individual, en orden, con la misma fecha seleccionada.
- La fecha se bloquea en el componente al iniciar el primer envío, incluso si una solicitud es rechazada. Así, los artículos restantes del mismo carrito conservan una fecha común.
- El horario y la cantidad se envían como texto de preferencias; no se transmiten precios, anticipos ni prioridad.
- Los éxitos permanecen marcados aunque otra solicitud falle. Un clic duplicado no vuelve a enviar elementos recibidos.
- Si se pierde la respuesta o falla el servicio, el resultado se marca como incierto: actualizar el historial antes de decidir qué hacer. No hay reintento automático y el estado no implica rollback.
- Al cerrar sesión o cambiar de cuenta, se vacían el historial y los estados asociados a la sesión anterior; los envíos pendientes se detienen antes de usar el nuevo token.

Los estados de prevención de duplicados viven solo mientras el componente está montado; el contrato Nest no ofrece idempotencia persistente. Tras recargar, la interfaz consulta el historial y reconcilia solicitudes coincidentes. Si un resultado incierto no aparece allí, revisar el historial antes de decidir un reenvío manual. El carrito sigue en el almacenamiento local existente y no se convierte en una reserva.

## Comprobaciones

Sin credenciales reales ni llamadas de red, desde la raíz del repositorio:

```powershell
node --test test/ai-route.test.mjs test/service-requests.test.mjs test/day-requests.test.mjs
npm run lint -- src/app/api/service-requests/route.ts src/lib/service-requests.ts src/components/day-requests.tsx src/components/day-planner.tsx src/lib/dictionaries/es.ts src/lib/dictionaries/en.ts test/service-requests.test.mjs test/day-requests.test.mjs
```

La verificación de extremo a extremo requiere Supabase local autorizado, la migración aplicada, NestJS configurado e inicio de sesión. Las pruebas HTTP de la web usan dependencias simuladas y no verifican una escritura real.

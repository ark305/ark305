# Recorrido principal: solicitudes desde Mi día

Desde Mi día, el usuario puede convertir elementos del plan en solicitudes individuales de interés. Una solicitud recibida confirma únicamente que el API recibió la petición: no representa disponibilidad, proveedor confirmado, reserva ni cobro.

## Comprobar la interfaz

1. Configurar `frontend/.env.local` y la URL `ARK_API_URL` para que Next pueda alcanzar el API de desarrollo.
2. Iniciar la web desde la raíz con `npm run dev`; se utiliza el puerto `3100`.
3. Iniciar sesión y abrir `/mi-dia`.
4. Añadir elementos, elegir una fecha y enviar. Consultar el historial de solicitudes para ver el estado informado por el API.

La ruta web `/api/service-requests` actúa como adaptador HTTP. El navegador no recibe la URL del API ni credenciales privadas. La preparación y los comandos del servicio se mantienen en la documentación del repositorio independiente `../ark305-api`.

## Comportamiento visible

- Cada elemento se envía como una solicitud independiente; no se combinan en una reserva.
- Los elementos del mismo envío conservan la fecha seleccionada.
- Los éxitos recibidos se mantienen aunque otra solicitud falle; un clic duplicado no vuelve a enviar elementos confirmados durante la misma sesión de interfaz.
- Si la respuesta se pierde o el servicio falla, el resultado puede ser incierto. Actualice el historial antes de decidir un reenvío manual; no hay reintento automático.
- Cambiar de cuenta o cerrar sesión limpia la información asociada a la cuenta anterior y descarta respuestas de sesión obsoletas.
- Los textos de horario o cantidad son preferencias del usuario; no equivalen a precios, anticipos ni prioridad.

El flujo de estados visible es **Recibida → En gestión → Cerrada**. La cancelación puede estar disponible mientras la solicitud no sea terminal. Los estados terminales no se presentan como reabribles.

## Pruebas web

```sh
node --test frontend/test/ai-route.test.mjs frontend/test/service-requests.test.mjs frontend/test/day-requests.test.mjs
```

Estas pruebas usan dependencias simuladas. No crean solicitudes reales, no llaman a Meta y no modifican servicios remotos.

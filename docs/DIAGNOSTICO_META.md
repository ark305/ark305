# Diagnóstico de ARK305 con Meta

La experiencia de diagnóstico se presenta en la web y envía los turnos al API configurado. El navegador no se conecta directamente al proveedor de IA ni contiene sus credenciales.

## Recorrido de interfaz

1. La persona responde el cuestionario en `/diagnostico`.
2. Next conserva la conversación de interfaz, valida el formato y envía el turno mediante la ruta web `/api/ai`.
3. La ruta adapta la solicitud al API configurado en `ARK_API_URL`.
4. La respuesta se valida antes de actualizar las respuestas visibles y mostrar la procedencia devuelta por el servicio.
5. Al finalizar, `/snapshot` solicita el resultado al API; la web no mantiene una implementación local alternativa del cálculo.

La aplicación contempla los recorridos `individual`, `earner`, `company` y `enterprise`. Los datos guardados en cuenta tienen prioridad frente a las respuestas locales; si el servicio no está disponible, se informa el error y se permite reintentar.

## Límites y configuración

- La web contiene el esquema del cuestionario, validación de interfaz, estado de conversación y presentación.
- La web no debe contener secretos del proveedor, prompts privados, cuotas, credenciales administrativas ni llamadas directas al proveedor.
- `ARK_API_URL` es una variable de servidor de Next.js; no debe usar el prefijo `NEXT_PUBLIC_`.
- Las credenciales y límites privados de IA se configuran en el repositorio independiente del API (`../ark305-api`), no en este paquete.
- No se garantiza disponibilidad de producción por el hecho de que la interfaz y el adaptador existan localmente.

## Comprobación local

Las pruebas web cubren formatos de entrada/salida, cancelación o cambio de sesión y errores de transporte sin llamadas reales al proveedor:

```sh
node --test frontend/test/diagnosis-ai.test.mjs frontend/test/diagnosis-ui.test.mjs frontend/test/ai-route.test.mjs
```

La configuración de un proveedor real y sus pruebas operativas corresponden al equipo del API. No use credenciales reales ni cambie datos remotos para comprobar la interfaz.

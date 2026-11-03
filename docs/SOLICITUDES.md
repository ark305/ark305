# Solicitudes en la interfaz web

Una solicitud expresa interés del cliente. No confirma una reserva, disponibilidad, cobro ni compromiso de un proveedor.

## Recorrido

- La página `/solicitudes` muestra el historial de la cuenta activa.
- Mi día permite enviar elementos como solicitudes individuales y consultar su resultado.
- La interfaz presenta la vista administrativa solo cuando el API informa que la sesión tiene ese permiso; los datos del perfil editables por el usuario no determinan el acceso.
- El historial muestra eventos recibidos del servicio y no inventa transiciones.

## Estados que muestra el producto

El flujo es **Recibida → En gestión → Cerrada**. Una solicitud abierta puede cancelarse según el estado actual. **Cerrada** y **Cancelada** son estados terminales; la interfaz no ofrece reabrirlos.

## Errores y seguridad de interacción

- Los errores de autenticación o disponibilidad se muestran como errores; no se convierten en una lista vacía.
- Ante conflicto o resultado incierto, actualizar el historial antes de decidir otra acción. La interfaz no repite automáticamente una escritura.
- Cambiar de cuenta, renovar la sesión o cerrar sesión invalida resultados asociados a la sesión anterior.
- Abortar una petición en el navegador no demuestra que el servicio no la haya recibido.
- Las pruebas web usan respuestas simuladas y no deben modificar solicitudes reales para comprobar el flujo.

Los estados, permisos, transiciones y detalles de persistencia forman parte del contrato del API independiente. Consulte `../ark305-api` para su documentación técnica; esta guía solo describe el comportamiento visible del frontend.

## Verificación local de la web

```sh
node --test frontend/test/service-requests.test.mjs frontend/test/day-requests.test.mjs frontend/test/requests-inbox.test.mjs frontend/test/requests-inbox-ui.test.mjs
```

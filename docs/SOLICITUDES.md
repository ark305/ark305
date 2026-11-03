# Gestión de solicitudes

Las solicitudes representan interés del cliente. No confirman reservas, disponibilidad, cobros ni compromisos de proveedores.

## Estados

El flujo permitido es **Recibida → En gestión → Cerrada**. Se puede cancelar desde Recibida o En gestión. Cerrada y Cancelada son terminales; no se permite reabrir ni repetir una transición.

## API administrativa de Nest

Todas las rutas requieren `Authorization: Bearer <sesión del usuario>`. El backend verifica la identidad y consulta el registro protegido de administradores. El campo profesional del perfil y los metadatos editables del usuario no conceden permisos.

| Método y ruta | Resultado |
| --- | --- |
| `GET /api/v1/admin/service-requests` | Últimas 50 solicitudes, ordenadas por creación e identificador descendentes; incluye `requesterId`. |
| `PATCH /api/v1/admin/service-requests/:id` | Cambia únicamente el estado y devuelve la solicitud actualizada. |

Ejemplo de cuerpo de transición:

Los identificadores UUID aceptan letras mayúsculas o minúsculas y se normalizan antes de comparar la respuesta del almacenamiento.

```json
{ "expectedStatus": "received", "status": "in_progress" }
```

- `400`: cuerpo, identificador o transición inválidos; no se realiza la escritura.
- `401`: falta una sesión válida.
- `403`: el usuario no es administrador.
- `409`: la solicitud ya cambió o no está disponible; actualizar la lista antes de decidir otra acción.
- `503`: no se pudo validar el almacenamiento o su respuesta. En una escritura, el resultado puede ser incierto: consultar de nuevo, no repetir automáticamente.

El estado esperado se compara en la misma actualización SQL. El trigger guarda el cambio y su evento en una sola transacción: ambos se confirman o ambos se revierten. Los clientes no pueden escribir estados ni eventos directamente.

## Alcance actual

El esquema y el administrador autorizado están configurados en Supabase. Los lectores propios de Nest y Next admiten los cuatro estados; crear una solicitud sigue produciendo únicamente `received`.

La API administrativa se implementa primero. La bandeja web y el endpoint de eventos son el siguiente paso; este documento no implica que ya estén disponibles. La UI no debe llamar directamente a funciones privilegiadas ni usar claves de servicio.

## Verificación local

```sh
npm --prefix backend test
npm --prefix backend run test:rls
node --test test/service-requests.test.mjs test/day-requests.test.mjs
```

La prueba RLS usa PostgreSQL 17 aislado en Docker, sin red y con identidades de prueba. No modifica Supabase remoto ni llama a Meta.

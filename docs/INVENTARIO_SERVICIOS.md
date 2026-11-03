# Inventario de servicios en el frontend

Este documento describe contenido que la interfaz presenta, no una oferta comercial confirmada. Los datos del catálogo incluyen ejemplos y deben verificarse antes de comunicar disponibilidad, precios o compromisos a clientes.

## Áreas representadas

| Área | Contenido visible | Límite de lectura |
|---|---|---|
| Experiencias | Servicios y paquetes para actividades, transporte, gastronomía y contenido | El catálogo de interfaz no confirma un proveedor ni disponibilidad. |
| Talento | Posiciones presenciales y remotas en distintas categorías | Los perfiles mostrados pueden ser ejemplos; no equivalen a profesionales verificados. |
| ARK Private | Residencias y servicios de lujo | El contenido de demostración no debe tratarse como inventario real. |
| Comunidad | Cursos, plantillas, grupos y eventos | El contenido visible no confirma autoría, acceso ni calendario vigentes. |
| Herramientas Business | Equipos, reventa y documentos | Algunas interacciones y estados son locales; no son transacciones financieras. |

Las categorías pueden solaparse. No sume filas o perfiles como si fueran ofertas comerciales únicas.

## Fuentes del frontend

- [Catálogo de experiencias](../frontend/src/lib/catalog.ts)
- [Posiciones de talento](../frontend/src/lib/talent.ts)
- [ARK Private](../frontend/src/lib/private.ts)
- [Contenido de comunidad](../frontend/src/lib/community.ts)
- [Herramientas de reventa](../frontend/src/lib/resale-store.ts)
- [Documentos de interfaz](../frontend/src/components/docs-view.tsx)

## Antes de presentar una oferta

Confirmar responsable, proveedor, alcance, precio, disponibilidad, condiciones de cancelación y forma de entrega. Si una operación requiere una solicitud o seguimiento, la interfaz muestra lo que informa el API independiente; una pantalla o respuesta de demostración no debe presentarse como reserva, pago ni disponibilidad garantizada.

Las reglas operativas, contratos HTTP y fuentes de datos pertenecen al repositorio independiente del API (`../ark305-api`). Esta documentación se limita al contenido y a las responsabilidades del frontend.

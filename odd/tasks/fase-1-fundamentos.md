# Fase 1: definición y preparación de ARK305
Objetivo: inventariar la oferta, elegir un piloto y preparar su base técnica y arquitectura. Rama: `dev`. Estrategia: `ask-on-risk`; primera entrega documental estimada en menos de 200 líneas.
Verificación: lectura estructural y enlaces para documentación; ejecución y pruebas funcionales se definirán al abordar T3. Estado: en curso; espejo Engram pendiente por errores de vinculación.

## Specs

- S1. Autorización de inicio: «listo entonces emoecemos kas faces». Aplicación: comenzar la fase 1 propuesta, sin resolver unilateralmente decisiones comerciales pendientes.
- S2. Planificación solicitada: «si se trabajaran en dev cual es el panorama de tareas, estipula las tareas para revisar las prioridades y asi mismo hacer un plan de accion». Mantener tareas, dependencias y resultados verificables en `dev`.
- S3. Público objetivo: «esto esta pensado para clientes high ticket clientes con un poder adquisitivo grande». Considerar atención, privacidad y operación al definir el piloto; no inventar acuerdos, proveedores ni tarifas.
- S4. Restricción de IA: «esperaremos a mañana generar ese api para poder realizar pruebas». Las llamadas reales a Meta quedan pendientes de la clave y autorización correspondiente; esta entrega no modifica IA.
- S5. MVP: «de mimento no hay proveedores confirmados esto es un mvp, la idea seria realizar interfaces de espera para ka comunicacion con esos proveedores para las integraciones futuras». No exigir proveedores confirmados para desarrollar; las interfaces son contratos del backend, no pantallas de espera.
- S6. Dirección técnica: «a las conexiones, hablaba de interfaces en el.back para ello, como es un mvp lo haremos en next usando fullstack, pero la idea es escalarlo a app movile , entonces seria bueno trabajar en el back full y haver pocas cosas en el front porque ae piensa migrar». Backend prioritario, Next.js fullstack y contratos reutilizables por una futura aplicación móvil; frontend limitado a presentación e interacción.
- S7. Cambio de framework aprobado: «trabajemos con nestJs para el back entonces y mantenganos next como wev para kas priebas». Sustituye Next.js como backend objetivo de S6 por NestJS independiente; conservar Next.js como cliente web.

## Tasks

- T1 [S1–S3, S5] Inventariar servicios: inventario técnico documentado; validación comercial diferida hasta incorporar proveedores, no bloquea el MVP. Ruta: inline, con mapa de lectura delegado porque los catálogos exceden el presupuesto de evidencia. Commit: pendiente.
- T2 [S1–S3, S5–S6] Definir recorrido técnico inicial: catálogo y solicitudes sin proveedor conectado como propuesta; no simular confirmaciones reales. Proveedor operativo no es requisito. Ruta: inline. Commit: pendiente.
- T3 [S1–S2, S4] Verificar entorno: pendiente; instalación reproducible, lint/build y definición de pruebas, sin usar producción. Ruta: por determinar según duración de verificaciones. Commit: pendiente.
- T4 [S1–S3, S5–S6] Diseñar arquitectura incremental: dirección backend-first documentada; contratos detallados y comprobación de entorno pendientes. Next.js como transporte HTTP, lógica independiente y adaptadores futuros de proveedores. Ruta: inline salvo que se active un motivo concreto de delegación. Commit: pendiente.

## Log

- L1. Solicitud de inicio, transcrita: «listo entonces emoecemos kas faces».
- L2. Se confirmó rama `dev`; README.md y docs/GUIA_DEL_PROYECTO.md tenían cambios previos sin commit. Se preservan y no se incorporan silenciosamente a otra unidad.
- L3. Inspección estática: catálogo de 18 servicios y 4 paquetes; talento con 138 posiciones; Private con 6 residencias y 12 servicios. Las cifras describen código de muestra, no oferta verificada.
- L4. Entregable inicial: docs/INVENTARIO_SERVICIOS.md. T1 no se cierra hasta validar responsables, tarifas, disponibilidad y operación del piloto. No se ejecutaron instalaciones, migraciones ni llamadas a proveedores.
- L5. Siguiente decisión necesaria: identificar el primer servicio que el negocio puede prestar con un proveedor confirmado. No se presupone reserva instantánea, cobro ni disponibilidad.
- L6. Corrección del usuario: «de mimento no hay proveedores confirmados esto es un mvp, la idea seria realizar interfaces de espera para ka comunicacion con esos proveedores para las integraciones futuras». Sustituye la exigencia de proveedor confirmado de L4–L5; el inventario comercial no bloquea el diseño técnico.
- L7. Aclaración del usuario: «a las conexiones, hablaba de interfaces en el.back para ello, como es un mvp lo haremos en next usando fullstack, pero la idea es escalarlo a app movile , entonces seria bueno trabajar en el back full y haver pocas cosas en el front porque ae piensa migrar». No se desarrollan pantallas de espera por esta aclaración.
- L8. Ajuste documental: backend reutilizable mediante API HTTP, casos de uso separados de React/Next y adaptadores de proveedores; sin integración real ni reescritura de aplicación en esta entrega.
- L9. Nueva instrucción: «trabajemos con nestJs para el back entonces y mantenganos next como wev para kas priebas». Primera unidad implementada y verificada en odd/tasks/backend-nestjs.md: backend Nest en backend/, web preservada. T3 dispone de lint/build web correctos; T4 cambia a NestJS. La migración de dominios y autenticación continúa pendiente.

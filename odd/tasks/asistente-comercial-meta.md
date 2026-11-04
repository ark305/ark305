# Asistente comercial con Meta
Objetivo: sustituir plantillas del panel por borradores con contexto real del servicio del usuario.
Repositorios: ark305 y ark305-api, rama dev. Estrategia: exception-ok autorizada, un commit funcional por repositorio sin push; node:test, TypeScript y lint.

## Specs
- S1. Usuario: «sube estos cambios a los repos y luego continua con esos pasos». Primero verificar publicación de Equipo; después implementar el asistente comercial del panel.
- S2. Alcance aceptado: «Redactar publicaciones usando los servicios del negocio», «Preparar respuestas a clientes, tomando su mensaje como contexto» y «Orientar precios, usando costos y márgenes proporcionados, sin inventar precios de mercado».
- S3. Alcance aceptado: «Todo pasaría por Nest, mostrando procedencia de Meta y errores reales. Serían borradores: sin publicar ni enviar automáticamente».
- S4. Conservar diagnóstico, Mi día y Equipo. No sustituir errores por plantillas ni consumir Meta durante pruebas automatizadas. Solo usar servicios del usuario autenticado, nunca el perfil demo del panel.

## Tasks
- T1 — S1 — inline — completado — ambos pushes confirmados Everything up-to-date; frontend b1493e6 y backend b9f8f2d.
- T2 — S2–S4 — inline — implementado y verificado; commit a7a7b12 — contrato seller-draft, servicio propio, cálculo de margen y pruebas backend; RED inicial por módulo inexistente, GREEN focal 17/17.
- T3 — S2–S4 — inline — implementado y verificado; commit contenedor `feat(web): add authenticated commercial draft assistant` — formularios, cliente y procedencia; RED cliente inexistente, GREEN focal 14/14.
- T4 — S2–S4 — delegado por riesgos 2/3/4 — verificado — frontend 96/96, backend 62/62, TypeScript y build correctos; revisiones nativas backend y frontend aprobadas sin hallazgos.

## Log
- L1. Usuario: «sube estos cambios a los repos y luego continua con esos pasos».
- L2. Mapeo de solo lectura confirmó fallback demo en panel y ProfilesPort reutilizable en Nest. La IA usará únicamente perfil y servicios recuperados para la identidad autenticada; los datos son declaraciones del usuario, no verificación de proveedores.
- L3. Supuesto visible: margen bruto sobre precio de venta; precio = costo / (1 − margen/100). No confundir precio publicado con costo. La tarjeta numérica se calcula en Nest, no por Meta.
- L4. Estimación: unas 500 líneas propias. Integración por etapas y sin publicación remota automática de cambios futuros. Guardado de propuestas de Equipo y conexión con solicitudes corresponden a la fase siguiente, separada de este documento.
- L5. Verificación independiente aprobada: 19 casos de propiedad y precios, logout durante sesión pendiente, cambio de cuenta durante petición y sesión/perfil incompatible. Seis casos diferenciales de AiService y 20 combinaciones del BFF conservaron resultados y argumentos respecto a b1493e6/b9f8f2d. Build frontend: 33 páginas; lint sin errores, advertencia previa en requests-inbox.tsx:63.
- L6. No se hicieron llamadas reales a Meta ni Supabase. Se detuvieron los procesos ARK antes de reconstruir para evitar referencias a chunks antiguos. La implementación redacta y copia, no publica, envía ni contrata.
- L7. Revisiones nativas autorizadas con «1» por candidato: backend review-c091571c741b89cf y frontend review-5bf92cbe29396be7. Seguridad, resiliencia y confiabilidad sin hallazgos; ambos acknowledgements confirmaron authority burned. Las revisiones fueron estáticas y complementan las pruebas ejecutadas en L5.
- L8. Pendiente: confirmar estrategia de commits para las 456 líneas acumuladas entre ambos repositorios (147 backend y 309 frontend, antes de esta actualización documental). No se han creado commits ni publicado estos cambios. Prueba real de Seller con Meta pendiente de autorización específica.
- L9. Usuario: «s», en respuesta a confirmar un commit funcional por repositorio en dev, sin push. Se adopta exception-ok para conservar cada unidad funcional completa, sin PR encadenadas. Backend a7a7b12; frontend identificado por el commit que contiene esta actualización. La prueba real con Meta sigue pendiente. El código staged coincide con los árboles revisados; solo se actualizó este seguimiento.
- L10. Reversión: retirar primero la unidad frontend (panel, Seller, transporte, BFF y pruebas asociadas) y luego la unidad backend (seller-draft, cableado y pruebas), conservando diagnóstico, Mi día y Equipo. Verificación de runtime automatizada: endpoint autenticado y montaje de UI con proveedores controlados; prueba externa con Meta no ejecutada.

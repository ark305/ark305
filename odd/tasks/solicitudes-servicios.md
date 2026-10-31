# Solicitudes de servicios del MVP
Objetivo: crear y consultar solicitudes propias sin confirmar reservas. Rama: dev; estrategia ask-on-risk resuelta: feature-branch-chain sobre dev; previsión inicial de 390 líneas.
Pruebas: node:test HTTP, PostgreSQL local para RLS y verificación independiente. Sin operaciones sobre bases remotas.

## Specs
- S1: «dale en modo yolo toda la implementacion de debas hacer para completar el mvp y si opcion 1». Continuación local del flujo acordado: identidad, catálogo y solicitudes de servicios. No implica autorización de despliegue ni operaciones remotas sobre datos.
- S2: «de mimento no hay proveedores confirmados esto es un mvp». Las solicitudes expresan interés; no representan disponibilidad ni reservas confirmadas.
- S3: «trabajemos con nestJs para el back entonces y mantenganos next como wev para kas priebas». NestJS concentra validación, acceso a datos y contratos; Next.js será cliente de prueba.

## Tasks
- T1 | S1–S3 | delegado por continuidad de sesión extensa | implementado y verificado | RED: 13 aprobadas y 6 fallidas; GREEN: 20 aprobadas. Commit pendiente de estrategia de entrega.
- T2 | S1–S2 | delegado junto con T1 | completado | a5435a3; migración aplicada únicamente a PostgreSQL 17 temporal; RLS y permisos comprobados; revisión nativa reconocida sin hallazgos.
- T3 | S1–S3 | independiente por riesgo 1/2/3 | verificado | siete rutas previas conservan estado, cuerpo y cabeceras; aislamiento A/B y hash intacto tras rechazos. Pruebas reproducibles incorporadas.

## Log
- L1: «dale en modo yolo toda la implementacion de debas hacer para completar el mvp y si opcion 1».
- Supuesto de alcance: estado único received, servicio del catálogo demo, fecha solicitada, invitados y preferencias opcionales. No se añaden roles administrativos, cobros ni cambios de estado sin flujo definido.
- Autenticación Nest verificada: 13 pruebas aprobadas y revisión nativa reconocida sin hallazgos. Mi día integrado previamente; prueba real con Supabase pendiente.
- Se preservan todos los cambios anteriores. Docker local disponible; pruebas usarán un contenedor desechable, nunca la base remota.
- Risk: items 1, 2 y 3 (nuevo esquema, RLS y contratos HTTP). Espejo Engram pendiente por unknown_project.
- La implementación se delegó tras la compactación por continuidad de una sesión extensa, con superficies acotadas. El propietario verificó nuevamente las 20 pruebas HTTP.
- Verificación independiente: PASS S1–S3. PostgreSQL 17 real, sin red ni puertos publicados; roles y claims de Supabase simulados. No equivale a una prueba E2E de Supabase real. Todas las operaciones rechazadas preservaron el hash de la tabla completa.
- El ítem 3 corresponde a extraer configuración compartida de identidad; las rutas nuevas son aditivas. Comparación diferencial contra e4f9dde sin cambios en comportamiento existente.
- La evaluación nativa requiere inventario explícito de archivos nuevos y no emitió una evaluación válida; no se interpreta como bajo riesgo. Revisión del candidato aislado pendiente, sin iniciar consentimiento.
- La entrega supera la previsión de 390 líneas al conservar validaciones y pruebas de seguridad; no se recorta código ni pruebas para ajustarla. Estrategia de encadenamiento pendiente antes del commit.
- Pruebas finales: `npm run test:api`, 19 aprobadas tras reorganizar casos e incorporar dos propietarios; `npm --prefix backend run test:rls`, aprobado tanto por el ejecutor como por el padre. Este último aplica la migración del repositorio a un contenedor nuevo y elimina únicamente ese contenedor.
- Una ejecución inicial de la prueba RLS falló durante la preparación. Se sustituyó readiness por socket por TCP interno; la carrera de inicialización es una explicación probable, no reproducida. Dos ejecuciones del ejecutor y una del padre aprobaron después del ajuste. Los rechazos deben ser errores SQL (salida 3), no errores Docker.
- No se modificó la base remota. E2E con Supabase real y revisión nativa del candidato siguen pendientes. Sin commit de esta entrega hasta resolver estrategia de encadenamiento.
- El contenedor de verificación independiente fue eliminado. La eliminación del directorio temporal de verificación fue rechazada por la política del entorno; se conserva sin intentar eludirla. Espejo Engram continúa pendiente por unknown_project.
- Decisión del usuario: «1», correspondiente a «Entregas encadenadas sobre dev». No autoriza publicación, PR ni integración remota en main.
- División coherente en una sola pasada: entrega A, persistencia RLS con migración, prueba PostgreSQL y guía propia; entrega B, rutas Nest con adaptador, validación y pruebas HTTP. La entrega B depende de A. Mi día permanece separado. No se eliminan pruebas ni se comprime código para reducir líneas.
- Cadena local prevista: dev → persistencia de solicitudes → API de solicitudes. Las futuras ramas y PR conservarán esta dependencia cuando se autorice publicarlos. El límite base de A es e4f9dde; commits aún pendientes.
- Entrega A registrada: a5435a3 sobre e4f9dde, 288 líneas. Cuatro revisiones sin hallazgos; acknowledgement de review-8c3ec5f96c5c38b7 confirmó authority burned. No se publicó ni se aplicó SQL remoto.
- Entrega B preparada en el índice: 436 adiciones + 13 eliminaciones = 449 líneas, sin contar esta actualización de seguimiento. Conserva rutas, validación, adaptador, pruebas y guía como una unidad funcional. Después de una única división coherente se recomienda size:exception para B, en vez de separar las pruebas del comportamiento. Pendiente aceptación de esa excepción y consentimiento propio de revisión; no se inició otra revisión.
- 2026-10-31: el usuario respondió «si» a «¿Aceptás la excepción de tamaño para esta entrega?». Se acepta size:exception para B, manteniendo la unidad funcional y sus pruebas; la actualización administrativa de este seguimiento se incluye junto con ella. No autoriza publicación ni sustituye el consentimiento de revisión de B.

# Recorrido principal de Mi día
Objetivo: conectar el plan con solicitudes persistentes e historial propio. Rama dev; cadena de entregas sobre dev; estrategia ask-on-risk; previsión de 600 líneas, sin recortar pruebas para ajustarla.
Pruebas iniciales: node:test con HTTP simulado, lint, compilación y verificación independiente. La continuación del 2026-11-01 autoriza el recorrido real con la cuenta de prueba; no autoriza reservas, pagos ni publicación.

## Specs
- S1: «listo entonces hagamos el cierre de cambios locales y completar el recorrido principal». Conectar inicio de sesión existente → plan Meta existente → solicitudes Nest → historial propio. Preservar los cambios locales de Meta y documentar las verificaciones reales pendientes.
- S2: «una fecha para todo el dia esta correcto». Un selector de fecha común para todos los artículos enviados del plan; exigir una fecha calendario válida antes de enviar.
- S3: «de mimento no hay proveedores confirmados esto es un mvp». Sustituir la confirmación y progresión ficticias de Mi día por solicitudes received provenientes de Nest; sin prometer disponibilidad, proveedor, precio confirmado, reserva ni cobro.
- S4: «trabajemos con nestJs para el back entonces y mantenganos next como wev para kas priebas». Next actúa como transporte web hacia el contrato existente de Nest; no duplica persistencia ni lógica comercial.

## Tasks
- T1 | S1–S4 | delegado por continuidad de sesión extensa | completado; pruebas HTTP simuladas 9/9 | transporte web y helper de solicitudes; validación de respuestas y pruebas HTTP sin red externa.
- T2 | S1–S3 | mismo ejecutor, unidad dependiente de T1 | completado; pruebas de interacción 6/6 | fecha común, envío por artículo, resultados parciales e historial; eliminar seguimiento ficticio y conservar Meta.
- T3 | S1–S4 | independiente por riesgo 2/3/4 | verificado localmente | 25 pruebas; lint/build antes de corrección y recheck acotado de B1/B2 aprobado; E2E Supabase real pendiente.

## Log
- 2026-11-01, investigación posterior autorizada por «resolvamos kos hallazgos»: discrepancia de fecha reproducida en la herramienta fill (DOM cambia, estado controlado React no); teclado nativo actualiza ambos correctamente. Fecha restaurada a 2026-11-01 sin POST ni alteración de registros. No se acredita un defecto de la aplicación por interacción nativa. La afirmación anterior de NUL se rectifica: no hubo comprobación de puntos de código del JSON original; corrupción no confirmada. Procedimiento de pruebas documentado en docs/DIAGNOSTICO_META.md; no se requieren cambios de lógica por estas evidencias.
- 2026-11-01, «haz las pruebas reales»: diagnóstico y plan Meta HTTP200, guardado UI y Snapshot persistente, dos POST201 received para catamaran y restaurant con dos personas; historial GET200 conservado tras recarga. IDs: c0354fd9-1226-489c-8d7e-e274cbfb76e7 y c69367b8-34c4-470e-8680-3d31de854c87. Se guardó fecha común 2026-11-01. La herramienta había mostrado 2026-11-08 antes del envío; no se acredita selección de fecha futura ni se atribuye causa sin reproducir mediante interacción nativa. Una llamada por tarea Meta y dos POST, cero reintentos; no se modificaron los registros posteriormente. También se observaron caracteres NUL en texto del diagnóstico, pendientes de investigar.
- L1: «listo entonces hagamos el cierre de cambios locales y completar el recorrido principal».
- L2: «una fecha para todo el dia esta correcto».
- Base API: 32df222; persistencia: a5435a3. Las revisiones de ambas entregas se cerraron sin hallazgos. Solo a5435a3 está publicado.
- Supuestos: solicitudes individuales con una fecha común; horario y cantidad como preferencias legibles, sin cambiar el contrato backend. No se agrega envío masivo transaccional ni integración de proveedores.
- Seguridad: origen Nest configurado solo en servidor, sin redirecciones ni reintentos automáticos de escritura. Una respuesta perdida puede ocultar una escritura exitosa: mostrar resultado incierto y consultar historial, no afirmar rollback ni ofrecer reenvío automático.
- Preservar resultados confirmados cuando otros artículos fallen; mostrar historial solo para la sesión vigente y vaciarlo al cerrar o cambiar sesión. Los precios del prototipo se identifican como orientativos, sin anticipo ni prioridad cobrable.
- Scope: no modificar la base remota, variables secretas, contratos Nest ni otras pantallas de reservas. Espejo Engram pendiente por unknown_project.
- Implementación local: proxy Next valida origen, entrada y DTO; la interfaz usa una fecha común, envía artículos por separado, conserva éxitos, detiene la cola al cambiar sesión y no reenvía resultados inciertos. No modifica persistencia ni contrato Nest.
- Pruebas observadas: `node --test test/ai-route.test.mjs test/service-requests.test.mjs test/day-requests.test.mjs` (25/25); lint focalizado y `tsc --noEmit` (sin errores); `git diff --check` limpio. Falta compilación y verificación independiente; E2E real omitida por no usar credenciales ni base local.
- Documentación: `docs/RECORRIDO_PRINCIPAL.md` describe configuración, límites del transporte y comprobaciones reproducibles.
- Verificación independiente: lint completo, compilación Webpack, 19 pruebas Nest y cadena HTTP sintética Next→Nest→proveedor local aprobados. B1 (fecha editable tras éxito parcial) y B2 (lectura antigua borra escritura confirmada) se reprodujeron y corrigieron en una tanda; regresiones incorporadas y 25 pruebas aprobadas. Recheck independiente limitado a B1/B2 aprobado, sin bloqueadores residuales. Comprobación focalizada del padre: 3 pruebas aprobadas.
- Se fija la fecha desde el primer intento y se versionan escrituras para conservar historial ante respuestas anteriores. La idempotencia persistente no está implementada: la documentación explicita el límite tras recarga.
- Espejo Engram recuperado: lecturas y guardados de ark305 funcionan nuevamente. No se aplicaron migraciones ni se usaron credenciales reales durante esta entrega.
- Una división coherente propuesta conserva transporte con sus pruebas (477 líneas nuevas de proxy, helper y prueba) y UI con pruebas de interacción como otra unidad. Ambas superan el objetivo de 400; se recomienda size:exception para conservar comportamientos y regresiones juntos, sin recortar ni reestructurar artificialmente. Revisión nativa, commits y publicación pendientes; no se reutiliza el consentimiento de entregas anteriores.
- Corrección de verificación independiente: el conjunto de solicitudes fija la fecha desde el primer intento y protege escrituras confirmadas contra respuestas GET iniciadas antes del POST; ambos escenarios tuvieron RED y ahora pasan como regresiones.
- Límite adicional: la deduplicación del navegador solo existe mientras el componente está montado; el contrato backend no tiene clave de idempotencia persistente. Tras recargar se consulta/reconcilia historial y un resultado incierto no se reintenta en automático.

- Entrega: el usuario respondió «si» a la excepción de tamaño para conservar IA y solicitudes como unidades completas con sus pruebas y documentación. Solo commits locales en dev, sin push. La revisión nativa mantiene consentimiento independiente por candidato.

- Entrega del 2 de noviembre: commit d88828b, 61/61 pruebas web y 19/19 Nest aprobadas en exportación del índice, lint y tipos aprobados. El usuario autoriza push a dev; sustituye la restricción anterior de entrega solo local, no autoriza despliegue productivo ni nuevas funciones.

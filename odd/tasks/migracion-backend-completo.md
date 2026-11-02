# Consolidación del backend en Nest
Objetivo: migrar negocio y acceso a datos desde Next a Nest; después implementar seguimiento y separar el repositorio. Rama: dev, base e165cae; entrega ask-on-risk con cadena sobre dev previamente elegida, sin push automático para esta fase.
Verificación: node:test HTTP, pruebas diferenciales, TypeScript y lint. Previsión global superior a 1500 líneas; unidades coherentes cercanas a 400 líneas, sin recortar pruebas. No llamadas reales a Meta ni cambios remotos de datos.

## Specs
- S4: «dale cerremos primero esos fallos, y siguiente a esto construimos la bandeja de solicitudes». Primero corregir controles tapados por la navegación y errores que muestran un perfil inexistente cuando falla el backend; comprobar recuperación sin nuevas llamadas a Meta. Luego continuar S2, sujeto a la definición de roles y estados ya indicada.
- S1: «si terminemos de pasar lo que queda de api en next a nest». Migrar IA y operaciones de negocio/datos actualmente alojadas en rutas y acciones Next. Mantener los contratos observables y el aislamiento por usuario. Next conserva adaptadores de sesión, cookies, redirecciones y revalidación; no debe conservar implementaciones alternativas del negocio al finalizar.
- S2: «y luego hacer ka gestion y seguimiento de solicitudes». Comenzar después de S1. Los roles operativos y estados permitidos requieren una decisión de producto antes de habilitar escritura administrativa; no se inventan reservas o proveedores confirmados.
- S3: «siguiente q eso creamos un repo para el.bacm». Extraer el backend después de S2, sin dependencias de archivos de Next. Antes de crear un repositorio remoto confirmar destino y visibilidad; preservar historial y configuración privada.

## Tasks
- T9 | S4 | inline: correcciones relacionadas de experiencia y errores | implementado, commit de esta unidad | mantener controles fuera de la navegación fija y distinguir errores de consulta de perfiles ausentes.
- T10 | S4 | verificación independiente por riesgos 2 y 3 | funcionalmente verificado; revisión nativa pendiente | comprobar recuperación, identidad y navegación; después definir permisos de la bandeja T7.
- T1 | S1 | inline, unidad acotada | implementado y verificado; revisión nativa pendiente | API de conversación general en Nest con identidad y cuota; Next permanece sin cambio hasta completar los modos estructurados.
- T2 | S1 | inline salvo motivo de delegación documentado | pendiente | contratos y validadores de diagnóstico y planificación independientes de Next, con compatibilidad diferencial.
- T3 | S1 | delegado: unidad IA paralela | implementado y verificado; commit pendiente | conectar Next a la IA de Nest mediante un adaptador fino y retirar la orquestación duplicada; configurar variables de servidor sin exponer claves.
- T4 | S1 | delegado: unidad perfiles paralela | implementado y verificado; commit pendiente | migrar escrituras de perfiles, servicios, preferencias y diagnóstico; conservar adaptación web de cookies y navegación.
- T5 | S1 | delegado: unidad perfiles paralela | implementado y verificado; commit pendiente | migrar lecturas de negocio y verificar límites de Auth/Storage; evitar imports desde el backend hacia la web.
- T6 | S1 | verificación independiente por riesgos 2 y 3 | pendiente | suite integral, contratos, aislamiento y documentación de despliegue; no declarar cerrada la revisión IA anterior.
- T7 | S2 | pendiente de definición de roles/estados después de S1 | pendiente | implementar gestión y seguimiento con pruebas de permisos y transiciones.
- T8 | S3 | pendiente después de S2 | pendiente | separar repositorio backend con historial, pruebas y configuración propia.

## Log
- S4: RED 4 fallos, GREEN 15/15 focalizados; suite web 63/63, TypeScript y ESLint aprobados. Verificador independiente: 15/15, seis comparaciones de comportamiento previo idénticas y dos cambios de error intencionados; sin bloqueantes. Navegador: botón queda a y=775, por encima de navegación y=810, hit-test correcto. API detenida de forma controlada: /perfil mantiene URL y muestra recuperación, no bienvenida. API restaurada: Reintentar vuelve al perfil existente. En desarrollo, Next muestra además su overlay; no es la interfaz de producción. Sin llamadas Meta ni escrituras de datos en esta unidad. Risk: items 2 y 3. Reversión: retirar boundaries, cambio de catch y scroll-padding con sus pruebas; no incluye migraciones.
- 2026-11-02: «dale cerremos primero esos fallos, y siguiente a esto construimos la bandeja de solicitudes». S4 se ejecuta antes de T7; no autoriza despliegue ni nuevas migraciones.
- Reconciliación: T1 comprometido en 3796a08; T2/T3 en 8437708 y corrección ec15de4; T4/T5 en 8910917. La revisión nativa sigue pendiente por operation_timeout. Pruebas posteriores: web 60/60, backend 38/38. Guardado real de perfil y recuperación de Snapshot verificados tras reiniciar API y agregar únicamente profiles.taste con autorización explícita. Las etiquetas históricas de las tareas se conservan como registro; estos hashes son el estado actual.
- T9 RED observado en navegador 500x900: scrollIntoView alinea Guardar cambios en y=847..899; navegación ocupa y=810..882, hit-test falla. Padding inferior existente 124px; falta margen de desplazamiento para la navegación fija. Guardado no debe confundirse con disponibilidad del backend.
- L1: «si terminemos de pasar lo que queda de api en next a nest y luego hacer ka gestion y seguimiento de solicitudes, siguiente q eso creamos un repo para el.bacm».
- Mapa verificado: api/ai contiene negocio, api/service-requests ya es proxy a Nest. actions.ts y profiles-db.ts conservan acceso a datos. Auth callback, SDK de sesión y cookies son adaptadores web; no se trasladan mecánicamente al backend.
- Se conserva IdentityGuard y la clave pública con JWT del usuario para respetar RLS. No se introduce service_role ni almacenamiento de tokens en servicios singleton. La lógica de IA no dependerá del árbol src/ de Next al finalizar.
- Riesgos iniciales: items 2 y 3 (identidad y contratos), y item 4 en operaciones asíncronas compartidas. La revisión nativa de f7df0ff sigue pendiente; esta migración no la convierte en aprobación.

- T1 RED: cuatro escenarios HTTP respondieron 404 antes del módulo. GREEN: 5/5 pruebas focalizadas y 24/24 backend; lint aprobado. Verificación independiente: 18 comparaciones de rutas existentes idénticas, concurrencia entre usuarios sin cruces, credenciales separadas, configuración y errores seguros. Sin llamadas reales a proveedores.
- T1 mantiene el modo genérico legado ante error HTTP de cuota; los modos estructurados todavía no están disponibles en Nest y no deben heredar ese comportamiento. La web no cambió. Risk: items 2 y 3; verificador independiente completado sin bloqueantes.

- 2026-11-02: ?antes de publicar pasa los servicio que aun estan en next a nest para si deplegar?. Se completa S1 antes de cualquier despliegue.
- T2-T5: delegaci?n por dos unidades independientes en paralelo: IA estructurada y perfiles/servicios. Superficies disjuntas; dominio puro de diagn?stico copiado previamente por el padre, registro de m?dulos y configuraci?n compartida a cargo del padre. T1 commit 3796a08.
- Copia mec?nica del dominio puro de diagn?stico: sin cambio de comportamiento, excepci?n RED; se verificar? equivalencia y compilaci?n.

- Auditor?a adicional: callback de autenticaci?n consultaba profiles directamente. Migrado a Nest conservando PKCE en Next; prueba RED 3 fallos, GREEN 8/8; ca?da de backend devuelve 503 y no bienvenida falsa.
- Integraci?n local: ProfilesModule registrado; Node >=22.9 carga backend/.env.local opcional. Configuraci?n Meta copiada localmente sin imprimir secretos, sin conflictos, sin llamadas externas.
- Unidades delegadas entregadas; correcci?n acotada en curso para preservar errores de formulario, normalizaci?n, metadatos de diagn?stico y cobertura previa. No se declaran T2-T5 completos hasta verificar correcciones.

- Correcci?n de ambas unidades cerrada: pruebas IA Nest 14/14 y BFF 6/6; perfiles HTTP 5/5, web 6/6, diagn?stico UI 3/3; comparaci?n de cinco errores y normalizaci?n con 3796a08 sin diferencias. Comprobaci?n del padre auth/perfiles 14/14.
- Normalizaci?n sin errores de whitespace; assessment nativo high por identidad/contratos. Sin START ni consentimiento nuevo todav?a. Verificaci?n independiente en copia aislada del ?ndice en curso; no se han realizado pruebas remotas.
- La unidad supera la gu?a de 400 l?neas por trasladar reglas puras y pruebas existentes, sin comprimir c?digo ni dividir comportamiento artificialmente. Se mantienen unidades de IA y perfiles con sus respectivas pruebas y documentaci?n.

- Verificaci?n independiente: backend 38/38, web 57/57, lint, compilaci?n Next webpack y TypeScript aprobados; 15 comparaciones IA base/candidato id?nticas, 6 pruebas HTTP de aislamiento y hash de datos sin cambios ante rechazos, arranque con env y salud HTTP 200. Build Turbopack aislado falla igual en base y candidato por junction externa; webpack aprobado como comprobaci?n alternativa.
- ?nico bloqueante encontrado: getViewer mezclaba usuario verificado A con sesi?n B. Corregido con v?nculo de identidades previo al env?o y validaci?n de propietario en respuesta. RED 2 fallos, GREEN 8/8 perfiles web; revalidaci?n independiente focalizada 2/2 y comprobaci?n del padre 2/2 aprobadas. S1 sin bloqueantes funcionales pendientes; no hay prueba remota ni despliegue.

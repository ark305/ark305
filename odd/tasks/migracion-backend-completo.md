# Consolidación del backend en Nest
Objetivo: migrar negocio y acceso a datos desde Next a Nest; después implementar seguimiento y separar el repositorio. Rama: dev, base e165cae; entrega ask-on-risk con cadena sobre dev previamente elegida, sin push automático para esta fase.
Verificación: node:test HTTP, pruebas diferenciales, TypeScript y lint. Previsión global superior a 1500 líneas; unidades coherentes cercanas a 400 líneas, sin recortar pruebas. No llamadas reales a Meta ni cambios remotos de datos.

## Specs
- S1: «si terminemos de pasar lo que queda de api en next a nest». Migrar IA y operaciones de negocio/datos actualmente alojadas en rutas y acciones Next. Mantener los contratos observables y el aislamiento por usuario. Next conserva adaptadores de sesión, cookies, redirecciones y revalidación; no debe conservar implementaciones alternativas del negocio al finalizar.
- S2: «y luego hacer ka gestion y seguimiento de solicitudes». Comenzar después de S1. Los roles operativos y estados permitidos requieren una decisión de producto antes de habilitar escritura administrativa; no se inventan reservas o proveedores confirmados.
- S3: «siguiente q eso creamos un repo para el.bacm». Extraer el backend después de S2, sin dependencias de archivos de Next. Antes de crear un repositorio remoto confirmar destino y visibilidad; preservar historial y configuración privada.

## Tasks
- T1 | S1 | inline, unidad acotada | implementado y verificado; revisión nativa pendiente | API de conversación general en Nest con identidad y cuota; Next permanece sin cambio hasta completar los modos estructurados.
- T2 | S1 | inline salvo motivo de delegación documentado | pendiente | contratos y validadores de diagnóstico y planificación independientes de Next, con compatibilidad diferencial.
- T3 | S1 | inline | pendiente | conectar Next a la IA de Nest mediante un adaptador fino y retirar la orquestación duplicada; configurar variables de servidor sin exponer claves.
- T4 | S1 | inline | pendiente | migrar escrituras de perfiles, servicios, preferencias y diagnóstico; conservar adaptación web de cookies y navegación.
- T5 | S1 | inline | pendiente | migrar lecturas de negocio y verificar límites de Auth/Storage; evitar imports desde el backend hacia la web.
- T6 | S1 | verificación independiente por riesgos 2 y 3 | pendiente | suite integral, contratos, aislamiento y documentación de despliegue; no declarar cerrada la revisión IA anterior.
- T7 | S2 | pendiente de definición de roles/estados después de S1 | pendiente | implementar gestión y seguimiento con pruebas de permisos y transiciones.
- T8 | S3 | pendiente después de S2 | pendiente | separar repositorio backend con historial, pruebas y configuración propia.

## Log
- L1: «si terminemos de pasar lo que queda de api en next a nest y luego hacer ka gestion y seguimiento de solicitudes, siguiente q eso creamos un repo para el.bacm».
- Mapa verificado: api/ai contiene negocio, api/service-requests ya es proxy a Nest. actions.ts y profiles-db.ts conservan acceso a datos. Auth callback, SDK de sesión y cookies son adaptadores web; no se trasladan mecánicamente al backend.
- Se conserva IdentityGuard y la clave pública con JWT del usuario para respetar RLS. No se introduce service_role ni almacenamiento de tokens en servicios singleton. La lógica de IA no dependerá del árbol src/ de Next al finalizar.
- Riesgos iniciales: items 2 y 3 (identidad y contratos), y item 4 en operaciones asíncronas compartidas. La revisión nativa de f7df0ff sigue pendiente; esta migración no la convierte en aprobación.

- T1 RED: cuatro escenarios HTTP respondieron 404 antes del módulo. GREEN: 5/5 pruebas focalizadas y 24/24 backend; lint aprobado. Verificación independiente: 18 comparaciones de rutas existentes idénticas, concurrencia entre usuarios sin cruces, credenciales separadas, configuración y errores seguros. Sin llamadas reales a proveedores.
- T1 mantiene el modo genérico legado ante error HTTP de cuota; los modos estructurados todavía no están disponibles en Nest y no deben heredar ese comportamiento. La web no cambió. Risk: items 2 y 3; verificador independiente completado sin bloqueantes.

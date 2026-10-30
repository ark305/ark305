# Base independiente de NestJS
Objetivo: incorporar backend NestJS sin retirar la web Next.js. Rama: `dev`; base: `1d801cf35052ff896f55c4860975540ec4398172`. Estrategia: `ask-on-risk`; estimación inicial: 250 líneas manuales, locks generados excluidos.
Verificación: pruebas HTTP con node:test, compilación backend y comprobaciones de la web. Espejo Engram pendiente por errores de vinculación.

## Specs

- S1. «trabajemos con nestJs para el back entonces y mantenganos next como wev para kas priebas». Incorporar aplicación Nest independiente y conservar rutas y comandos web existentes. Alcance inicial: arranque, endpoint de salud y pruebas; la migración de negocio se hará por módulos posteriores.
- S2. «a las conexiones, hablaba de interfaces en el.back para ello». Preparar una estructura modular, sin inventar integraciones ni proveedores conectados. No implementar contratos comerciales especulativos en este primer arranque.
- S3. «esperaremos a mañana generar ese api para poder realizar pruebas». No usar claves ni ejecutar llamadas reales a Meta en esta entrega; conservar la integración IA actual sin modificarla.

## Tasks

- T1 [S1–S3] Base Nest aislada y pruebas HTTP: verificada; ruta inline. RED 404 observado; GREEN 4 pruebas aprobadas y compilación correcta. Commit: unidad actual.
- T2 [S1] Verificación independiente y compatibilidad web: verificada; delegada por riesgo 5. Instalaciones limpias, pruebas API, build API, lint/build web y arranque dev correctos en copia temporal. Commit: unidad actual.
- T3 [S1–S3] Documentación y reconciliación del plan: verificada; inline, backend/README.md documenta comandos, límites y migración incremental. Commit: unidad actual.

## Log

- L1. Solicitud: «trabajemos con nestJs para el back entonces y mantenganos next como wev para kas priebas».
- L2. Estado inicial: Node 22.20.0, npm 11.6.2; sin node_modules. README.md, docs/ y odd/ contienen trabajo previo no confirmado; se preserva.
- L3. Diseño inicial: backend/ con package y lock propios; Next.js permanece en raíz. Nest usa su adaptador Express predeterminado. El backend no depende del frontend ni accede a datos externos. Riesgo: item 5 por dependencias y configuración; requiere verificador independiente.
- L4. Pruebas propuestas: npm --prefix backend test, npm --prefix backend run build; npm run lint y npm run build para web. Antes del cambio funcional observar 404 en prueba de salud, después 200 con JSON estable. Comprobar rutas desconocidas y persistencia intacta del código web.
- L5. RED observado: GET /api/v1/health devolvió 404 frente a 200; las comprobaciones de rutas desconocidas y sin prefijo pasaron. Web: npm ci, lint y build correctos; 26 páginas estáticas generadas.
- L6. La CLI Nest 12 introdujo Angular Devkit que exige Node >=22.22.3; el equipo tiene 22.20.0. Se sustituyó la CLI por tsc-watch 7.2.1 para conservar compilación con metadatos y reinicio, sin actualizar Node ni agregar otra herramienta global.
- L7. Verificación independiente sin bloqueadores: S1–S3 cumplidas en copia aislada. npm ci (ambas aplicaciones), test:api (4 pruebas), build:api, lint y build web: exit 0; dev:api responde 200. Scripts originales, lock raíz y src/ intactos. Aviso de ESLint 9.39.5 sin soporte preexistente; no hay EBADENGINE en backend final.
- L8. No se han migrado auth, catálogo, solicitudes ni IA: esta unidad entrega infraestructura mínima local. El backend aún no tiene lint propio; compilación estricta y pruebas son las comprobaciones disponibles. Sin despliegue, push ni credenciales.

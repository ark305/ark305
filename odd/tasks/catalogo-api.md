# Catálogo de servicios de solo lectura
Objetivo: exponer un catálogo demo desde NestJS y consultarlo desde una vista mínima de Next.js.
Rama: dev. Entrega: ask-on-risk; previsión de 350 líneas. Pruebas: node:test, lint y build de Next.js.

## Specs
- S1: «listo arranca ello y si necesitas docker montalo». Alcance aprobado: listado y detalle del catálogo, contratos, adaptador demo, pruebas y vista web mínima. Docker solo si resulta necesario.
- S2: «de mimento no hay proveedores confirmados esto es un mvp». No presentar proveedores, disponibilidad ni reservas como reales.
- S3: «trabajemos con nestJs para el back entonces y mantenganos next como wev para kas priebas». Mantener el backend independiente y la web como cliente.

## Tasks
- T1 | S1–S3 | inline | verificado | contrato, adaptador, endpoints y pruebas HTTP.
- T2 | S1–S3 | inline | verificado | vista mínima, documentación y comprobación integrada.

## Log
- L1: «listo arranca ello y si necesitas docker montalo».
- Decisión: GET /api/v1/catalog y /api/v1/catalog/:id; /catalogo es una página independiente, sin alterar /descubrir ni el planificador existente.
- El adaptador demo conserva los 18 identificadores y textos del prototipo, sin sus proveedores ficticios. Precio bajo cotización: no se validaron las tarifas antiguas.
- Puerto de lectura asíncrono sustituible por persistencia futura; no se inventan contratos de proveedores todavía desconocidos.
- Docker no es necesario para datos en memoria. No se añaden dependencias ni credenciales.
- Se preservan README.md, docs/ y fase-1-fundamentos.md preexistentes. Espejo Engram pendiente por unknown_project.
- Riesgo previsto: item 3, composición compartida de AppModule; verificar que salud y rutas anteriores no cambian.
- T1: RED observado y GREEN: 7 pruebas aprobadas; lint y build aprobados.
- T2: HTTP integrado en ambos idiomas: 18 servicios y error al apagar API. Sin runner de componentes; comprobaciones funcionales realizadas.
- Verificador independiente: S1-S3 PASS; rutas anteriores sin cambios frente a d0c2d9f. Ocho escrituras rechazadas sin modificar datos.
- Commit: 5b919f6 (329 inserciones, 4 eliminaciones). Risk: item 3; verificador independiente aprobado. Sin migraciones.
- Usuario autorizó la revisión con 1. Cuatro perspectivas sin hallazgos; revisión estática adicional a las pruebas previas.
- Cierre nativo: review-3f28d241f20456ca, acknowledged, authority burned. Sin correcciones de código ni publicación remota.

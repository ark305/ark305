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
- T1: RED observado: listado 404 en lugar de 200 y validaci?n 404 en lugar de 400. GREEN: npm run test:api, 7 pruebas aprobadas. Salud y rutas anteriores conservadas.
- T2: npm run lint aprobado. No existe runner de componentes web configurado; excepci?n RED para vista pasiva, comprobaci?n por build y HTTP integrado.
- T2: npm run build aprobado. HTTP integrado en espa?ol e ingl?s: 18 nombres, aviso demo y estado de indisponibilidad al apagar API. Procesos de comprobaci?n cerrados.
- Verificador independiente: S1?S3 PASS; comparaci?n diferencial contra d0c2d9f conserva status, cuerpo y cabeceras de salud/rutas anteriores. Pruebas de ocho escrituras rechazadas y datos intactos incorporadas como regresi?n. Spot check: npm run test:api, 7 aprobadas.
- Rollback: retirar CatalogModule, m?dulos catalog y p?gina catalogo con sus pruebas/documentaci?n; no hay migraciones ni cambios de datos. Riesgo: item 3 (composici?n compartida), verificaci?n independiente aprobada.

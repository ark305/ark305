# Equipo Business con Meta
Objetivo: generar propuestas reales de IA con estimaciones de demostración separadas por periodicidad.
Rama: dev en ambos repositorios. Estrategia: ask-on-risk. Pruebas: node:test, TypeScript, lint y build.

## Specs
- S1. Usuario: «listo entonces continua con el trbajo» y «si» a integrar Equipo con Meta. Sustituir la generación por palabras clave; no usar respuestas simuladas ante errores. Mostrar procedencia del proveedor.
- S2. Alcance confirmado: «incluir ambos, pero separar costo mensual recurrente, servicios puntuales y pendientes de cotización, usando precios de demo claramente identificados».
- S3. Conservar diagnóstico y Mi día. No inventar disponibilidad, proveedores, personas contratadas ni contratos confirmados. No ejecutar llamadas reales a Meta durante pruebas automatizadas.

## Tasks
- T1 — S1–S3 — inline — implementado y verificado; commit pendiente — RED por módulo inexistente, GREEN focal 15/15; suite Nest 57/57.
- T2 — S1–S3 — inline — implementado y verificado; commit pendiente — RED cliente inexistente, GREEN cliente/vista 4/4; suite frontend inicial 88/88. Regresión posterior de logout RED 1 llamada != 0, GREEN 0 llamadas.
- T3 — S1–S3 — delegado (contrato compartido, sesión y concurrencia; riesgos 2, 3 y 4) — verificado — TypeScript, lint y build correctos; una corrección acotada de logout confirmada independientemente. Revisión nativa y estrategia de commits pendientes.

## Log
- L1. Usuario: «si», confirmando el alcance propuesto de roles recurrentes y servicios puntuales con presupuestos separados.
- L2. Estimación inicial: aproximadamente 450 líneas propias más catálogo generado. Antes de commits se resolverá la estrategia de entrega si supera 400 líneas. El catálogo de demostración existente se replica en Nest sin dependencia de ejecución hacia Next.
- L3. Supuesto explícito de cálculo: horas recurrentes semanales × 4,33; horas puntuales × tarifa. Tarifas fijas o por proyecto representan una unidad; las mensuales, un mes; cotizaciones no suman cero como si fueran gratuitas.
- L4. Se reemplazó en Equipo la asignación automática de candidatos ficticios y el enlace que prometía generar un contrato por acceso al catálogo. Las selecciones previas de Talento y su almacenamiento no se modificaron. Esta fase genera una propuesta, no la guarda ni contrata personal.
- L5. Verificación independiente: 138 IDs y 411 combinaciones de límites coinciden en catálogo/esquema/cliente. Seis casos diferenciales de AiService respecto a 5f04f6e conservan respuestas, errores y argumentos de adaptadores. Diagnóstico y Mi día conservan sus contratos.
- L6. Se reprodujo y corrigió cierre de sesión durante getSession pendiente: SIGNED_OUT invalida incluso identidad null→null. Reprueba independiente: cero llamadas al proveedor y sin propuesta tardía. Suite inicial frontend 88/88; nueva regresión más las pruebas focales 4/4. Build 33 páginas. Advertencia previa en requests-inbox permanece; advertencia nueva de Equipo corregida y lint focal sin avisos.
- L7. No hubo llamadas reales a Meta/Supabase, modificaciones de credenciales, commits ni pushes en esta fase. La compatibilidad real del esquema con Meta debe comprobarse con una solicitud manual controlada, no se considera demostrada por los dobles de prueba.
- L8. Revisión nativa del backend aprobada y reconocimiento exacto confirmado (`review-d9a2f322dc75ef56`, target `sha256:cc59dc859f903ac77bd2186d51f89c641d105f7bf79205437e09f9d6f1a11c9f`, autoridad consumida). Riesgo y resiliencia sin hallazgos. Advertencia no bloqueante R3-001: el parser convierte cadence a texto para validar pertenencia; una matriz de un elemento podría superar esa comprobación y no entrar en los totales. Registrar como endurecimiento posterior separado; no reabrir esta revisión. Revisión frontend pendiente.

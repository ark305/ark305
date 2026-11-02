# Cierre de coherencia del MVP
Objetivo: corregir los hallazgos de Inicio, personas y contenido antes de organizar la entrega en dev. Estrategia: ask-on-risk, cadena sobre dev previamente elegida; previsión de 350 líneas propias, sin incluir cambios anteriores.
Pruebas: node:test, ESLint, TypeScript y verificación independiente por contrato compartido. Sin nuevas llamadas Meta, solicitudes reales ni push.

## Specs
- S1: «listo sigamos eso mismo», aceptación de «abrir el Snapshot existente desde Inicio». Usar el diagnóstico de la cuenta autenticada; no sustituirlo por datos locales de otra sesión. Sin diagnóstico, conservar la invitación inicial.
- S2: «evitar reiniciar Personas en 4». Recordar el contador para nuevos planes en este navegador, sin modificar entradas del carrito ni solicitudes existentes. Supuesto conservador: si no hay preferencia previa, usar el conteo común de las entradas actuales cuando sea válido.
- S3: «aclarar “días guardados” frente al carrito» y «retirar afirmaciones de disponibilidad que todavía no podemos garantizar». Corregir afirmaciones del prototipo en español e inglés; distinguir borrador local y solicitudes recibidas, sin añadir una funcionalidad de días guardados.
- S4: «después respaldar el trabajo en Git y preparar el despliegue». Preparar unidades revisables conservando cambios anteriores; publicación y despliegue no se realizan en esta unidad.

## Tasks
- T1 | S1 | inline, alcance conocido tras mapa | verificado | pruebas de CTA y aislamiento de datos locales.
- T2 | S2 | inline, unidad pequeña | verificado | persistencia del contador y conservación del carrito.
- T3 | S3 | inline, contenido limitado al recorrido | verificado | regresiones de textos y aclaraciones.
- T4 | S1–S4 | verificación independiente por riesgo 3; Git a cargo del coordinador | pendiente | suite, tipos, lint y límites de entrega.

## Log
- L1: «listo sigamos eso mismo».
- Mapa: NextStep solo usa diagnóstico local, mientras el diagnóstico autenticado ya está disponible en Inicio. Personas es un estado efímero separado de los huéspedes de cada entrada. El carrito es local y las solicitudes son remotas; buildSnapshot afirma ausencia de días guardados sin consultar ninguno.
- Se conserva el comportamiento de entradas y solicitudes existentes; cambiar Personas afecta exclusivamente futuras propuestas y paquetes. No se introduce sincronización de preferencias entre cuentas/dispositivos.

- Verificación: 65/65 pruebas web, 19/19 Nest, lint y TypeScript aprobados. Revisión independiente: carrito diferencial idéntico, 48 snapshots sin cambios ajenos al texto, aislamiento de cuenta y preferencias válidos.
- No se ejecutó un nuevo build Next ni una nueva pasada de navegador para esta unidad. No hubo llamadas a Meta ni modificaciones remotas.
- Git: índice vacío; cambios anteriores de autenticación, IA y solicitudes comparten archivos con UX. Preparación propuesta: unidades de autenticación, diagnóstico Meta, recorrido de solicitudes y cierre UX, cada una con sus pruebas y documentación. Sin commit ni push en este cierre.
- Revisión nativa pendiente: assess devuelve unassessable por archivos sin seguimiento; STATUS requiere selección explícita del inventario. No se inició una revisión del conjunto acumulado ni se declaró aprobación nativa.
- Risk: item 3 (helpers compartidos); verificación independiente completada. T4 permanece parcial hasta organizar y revisar el alcance acumulado.

- Usuario: «vamos a commitear y pushear a dev oara ir subiedo cambios, y kuego mejoramos las funcionalidades falrantes». Autoriza commits y push a dev, sin ampliación funcional.
- Unidades previas: f809709 (autenticación, revisión nativa aprobada); f7df0ff (IA, pruebas aisladas 46/46, revisión nativa pendiente de corrección por continuación bloqueada); d88828b (solicitudes, 61/61 web y 19/19 Nest, lint y tipos aprobados; evaluación nativa medium/under_budget sin revisión solicitada).
- El envío a dev no acredita preparación para producción ni resuelve el hallazgo pendiente de IA. SMTP, validación del despliegue y documentación histórica requieren seguimiento.

- Commit UX: 09bdc33. Exportación aislada: 65/65 pruebas web, lint y tipos aprobados; spot check 4/4. Evaluación nativa medium/under_budget, sin nueva revisión requerida. Solicitudes d88828b conserva 19/19 pruebas Nest aprobadas. Se autoriza push a dev como entrega de desarrollo; la revisión de IA permanece pendiente.

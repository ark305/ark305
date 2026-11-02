# Conectar Mi día con Meta
Objetivo: reemplazar la generación local por una solicitud autenticada y un plan validado. Rama: dev; estrategia ask-on-risk; previsión: 380 líneas.
Pruebas: node:test, lint, compilación y verificación independiente; ejecución real pendiente de configurar Supabase.

## Specs
- S1: «entonces es lo primero que debemos implementar, avancemos para poder lorar la implementacion de esta en el chat porque es lo importante para esta mvp»; pantalla confirmada: «mi dia». Conectar esa pantalla, no equipo ni diagnóstico.
- S2: «hice una pregunta en el chat ia de la app pero como me garatiza a mi que la respuesta si fue de meta ?». Mostrar modelo e identificador devueltos por Meta solo para respuestas válidas; no simular respaldo local.
- S3: «puedes trabajar sin las variables ir avanzando ?». Implementar y verificar sin credenciales reales mediante pruebas simuladas. Conservar autenticación; indicar configuración ausente o sesión requerida.

## Tasks
- T1 | S1–S3 | inline | implementado | contrato validado y ruta day-plan; RED observado en tres reglas antes de implementar, GREEN posterior.
- T2 | S1–S3 | inline | implementado | pantalla conectada, procedencia, errores y ausencia de fallback; RED del enlace UI observado antes del cambio.
- T3 | S1–S3 | verificador independiente por riesgo 2/3/4 | verificado localmente | 10 pruebas, build Webpack y probes UI/API aprobados; recorrido real pendiente de variables/sesión.

## Log
- L1: «puedes trabajar sin las variables ir avanzando ?».
- La clave Meta permanece privada. No usar ni modificar credenciales reales durante estas pruebas.
- Los precios del prototipo seguirán calculándose localmente y se identificarán como orientativos; Meta solo seleccionará servicios y horarios, sin confirmar reservas.
- Se conserva el endpoint genérico /api/ai. La tarea day-plan valida IDs, invitados, cantidades y horarios antes de devolver el plan.
- Se preservan cambios previos Meta y los tests RED de autenticación Nest pendientes. No se trabaja en Nest durante esta entrega.
- Risk: items 2 y 3 (sesión, cuota y contrato compartido). Engram no disponible; espejo pendiente.
- Comprobación inicial: 9 pruebas aprobadas; se añaden casos de respuesta incompleta y ausencia de coincidencias. Revisión independiente y compilación pendientes.
- Verificación final: 10/10 pruebas, lint y compilación Webpack aprobados. Verificador independiente: S1–S3 PASS; SSR y acciones simuladas cubren configuración ausente, sesión ausente, error upstream y bloqueo de solicitudes superpuestas. Diez escenarios diferenciales conservan el endpoint genérico frente al snapshot anterior de Meta.
- Prueba autenticada real pendiente, deliberadamente fuera del desarrollo sin variables autorizado. Suite Nest no ejecutada: contiene tests RED de autenticación anteriores a esta entrega, preservados.
- Riesgo adicional item 4: exclusión de solicitudes concurrentes en la UI, comprobada por el verificador.

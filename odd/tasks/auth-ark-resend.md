# Acceso ARK con contraseña propia y correo de marca
Objetivo: conservar Supabase Auth, preparar Resend SMTP y permitir crear contraseña desde un enlace, iniciar sesión y recuperarla. Rama dev; cadena sobre dev; estrategia ask-on-risk; previsión de 800 líneas con pruebas.
Pruebas: node:test, lint, TypeScript, compilación y verificación independiente. No enviar correos ni cambiar SMTP/DNS remotos durante el desarrollo.

## Specs
- S1: «ese correo de autenticacion no deberia ser de supabase porque es de la app de ark». Preparar remitente y plantillas ARK con Resend como transporte SMTP; Supabase conserva usuarios, sesiones y tokens. La activación real exige dominio verificado y credencial configurada fuera del código.
- S2: «si asi mejor», aceptación de «flujo con enlace para crear contraseña, en lugar de contraseña temporal». Solicitar cuenta mediante correo; recibir enlace de un solo uso con vencimiento; establecer contraseña propia en ARK. Nunca generar ni enviar una contraseña temporal por email.
- S3: Flujo aceptado: «Después ingresa con correo y contraseña, con recuperación disponible». Implementar acceso y recuperación; conservar las cuentas existentes de Supabase y el onboarding de perfil.

## Tasks
- T1 | S2–S3 | delegado por continuidad de sesión extensa | completado tras corrección; pruebas locales 17/17 | acceso con contraseña, solicitud por enlace, establecimiento y recuperación; callback PKCE, identidad fijada y destinos internos seguros.
- T2 | S1 | mismo ejecutor junto con el flujo | completado; configuración SMTP externa pendiente | plantillas ARK y guía Supabase/Resend; sin operaciones remotas.
- T3 | S1–S3 | independiente por riesgo 2/3 | completado; cierre de entrega y revisi?n nativa pendientes | sesiones, errores, redirecciones, regresión y compilación; pruebas simuladas, sin credenciales reales.

## Log
- L1: «la cosa es la siguiente ese correo de autenticacion no deberia ser de supabase porque es de la app de ark, pienso que lo ideal es usar resent para enviar la confirmacion con una contraseña temporal y crear la parte de cambiar contraseña al ingresar con la temporal».
- L2: «si asi mejor». Sustituye la contraseña temporal por enlace de activación para crear contraseña propia, según propuesta aceptada.
- Supuesto: registro autoservicio, como el signInWithOtp actual; no se añade aprobación administrativa ni un segundo sistema de usuarios.
- Supabase Auth sigue siendo autoridad de identidad. El enlace prueba control del correo y puede crear una sesión antes de establecer contraseña; este alcance guía el onboarding, no introduce un permiso de servidor password_setup_required ni impide otros métodos habilitados directamente en Supabase. No confiar en user_metadata para permisos.
- Conservar callback PKCE para enlaces existentes y onboarding de perfil; destinos de creación y recuperación fijos, y next local saneado en las rutas compartidas.
- Después de actualizar contraseña, cerrar la sesión local y volver al acceso normal. Errores visibles no exponen tokens, contraseñas ni existencia de cuentas. Respetar errores de rate limit sin reintentos automáticos.
- No modificar credenciales .env.local, base remota, usuarios reales, DNS ni SMTP. Preservar todos los cambios locales de Meta y solicitudes, especialmente las entradas de diccionarios ajenas a Auth.
- La prueba real de envío requiere configuración posterior de Resend SMTP, remitente y dominio verificado. No afirmar que se envió un correo de ARK mientras esto no se verifique.
- Se implementó el acceso con contraseña y solicitud/recuperación mediante callbacks fijos; se conservó el onboarding legado y se verifican sesiones con `getUser`. El enlace crea una sesión autenticada antes de establecer contraseña; no se añadió una barrera global de servidor ni se confía en `user_metadata`.
- Verificación observada: `node --test test/auth-flow.test.mjs test/auth-ui.test.mjs test/ai-route.test.mjs test/service-requests.test.mjs test/day-requests.test.mjs` (44/44); ESLint focalizado y `tsc --noEmit` completados. No hubo E2E real de email ni cambios remotos. T3 sigue pendiente de verificación independiente/build.
- Corrección B1 por identidad: la reproducción inicial podía actualizar/cerrar sesión de B con un formulario abierto para A. El formulario ahora compara el ID de la sesión verificada por el servidor, verifica la identidad activa, liga `updateUser` a una instancia Supabase en memoria con el token capturado y vuelve a verificar la sesión antes de cada cierre (incluidos reintentos). Cambios de sesión invalidan operaciones pendientes y limpian contraseñas; la acción de servidor verifica el ID antes de cerrar sesión local. RED inicial 2 fallos en la reproducción; pruebas locales específicas 17/17, incluida cuenta cambiada antes y durante verificación, token aislado bajo cambio posterior y reintento de cierre en otra cuenta. Se conserva alcance sin nueva política global de contraseña.
- Corrección B1 adicional: prueba con Supabase JS 2.117.0 reprodujo una revocación remota del token de B y eventos de auth transmitidos por el canal de almacenamiento compartido durante la limpieza del cliente aislado. El cliente de actualización ahora no persiste la sesión, usa una clave de canal única y se descarta sin llamar a `signOut`; también se eliminó la rama de actualización directa del cliente compartido. Pruebas SDK con fetch sintético: RED 2 fallos, luego GREEN 2/2.

- Verificaci?n independiente final: B1 residual cerrado con SDK real, configuraci?n no vac?a y transporte sint?tico; 4/4 pruebas correctas, sin escritura/revocaci?n de otra cuenta ni eventos BroadcastChannel compartidos. Spot check del coordinador: 6/6 pruebas focalizadas correctas. Lint y build Webpack completos pasaron antes de la ?ltima correcci?n; despu?s de ella pasaron 44/44 pruebas, ESLint focalizado y TypeScript. SMTP y correo real pendientes.

- Usuario: ?si, y epxlicame el flujo para revisarlo en local?. Autoriza excepci?n de tama?o para conservar el flujo Auth con pruebas, sin push. La revisi?n nativa y la activaci?n SMTP siguen pendientes.

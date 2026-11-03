# ARK305: guía del frontend

Esta guía describe el producto visible en la aplicación web y cómo trabajar en este repositorio. El repositorio contiene Next.js, pruebas web y documentación de interfaz; el API y sus recursos operativos viven en el proyecto independiente hermano `../ark305-api`.

## Producto en dos minutos

ARK305 reúne experiencias de vida y herramientas para profesionales y negocios, con foco en Miami. La interfaz incluye descubrimiento, perfiles, planificación del día, comunidad y funciones comerciales. Algunas pantallas son demostraciones o usan estado local; la presencia de una pantalla no garantiza que todas sus acciones sean operaciones disponibles.

| Área | Pantallas principales |
|---|---|
| Acceso y personalización | `/entrar`, `/bienvenida`, `/diagnostico`, `/snapshot` |
| Vida y experiencias | `/`, `/descubrir`, `/mi-dia` |
| Perfil y oferta | `/perfil`, `/perfil/editar`, `/perfil/datos`, `/crear`, `/@usuario` |
| Herramientas de negocio | `/panel`, `/ganar`, `/talento`, `/equipo`, `/revender`, `/documentos` |
| Comunidad y membresías | `/comunidad`, `/academia`, `/niveles`, `/private` |

Los nombres **Personal/Business**, **Buscar/Ofrecer** y **Gratis/Pro/VIP** representan conceptos distintos. Una preferencia de navegación o una pantalla de precio no demuestra una compra ni concede beneficios.

## Límites del frontend

- Next.js presenta páginas, formularios, navegación y estados de carga, error y reintento.
- Los componentes pueden mantener preferencias y borradores locales; esos datos no implican persistencia entre dispositivos.
- La web conserva adaptadores de sesión/cookies, navegación, carga de archivos y rutas HTTP necesarias para el navegador.
- Los adaptadores HTTP validan forma y tamaño, llaman al API configurado en `ARK_API_URL` y no deben duplicar reglas de negocio.
- Las credenciales privadas y las operaciones de datos pertenecen al repositorio del API; no deben incorporarse a variables `NEXT_PUBLIC_*`.

## Ejecutar y comprobar

Desde la raíz del repositorio:

```sh
npm ci --prefix frontend
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

La web usa el puerto `3100`. Copie `frontend/.env.example` a `frontend/.env.local` y complete la configuración pública de Supabase y `ARK_API_URL`. Los detalles de ejecución local y configuración privada del API se documentan en `../ark305-api`.

## Mapa de archivos

- `frontend/src/app/`: páginas y adaptadores HTTP.
- `frontend/src/components/`: interfaz y componentes reutilizables.
- `frontend/src/lib/`: estado, formularios, transporte y configuración web.
- `frontend/src/lib/dictionaries/`: textos en español e inglés.
- `frontend/test/`: pruebas de componentes y adaptadores.
- `frontend/public/`: recursos estáticos.
- `supabase/templates/`: plantillas de correo de Supabase Auth conservadas para configuración del frontend.

La configuración local no modifica proyectos de Supabase, variables alojadas ni despliegues remotos.

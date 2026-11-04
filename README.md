# ARK305 Web.

Aplicación Next.js de ARK305. El frontend se ejecuta desde la raíz de este repositorio. El backend NestJS independiente está en la carpeta hermana `../ark305-api`.

## Ejecutar y comprobar

```sh
npm ci
npm run dev
```

La web utiliza `http://localhost:3100`. Nest utiliza `http://127.0.0.1:3001` y se inicia por separado desde su repositorio.

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

## Variables locales

Copie `.env.example` como `.env.local`. Configure la URL y la clave pública de Supabase, además de `ARK_API_URL`, un origen HTTP(S) sin `/api/v1`. Esta última variable es exclusiva del servidor Next y no debe llevar el prefijo `NEXT_PUBLIC_`.

No coloque claves de Meta ni credenciales administrativas de Supabase en el frontend. Esas credenciales pertenecen al entorno privado del backend. Los archivos `.env.local`, las dependencias y los resultados de compilación no se versionan.

Para autenticación local, permita `http://localhost:3100/**` en las URL de redirección de Supabase. Mantenga la URL principal de producción. HTTP y HTTPS no son equivalentes.

## Organización

- `src/app/`: páginas y adaptadores HTTP.
- `src/components/`: presentación e interacción.
- `src/lib/`: estado local, formularios, configuración pública y transporte.
- `src/lib/dictionaries/`: interfaz en español e inglés.
- `public/`: recursos estáticos.
- `test/`: pruebas de interfaz, validación y transporte.

Next conserva sesión web, cookies y transporte; Nest concentra las operaciones de negocio y persistencia. Algunas pantallas de demostración todavía usan reglas locales y no deben presentarse como integraciones completas.

## MVP de hackathon

La web cubre catálogo consultado por Meta, solicitudes e historial, y complementos aceptados. Los precios y servicios del catálogo son DEMO; una solicitud recibida no confirma una reserva. El proceso, la auditoría previa a publicación y el guion de video están en `../ark305-api/docs/HACKATHON_MVP.md`, `../ark305-api/docs/HACKATHON_RELEASE_AUDIT.md` y `../ark305-api/docs/HACKATHON_VIDEO.md` dentro del espacio de trabajo conjunto. Este repositorio utiliza la [licencia MIT](LICENSE), con ARK305 como titular. La publicación sigue pendiente de autorización.

## Dos repositorios, un espacio de trabajo

Abra `arkApp` para coordinar ambos proyectos. Ejecute Git y npm dentro de `ark305` para la web y de `ark305-api` para el backend; cada repositorio conserva su remoto e historial.

Los residuos locales de `frontend/` están ignorados y no forman parte de la aplicación activa. Se conservan para no borrar configuración privada durante la migración. `../respaldo` contiene documentos históricos y archivos privados: no debe publicarse. La documentación histórica también permanece en Git.

## Despliegue

En Vercel, el directorio raíz del proyecto web debe ser la raíz del repositorio (`.`), no `frontend`. Configure `ARK_API_URL` con el origen del backend desplegado. Estas instrucciones no implican que la configuración remota ya haya sido modificada o verificada.

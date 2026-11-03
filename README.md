# ARK305 Web

Repositorio de la aplicación web de ARK305. El código de Next.js, sus pruebas y la documentación de la interfaz viven en `frontend/`; este repositorio no contiene la implementación del servidor ni sus migraciones.

## Inicio rápido

Desde la raíz:

```sh
npm ci --prefix frontend
npm run dev
```

La web queda disponible en `http://localhost:3100`. Para comprobarla:

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Los comandos raíz solo delegan en el paquete web. El API HTTP se mantiene en un repositorio independiente, ubicado localmente como `../ark305-api`; para el proceso de instalación y configuración del servidor, consulte la documentación de ese repositorio.

## Configuración web

Copie `frontend/.env.example` como `frontend/.env.local`. La web utiliza la configuración pública de Supabase y `ARK_API_URL`, que debe apuntar al origen HTTP del API independiente. `ARK_API_URL` es una variable de servidor de Next.js y no debe llevar el prefijo `NEXT_PUBLIC_`.

No copie secretos del API en la aplicación web. El archivo `.env.local` local no se publica; los nombres de variables requeridos por el servidor y sus valores deben configurarse en el repositorio del API.

## Estructura

- `frontend/src/app/`: páginas y adaptadores HTTP de Next.js.
- `frontend/src/components/`: componentes de interfaz.
- `frontend/src/lib/`: presentación, estado local, configuración pública y clientes HTTP.
- `frontend/test/`: pruebas web y de contratos de sus adaptadores.
- `frontend/public/`: recursos estáticos.
- `docs/`: guía de producto, recorridos de interfaz e inventarios del frontend.
- `supabase/templates/`: plantillas de correo utilizadas al configurar Supabase Auth.

La interfaz maneja presentación, formularios, navegación y estado local. La identidad de sesión del navegador y la carga de archivos requieren los adaptadores correspondientes; las reglas de negocio y el acceso a datos pertenecen al API independiente.

Consulte la [guía del proyecto](docs/GUIA_DEL_PROYECTO.md) para conocer las pantallas y límites del frontend. El proyecto web local no cambia ni publica configuraciones de Vercel u otros servicios remotos.

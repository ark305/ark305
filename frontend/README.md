# ARK305 Web

Aplicación Next.js de ARK305. Esta carpeta contiene la interfaz, sus adaptadores HTTP, recursos, configuración y pruebas. Las reglas de negocio y el acceso a datos se mantienen en el API HTTP independiente, disponible localmente en `../../ark305-api` desde esta carpeta.

## Ejecutar y comprobar

```sh
npm ci
npm run dev
```

La aplicación utiliza el puerto `3100`. Comprobaciones disponibles:

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

## Variables locales

Copie `.env.example` como `.env.local` y configure la URL y la clave pública de Supabase, además de `ARK_API_URL`. Esta última debe ser un origen HTTP(S) accesible desde el servidor Next.js; no use el prefijo `NEXT_PUBLIC_`.

No agregue aquí claves secretas del API ni credenciales administrativas de Supabase. La configuración privada del servidor pertenece al repositorio independiente `../../ark305-api` desde esta carpeta.

## Organización

- `src/app/`: páginas y rutas de adaptación HTTP.
- `src/components/`: presentación e interacción.
- `src/lib/`: estado local, formularios, configuración pública y transporte.
- `src/lib/dictionaries/`: textos de interfaz en español e inglés.
- `public/`: recursos estáticos.
- `test/`: pruebas de interfaz, validación y transporte.

Las rutas web actúan como adaptadores acotados: validan el formato de entrada, reenvían las operaciones permitidas al API y presentan respuestas seguras. No deben implementar reglas de negocio ni acceso directo a datos.

En Vercel, el directorio raíz del proyecto web es `frontend`. La preparación local no modifica despliegues ni configuración remota.

# ARK305: guía del proyecto y líneas de trabajo

> **Nota de estado — 2 de noviembre de 2026:** el contenido que sigue conserva el diagnóstico histórico de `1d801cf`; no debe utilizarse como inventario actual. Meta ya está conectado al diagnóstico y a Mi día desde Next.js. Nest gestiona catálogo, identidad y solicitudes. El recorrido hasta solicitud recibida e historial se probó anteriormente con servicios reales; no confirma reservas. Consulte [el recorrido principal](RECORRIDO_PRINCIPAL.md) y [el diagnóstico Meta](DIAGNOSTICO_META.md). La revisión nativa del commit de IA sigue pendiente de corrección por un bloqueo de continuidad de Gentle AI; publicar en dev no implica aprobarlo para producción.


**ARK305 reúne experiencias de vida y herramientas de negocio en una aplicación centrada en Miami.** Ya tiene pantallas y parte del backend implementadas, pero combina funciones conectadas con demostraciones. El próximo reto es convertir recorridos completos en operaciones reales, no solamente añadir más pantallas.

Esta guía está dirigida a producto, negocio y desarrollo. Se basa en la lectura del código de la revisión `1d801cf`, realizada el 29 de octubre de 2026. No certifica el estado del despliegue, de la base de datos remota ni el funcionamiento en ejecución.

## 1. El proyecto en dos minutos

| Pregunta | Respuesta |
|---|---|
| ¿Para quién es? | Personas que buscan experiencias y servicios, y profesionales o negocios que los ofrecen. |
| ¿Qué reúne? | Descubrimiento, perfiles, planificación del día, comunidad y herramientas comerciales. |
| ¿Qué papel tiene la IA? | Ayudar a orientar al usuario y preparar experiencias o propuestas. Hay un endpoint de Claude, pero no se encontraron consumidores desde la interfaz. |
| ¿Cómo pretende monetizar? | El catálogo presenta niveles, comisiones y descuentos. Son definiciones de producto, no prueba de cobros operativos. |
| ¿En qué etapa está? | Una base funcional parcial: interfaz amplia, cuentas y servicios con Supabase, y varios flujos todavía locales o de ejemplo. |

**Ruta de lectura:** las secciones 2–4 explican el producto; la 5 muestra dónde se guarda la información; las 6–8 organizan el trabajo; las 9–10 orientan al equipo técnico.

## 2. Tres conceptos que no deben confundirse

El código conserva varias generaciones de navegación y nomenclatura. No todos los conceptos representan el mismo interruptor visible.

| Concepto | Qué responde | Valores presentes en el código |
|---|---|---|
| Experiencia o lado | ¿Qué mundo interesa al usuario? | Lifestyle/Personal, Business y compatibilidad con ambos. El interruptor actual usa Personal y Business. |
| Buscar u ofrecer | ¿Qué quiere hacer? | Consumir experiencias o presentar servicios. El modelo anterior sigue definido en el código. |
| Nivel | ¿Qué beneficios tiene? | Gratis, Pro y Súper Premium VIP. Internamente se llaman `personal`, `business` y `vip`. |

**Ejemplo:** interesarse por Business no demuestra que una persona haya pagado el nivel Pro. La preferencia de navegación y el derecho a un beneficio son cosas distintas.

Referencia: [modelo de modos y niveles](../frontend/src/lib/mode.ts), [catálogo de niveles](../frontend/src/lib/levels.ts) y [layout principal](../frontend/src/app/layout.tsx).

## 3. Mapa del producto

| Área | Qué encuentra el usuario | Pantallas principales |
|---|---|---|
| Entrada y personalización | Acceso por correo, bienvenida y diagnóstico | `/entrar`, `/bienvenida`, `/diagnostico`, `/snapshot` |
| Vida y experiencias | Feed, personas y organización del día | `/`, `/descubrir`, `/mi-dia` |
| Perfil y oferta | Identidad pública, edición y servicios | `/perfil`, `/perfil/editar`, `/perfil/datos`, `/@usuario`, `/crear` |
| Negocio | Panel, oportunidades, talento, equipos y reventa | `/panel`, `/ganar`, `/talento`, `/equipo`, `/revender`, `/documentos` |
| Comunidad | Contenido, grupos, eventos y academia | `/comunidad`, `/academia` |
| Membresías | Beneficios y experiencia privada | `/niveles`, `/private` |

Una pantalla existente no implica que todas sus acciones estén conectadas a operaciones reales.

## 4. Qué está implementado y qué sigue pendiente

**Cómo leer el estado:** “implementado” significa que existe código; no significa que se haya probado en producción.

| Área | Evidencia actual | Qué falta comprobar o completar |
|---|---|---|
| Acceso | Enlace de correo con Supabase y callback de sesión | Entrega de correo, redirecciones y recorrido real de acceso/salida. |
| Perfiles y servicios | Consultas y acciones autenticadas para crear y editar datos | Flujos completos, validaciones y permisos con cuentas distintas. |
| Fotografías | Carga de imágenes en Supabase Storage y reglas de propiedad | Permisos y comportamiento real de carga, reemplazo y errores. |
| Personalización | Preferencias locales y persistencia de algunos datos en el perfil | Coherencia entre sesión, navegador y dispositivos. |
| Mi día, equipos y reventa | Interfaz y almacenamiento local | Persistencia compartida y seguimiento operativo. |
| Reservas y ventas | La interfaz y los textos presentan estas capacidades | No se ha acreditado un ciclo completo de reserva, pago, cancelación y prestación. |
| Membresías | Catálogo de precios/beneficios y nivel en cookie | Cobro, suscripción y autorización de beneficios desde servidor. |
| ARK Private | Acceso de demostración con código local | Control de acceso real antes de manejar información privada. |
| Comunidad | Contenido y estructuras de ejemplo | Publicación, participación y moderación operativas. |
| IA | Endpoint servidor que llama a Claude | Integración con interfaz y validación de respuestas, errores, límites y costes. |

### La IA tiene dos estados distintos

- **Interfaz actual:** el planificador utiliza reglas y palabras clave del catálogo.
- **Backend disponible:** `/api/ai` valida la sesión, consulta preferencias y llama a Anthropic. Incluye una llamada para contabilizar el uso diario; su comportamiento ante fallos debe verificarse.
- **Conexión pendiente de confirmar:** la búsqueda del código no encontró llamadas de componentes a `/api/ai`. Tener el endpoint no equivale a tener un asistente integrado.

Referencias: [planificador](../frontend/src/lib/catalog.ts), [endpoint IA](../frontend/src/app/api/ai/route.ts) y [acciones del servidor](../frontend/src/lib/actions.ts).

## 5. Dónde vive la información

| Lugar | Ejemplos | Consecuencia práctica |
|---|---|---|
| Supabase | Cuentas, perfiles, servicios, fotos; extensiones para preferencias y uso de IA | Puede persistir entre dispositivos cuando la configuración y las tablas están disponibles. |
| Cookies | Idioma, nivel y preferencias de navegación | Son estado del navegador; no deben demostrar una compra ni conceder permisos sensibles. |
| `localStorage` | Día planificado, equipo y propuestas de reventa | Se conserva en ese navegador; no garantiza sincronización con otro dispositivo. |
| Archivos del proyecto | Perfiles demo, catálogos y comunidad | Cambiar el contenido requiere cambiar el código; no son registros operativos de clientes. |

**Decisión pendiente de producto:** definir qué información debe pertenecer a la cuenta y qué puede ser temporal o local.

## 6. Líneas de trabajo propuestas

Estas líneas son una propuesta para organizar el desarrollo. No son compromisos de alcance, fechas ni tareas ya autorizadas.

| Línea | Objetivo | Criterio sencillo de finalización |
|---|---|---|
| 1. Producto y lenguaje | Aclarar Personal/Business, Buscar/Ofrecer y niveles; elegir el primer recorrido prioritario | El equipo describe el mismo flujo y la interfaz usa nombres coherentes. |
| 2. Base técnica y calidad | Poder ejecutar, comprobar y mantener el proyecto con confianza | Instalación reproducible, lint/build verificados y pruebas del recorrido elegido. |
| 3. Cuentas y datos | Consolidar perfiles, servicios, imágenes y preferencias | Dos usuarios pueden trabajar sin modificar datos ajenos y recuperar lo esperado al volver a entrar. |
| 4. Operación comercial | Convertir la intención de reservar o contratar en un proceso real | Una solicitud tiene responsable, estado y seguimiento, según reglas de negocio acordadas. |
| 5. Asistente IA | Conectar la ayuda inteligente con un caso de uso concreto | El usuario recibe una respuesta útil; errores y límites se muestran sin romper el recorrido. |
| 6. Monetización y acceso | Implementar pagos y beneficios verificables | Solo una suscripción válida concede beneficios; cancelaciones y cambios se reflejan correctamente. |
| 7. Comunidad y crecimiento | Sustituir contenido demo por actividad real | Existen reglas y herramientas para publicar, participar y moderar. |

### Dependencias importantes

- No cobrar por una operación que todavía no tiene un proceso claro de entrega y seguimiento.
- No usar cookies o códigos demo como autorización de prestaciones pagadas o información privada.
- No pedir a la IA disponibilidad o precios fiables sin una fuente de datos mantenida.
- No abrir publicación comunitaria sin definir quién modera y cómo se reporta contenido.

## 7. Orden recomendado

1. **Elegir un recorrido mínimo:** por ejemplo, entrar → completar perfil → publicar servicio → encontrarlo desde otra cuenta.
2. **Verificar ese recorrido de extremo a extremo:** configuración, datos, permisos y estados de error.
3. **Completar una operación comercial:** decidir qué significa solicitar o reservar y quién la atiende.
4. **Conectar IA a una ayuda delimitada:** por ejemplo, orientar una búsqueda con datos del catálogo, sin prometer disponibilidad no comprobada.
5. **Añadir cobros y ampliar áreas:** después de validar la operación y sus controles.

**Alternativa con una compensación clara:** priorizar una demo visual acelera presentaciones, pero no resuelve persistencia, permisos ni operación. Debe etiquetarse como demo y no confundirse con un lanzamiento comercial.

## 8. Preguntas de negocio que condicionan el desarrollo

- ¿Cuál será el primer público y qué problema concreto resolverá la primera entrega?
- ¿Una reserva será inmediata o una solicitud que alguien debe aprobar?
- ¿Quién mantiene servicios, precios y disponibilidad?
- ¿Qué beneficios y tarifas son definitivos? Los importes del catálogo actual están marcados como ejemplos.
- ¿Qué tarea concreta debe resolver la IA y qué datos podrá utilizar?

Estas decisiones deben resolverse antes de convertir cada área en un compromiso técnico.

## 9. Mapa técnico para encontrar cada pieza

```text
Pantallas y componentes
    ├── Preferencias y borradores → cookies / localStorage
    ├── Cuentas, perfiles y servicios → Supabase
    └── Integración de interfaz pendiente → /api/ai → Anthropic
```

| Ubicación | Responsabilidad |
|---|---|
| [`frontend/src/app/`](../frontend/src/app/) | Rutas, layout y endpoints. |
| [`frontend/src/components/`](../frontend/src/components/) | Interfaz y recorridos de usuario. |
| [`frontend/src/lib/actions.ts`](../frontend/src/lib/actions.ts) | Acciones del servidor para perfiles, servicios y preferencias. |
| [`frontend/src/lib/profiles-db.ts`](../frontend/src/lib/profiles-db.ts) | Lectura de perfiles y combinación con datos demo. |
| [`frontend/src/lib/supabase/`](../frontend/src/lib/supabase/) | Configuración y clientes de Supabase. |
| [`frontend/src/lib/dictionaries/`](../frontend/src/lib/dictionaries/) | Diccionarios en español e inglés. |
| [`frontend/src/proxy.ts`](../frontend/src/proxy.ts) | Tratamiento de sesión y rutas públicas `@usuario`. |
| [`supabase/schema.sql`](../supabase/schema.sql) | Tablas iniciales, reglas de acceso y almacenamiento de imágenes. |
| [`supabase/002_experiences.sql`](../supabase/002_experiences.sql) | Extensiones de preferencias y contabilización del uso de IA. |

## 10. Preparación y límites de esta guía

El proyecto declara Next.js 16.3.6, React 19.2.8, TypeScript y Tailwind 4. Los comandos disponibles están en [`package.json`](../package.json): `dev`, `build`, `start` y `lint`.

- Para desarrollo local se necesitan dependencias instaladas y configuración de entorno. Consulte [README](../README.md) y [`.env.example`](../frontend/.env.example).
- Sin configuración pública de Supabase, existe un modo demo. Eso no valida el backend real.
- El endpoint IA necesita `ANTHROPIC_API_KEY` en servidor; la plantilla de entorno revisada no la documenta. Los modelos configurados también deben comprobarse antes de usar la integración.
- No ejecute los SQL en una base existente sin revisar primero su estado y los cambios propuestos.
- El README conserva referencias a fases anteriores. Esta guía distingue código presente de capacidades operativas verificadas.

**Comprobaciones no realizadas:** ejecución de la aplicación, lint, build, pruebas funcionales, despliegue, tablas remotas, pagos y llamadas reales a IA. En la inspección inicial no había `node_modules`, script de pruebas ni archivos de pruebas identificados.

**Siguiente paso recomendado:** acordar el recorrido mínimo de la sección 7 y comprobarlo antes de ampliar funcionalidades.

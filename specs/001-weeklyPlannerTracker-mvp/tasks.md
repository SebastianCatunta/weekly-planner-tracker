# Tareas 001: Weekly Planner Tracker (MVP)

Derivadas de [spec.md](spec.md) y [plan.md](plan.md). Cada tarea dura 20-30 min como máximo y se hace en el orden indicado: una tarea solo depende de las anteriores.

## Reglas de trabajo (constitución)

- **Tests primero en `core`** (principio 4): en cada tarea de `core`, escribe los tests antes que la función, y la tarea no termina con tests en rojo.
- **Referencia al requisito** (principio 2): cada función de `core` lleva el comentario `// 001/RF-x` del requisito que cumple.
- **Lógica fuera de las rutas y los componentes** (principio 3): si una regla de negocio aparece fuera de `server/src/core/`, la tarea no está hecha.
- **Idioma** (principio 6): código en inglés; texto visible solo en `client/src/messages/es.js`.
- **Si surge un bug**, primero se añade el test que lo reproduce.

---

## Fase 0: Preparación

- [x] **T-01 · Proyecto del servidor** (20 min) · RF: base de todos
  Depende de: —
  Hecho cuando: existe `server/` con su `package.json` (módulos ES, Node 20 o superior), las carpetas de la sección 1 del plan, y `npm test` en `server/` termina sin error ejecutando `node --test`.

- [x] **T-02 · Proyecto del cliente** (25 min) · RF: base de RF-1 a RF-8
  Depende de: T-01
  Hecho cuando: existe `client/` con React y Vite; `npm run dev` abre una página con el texto "Weekly Planner Tracker" y las peticiones a `/api` se redirigen al puerto del servidor (comprobado con una petición a una ruta inexistente que llega al servidor).

- [x] **T-03 · README y configuración** (20 min) · RF: principio 1 y 5
  Depende de: T-01, T-02
  Hecho cuando: el README lista cada dependencia con su justificación (tabla de la sección 8 del plan), explica cómo arrancar servidor y cliente, y existe un `.env.example` con la variable de la dirección de MongoDB sin ningún valor secreto; el archivo `.env` real está excluido del repositorio.

---

## Fase 1: Lógica de negocio (`server/src/core/`)

- [x] **T-04 · `timeUtils`** (30 min) · RF-3.4, RF-3.7
  Depende de: T-01
  Hecho cuando: `node --test` pasa con estos casos: "18:00" → 1080; "23:59" → 1439; "00:00" como inicio → 0; "00:00" como fin → 1440; "25:00", "12:60", "" y "abc" son inválidos; 1440 se muestra "00:00" y 1080 se muestra "18:00".

- [x] **T-05 · `normalizeText`** (20 min) · RF-3.1
  Depende de: T-01
  Hecho cuando: los tests pasan con: espacios al inicio y al final eliminados; "Estudiar    inglés" → "Estudiar inglés"; solo espacios → texto vacío; tildes y ñ intactas.

- [x] **T-06 · Validación de nombre y categoría** (30 min) · RF-3.2, RF-3.6, RF-3.8
  Depende de: T-05
  Hecho cuando: los tests pasan con: vacío tras normalizar → `NAME_REQUIRED` / `CATEGORY_REQUIRED`; 30 caracteres aceptado y 31 rechazado con `*_TOO_LONG`; un texto de 32 caracteres que queda en 30 tras normalizar se acepta; `<`, `>`, `{`, `}`, `$`, `;`, `'`, `"`, acento grave, `--`, `/*` y `*/` → `TEXT_NOT_ALLOWED`; emojis, tildes, ñ, dígitos y signos normales aceptados. Cada error indica su campo en `fields`.

- [x] **T-07 · Validación de día y horas** (30 min) · RF-3.3, RF-3.5, RF-3.7
  Depende de: T-04
  Hecho cuando: los tests pasan con: día, inicio o fin ausentes → `DAY_REQUIRED` / `START_REQUIRED` / `END_REQUIRED`; día fuera de las 7 claves → `DAY_INVALID`; hora mal formada → `TIME_INVALID`; fin igual al inicio y fin anterior al inicio → `END_NOT_AFTER_START`; 23:00–01:00 rechazada; 23:59–00:00, 00:00–23:59 y actividad de 1 minuto aceptadas; 00:00–00:00 aceptada como día completo.

- [x] **T-08 · `validateActivity` completo** (25 min) · RF-3.10, RF-3.11
  Depende de: T-06, T-07
  Hecho cuando: los tests pasan con: entrada válida → `{ ok: true, value }` con nombre y categoría normalizados y `startMinute`/`endMinute`; nombre vacío y fin igual al inicio a la vez → ambos errores en una sola respuesta; cada error trae `code` y `fields`.

- [x] **T-09 · Solapamiento** (25 min) · RF-4.1, RF-4.2, RF-4.3
  Depende de: T-01
  Hecho cuando: los tests de `findConflicts` pasan con: solape parcial; actividad contenida; actividad que contiene a otra; contigua (una termina cuando empieza la otra) sin choque; choque con dos actividades devuelve las dos; el día se filtra antes, de modo que actividades de otro día nunca chocan.

- [x] **T-10 · Duplicado idéntico** (20 min) · RF-4.4
  Depende de: T-09
  Hecho cuando: los tests pasan con: misma nombre, categoría, día, inicio y fin → `isDuplicate: true`; mismo nombre en franja distinta que no se solapa → sin conflicto; mismo horario con otro nombre → conflicto pero `isDuplicate: false`; comparación exacta: "Estudio" y "estudio" son categorías distintas.

- [x] **T-11 · Cierre de `core`** (20 min) · principios 2, 3, 4
  Depende de: T-08, T-10
  Hecho cuando: `core/index.js` exporta las funciones públicas; toda función de `core` tiene su comentario `// 001/RF-x`; una búsqueda de `express`, `mongodb`, `document`, `window` y `localStorage` dentro de `server/src/core/` no devuelve resultados; `npm test` en verde.

---

## Fase 2: Base de datos

- [x] **T-12 · Conexión a MongoDB** (25 min) · RF-7.1, RF-6.1
  Depende de: T-03
  Hecho cuando: con MongoDB encendido el servidor conecta usando la variable de entorno; con MongoDB apagado o dirección errónea la conexión falla con un error propio `DatabaseUnavailableError`, sin imprimir la dirección de conexión en el mensaje.

- [x] **T-13 · Repositorio: guardar y leer un día** (30 min) · RF-2.2, RF-2.3, RF-6.2, RF-6.3
  Depende de: T-12, T-11
  Hecho cuando: `insert` guarda un documento con los campos del plan (sección 2.1: nombre, categoría, `day`, `startMinute`, `endMinute`, `createdAt`), sin campo de usuario ni de semana; `findByDay` devuelve solo las actividades de ese día; el índice `{ day: 1, startMinute: 1 }` existe (comprobado en MongoDB); con MongoDB apagado ambas operaciones lanzan `DatabaseUnavailableError`; las consultas usan solo valores (RNF-9): un valor que contiene `$ne` se busca como texto literal.

- [x] **T-14 · Repositorio: leer todo, con lectura estricta** (25 min) · RF-6.1, RF-7.4
  Depende de: T-13
  Hecho cuando: `findAll` devuelve todas las actividades ordenadas por día y `startMinute`; si se inserta a mano un documento inválido (por ejemplo `endMinute` menor que `startMinute`), `findAll` lanza `DATA_CORRUPT` en lugar de devolver una lista parcial.

---

## Fase 3: Servicio

- [x] **T-15 · Cola de escritura** (20 min) · RF-4.5
  Depende de: T-01
  Hecho cuando: un test con `node --test` lanza dos tareas asíncronas casi a la vez y comprueba que la segunda empieza solo cuando termina la primera, y que si la primera falla la cola sigue funcionando.

- [x] **T-16 · Servicio: validar antes de guardar** (25 min) · RF-3.9, RF-3.10
  Depende de: T-11
  Hecho cuando: con un repositorio falso en memoria, `createActivity` con datos inválidos devuelve el resultado `VALIDATION_FAILED` con todos los `details` y **no llama** al repositorio (comprobado en el test).

- [x] **T-17 · Servicio: choques y duplicados** (30 min) · RF-4.1, RF-4.4, RF-4.5
  Depende de: T-15, T-16
  Hecho cuando: con repositorio falso, un choque devuelve `OVERLAP` con la lista completa de conflictos y los campos `day`, `start`, `end`; una actividad idéntica devuelve `DUPLICATE_OVERLAP`; dos registros que se solapan lanzados a la vez dejan guardado solo el primero; dos envíos idénticos seguidos dejan uno guardado y el segundo es `DUPLICATE_OVERLAP`; el orden es siempre campos, luego choques, luego guardado.

- [x] **T-18 · Servicio: guardar y errores de conexión** (30 min) · RF-2.3, RF-7.1, RF-7.2
  Depende de: T-17, T-13
  Hecho cuando: con repositorio falso, un registro válido devuelve la actividad como `ActivityDto` (`id`, `name`, `category`, `day`, `start`, `end`, `startMinute`, `endMinute`; el fin del día se muestra "00:00"); si el repositorio lanza `DatabaseUnavailableError`, el servicio devuelve `DB_UNAVAILABLE` y no queda nada guardado; los fallos inesperados devuelven `INTERNAL`.

- [x] **T-19 · Servicio: listar actividades** (20 min) · RF-1.1, RF-6.1, RF-7.4
  Depende de: T-14, T-18
  Hecho cuando: con repositorio falso, `listActivities` devuelve todas como `ActivityDto` ordenadas; propaga `DB_UNAVAILABLE` y `DATA_CORRUPT` sin devolver listas parciales.

---

## Fase 4: API HTTP

- [x] **T-20 · Aplicación Express base** (20 min) · RF-7 (base)
  Depende de: T-19
  Hecho cuando: `server.js` arranca la aplicación con lectura de JSON; un cuerpo mal formado en cualquier ruta responde 400 `INVALID_BODY` y un fallo no controlado responde 500 `INTERNAL`, ambos con la forma `{ "error": { "code": ... } }` y sin mostrar detalles internos.

- [x] **T-21 · `GET /api/activities`** (20 min) · RF-1.1, RF-5.1, RF-5.2, RF-6.1, RF-6.3, RF-7.4
  Depende de: T-20
  Hecho cuando: con datos devuelve 200 `{ "activities": [...] }` ordenadas; sin datos devuelve 200 con lista vacía; con MongoDB apagado devuelve 503 `DB_UNAVAILABLE`; con un documento inválido devuelve 500 `DATA_CORRUPT`.

- [x] **T-22 · `POST /api/activities`** (30 min) · RF-2.3, RF-3.x, RF-4.x, RF-7.1, RF-7.2, RNF-9
  Depende de: T-20
  Hecho cuando: con una herramienta de peticiones (curl o similar) se comprueba: válida → 201 y queda en MongoDB; campos inválidos → 422 con todos los `details`; choque → 409 `OVERLAP` con `conflicts`; idéntica → 409 `DUPLICATE_OVERLAP`; MongoDB apagado → 503 y no queda nada guardado; un cuerpo con una clave que empieza por `$` se rechaza con 400 `INVALID_BODY`; la ruta no contiene reglas de negocio, solo traduce el resultado del servicio.

- [x] **T-23 · Flujo de eventos (`eventHub` y `GET /api/events`)** (25 min) · RF-8.1
  Depende de: T-20
  Hecho cuando: una conexión abierta a `/api/events` (con curl o el navegador) permanece abierta, recibe un comentario periódico de mantenimiento, y `eventHub` elimina del registro a los clientes que se desconectan (comprobado cerrando la conexión y viendo que no hay error al emitir).

- [x] **T-24 · Emitir `activity-created`** (20 min) · RF-8.1
  Depende de: T-22, T-23
  Hecho cuando: con dos conexiones abiertas a `/api/events`, un `POST` válido hace llegar a las dos el evento `activity-created` con el `ActivityDto`; un `POST` rechazado no emite ningún evento.

- [x] **T-25 · Verificación de la API sin interfaz** (25 min) · RF-3.9, RF-4.5, RF-7.1
  Depende de: T-24
  Hecho cuando: se marcan como correctos estos casos con una herramienta externa: día inexistente, hora "25:99" y nombre con `<script>` enviados directamente se rechazan con 422; dos peticiones simultáneas que chocan dejan guardada solo la primera; con MongoDB apagado el `POST` responde 503.

---

## Fase 5: Interfaz (`client/`)

- [x] **T-26 · `messages/es.js`** (25 min) · RNF-3, RF-1.4, RF-7.1, RF-7.4
  Depende de: T-02
  Hecho cuando: el archivo contiene los nombres de los 7 días, las etiquetas del formulario, el mensaje de confirmación, el texto exacto "No se pudo guardar por fallas de conexión", los textos exactos "Cargando tus actividades" y "Ocurrió un fallo del sistema al cargar tus actividades, intenta de nuevo en 1 minuto.", y una traducción por cada código de la sección 4 del plan (incluidos `OVERLAP` y `DUPLICATE_OVERLAP`, que aceptan la lista de actividades en conflicto); no hay texto visible en ningún otro archivo (comprobado buscando cadenas en los componentes).

- [x] **T-27 · Cliente de la API** (25 min) · RF-1.1, RF-2.3
  Depende de: T-21, T-22, T-02
  Hecho cuando: `getActivities` y `createActivity` devuelven un resultado uniforme (éxito con datos, o error con `code`, `details`, `fields` y `conflicts`), y un fallo de red se convierte en el código `DB_UNAVAILABLE`; comprobado llamándolos desde la consola del navegador.

- [x] **T-28 · Hook `useActivities`** (25 min) · RF-1.1, RF-7.4
  Depende de: T-27
  Hecho cuando: el hook expone los estados `loading`, `ready` y `failed` con la lista; con el servidor apagado pasa a `failed` y la lista no se presenta como válida, y mientras carga se ve "Cargando tus actividades" (comprobado con un componente de prueba que muestra el estado).

- [x] **T-29 · `WeeklyGrid` base** (30 min) · RF-1.1 a 1.5
  Depende de: T-26
  Hecho cuando: la pantalla muestra 7 columnas de lunes a domingo con el nombre de cada día (sin fechas), 24 filas de hora de 00:00 a 24:00 de al menos 48 px cada una (1152 px en total), que se desplaza con scroll, y vacía no muestra textos de ayuda.

- [x] **T-30 · `gridLayout` y `ActivityBlock`** (30 min) · RF-5.1 a 5.4, RF-1.2
  Depende de: T-29
  Hecho cuando: un bloque aparece en la columna de su día con posición `startMinute / 1440` y altura `(endMinute − startMinute) / 1440`; muestra nombre, categoría y horas, la categoría como texto sin color; una actividad de 1 minuto tiene al menos 20 px de alto y su nombre se lee; una de 00:00 a 00:00 ocupa el día completo; si un bloque de altura mínima tocaría el siguiente del mismo día, este se desplaza hacia abajo y no se superponen.

- [x] **T-31 · Unir pantalla con datos** (20 min) · RF-1.1, RF-5.1, RF-6.1, RF-7.4
  Depende de: T-28, T-30
  Hecho cuando: con actividades insertadas a mano en MongoDB, `App` las muestra en su día y hora; con el servidor apagado muestra un aviso de error de carga y no una cuadrícula vacía como si fuera real.

- [ ] **T-32 · `TimeSelect`** (25 min) · RF-3.7
  Depende de: T-26
  Hecho cuando: ofrece lista de horas 00–23 y de minutos 00–59 (parte sin selección); es imposible elegir una hora o un minuto fuera de rango; entrega el valor "HH:MM" o vacío si falta alguno de los dos.

- [ ] **T-33 · `ActivityForm`: campos** (25 min) · RF-2.1, RF-2.2
  Depende de: T-32
  Hecho cuando: el formulario muestra nombre, categoría, un único selector de día, inicio y fin, los cinco vacíos al abrir, y un botón de guardar; el selector de día no permite marcar más de un día.

- [ ] **T-34 · Envío y éxito** (30 min) · RF-2.3, RF-2.4, RF-7.2
  Depende de: T-31, T-33
  Hecho cuando: al enviar una actividad válida los cinco campos se vacían, la actividad aparece en la cuadrícula en su día y hora, y no aparece antes de que el servidor responda 201 (comprobado con la red limitada en las herramientas del navegador).

- [ ] **T-35 · `SaveStatus` y `Toast`** (25 min) · RF-2.4, RF-2.5
  Depende de: T-34
  Hecho cuando: mientras se guarda se ve el icono "guardando"; al terminar se ve el icono "guardado"; aparece un mensaje de confirmación que desaparece a los 5 segundos (medido con un cronómetro).

- [ ] **T-36 · Rechazos por error del usuario** (30 min) · RF-3.10, RF-3.11, RF-4.1, RF-4.4
  Depende de: T-34, T-26
  Hecho cuando: con varios campos inválidos se muestran todos los mensajes a la vez; solo se vacían los campos listados en `fields` y los demás conservan lo escrito, y se pide rellenar los vaciados; un choque nombra todas las actividades en conflicto y vacía día, inicio y fin; un duplicado informa que es duplicado y solapamiento, y pide verificar el horario.

- [ ] **T-37 · Error de conexión al guardar** (20 min) · RF-7.1, RF-7.2, RF-7.3
  Depende de: T-34
  Hecho cuando: con MongoDB apagado, al enviar se muestra exactamente "No se pudo guardar por fallas de conexión" pidiendo intentar de nuevo; los cinco campos conservan lo escrito; la actividad no aparece en el horario; al reintentar con MongoDB encendido se guarda.

- [ ] **T-38 · Sincronización entre pestañas** (30 min) · RF-8.1
  Depende de: T-24, T-31
  Hecho cuando: el cliente se suscribe a `/api/events`; con dos pestañas abiertas, registrar en una hace aparecer la actividad en la otra sin recargar; la pestaña que registró no muestra la actividad duplicada (se une por `id`); si se apaga y enciende el servidor, la pestaña vuelve a cargar la lista completa.

- [ ] **T-39 · Servir el cliente desde Express** (20 min) · RF-1.1 (acceso en producción), RNF-5
  Depende de: T-38
  Hecho cuando: tras compilar el cliente, el servidor entrega la página en su propia dirección y la aplicación funciona completa sin el servidor de desarrollo de Vite.

---

## Fase 6: Verificación y cierre

- [ ] **T-40 · Verificación manual, interfaz** (30 min) · RF-1.1 a 1.5, RF-2.1 a 2.5, RF-3.7, RF-3.10, RF-3.11, RF-5.1 a 5.4
  Depende de: T-39
  Hecho cuando: se ejecutan y se marcan como correctas las comprobaciones de interfaz de la sección 9.4 del plan (pantalla inicial, formulario vacío, hora inválida imposible, registro válido con iconos y mensaje de 5 s, varios errores a la vez).

- [ ] **T-41 · Verificación manual, choques, concurrencia y persistencia** (30 min) · RF-4.1 a 4.5, RF-6.1 a 6.3
  Depende de: T-39
  Hecho cuando: se comprueban y marcan: choque con dos actividades nombra ambas; doble clic deja una sola y la segunda se informa como duplicado y solapamiento; dos navegadores con choque simultáneo dejan la primera; cerrar y reabrir el navegador, y abrir desde otro equipo, muestra el mismo horario.

- [ ] **T-42 · Verificación manual, fallos y varias pestañas** (25 min) · RF-7.1 a 7.4, RF-8.1
  Depende de: T-39
  Hecho cuando: se comprueban y marcan: MongoDB apagado al registrar (mensaje exacto, campos conservados, actividad ausente); MongoDB apagado al recargar (aviso de error, no cuadrícula vacía); dos pestañas sincronizadas sin recargar.

- [ ] **T-43 · Revisión final contra la constitución** (25 min) · principios 1 a 6, criterio de finalización 4
  Depende de: T-40, T-41, T-42
  Hecho cuando: se comprueba y marca: solo se usan Express, React y MongoDB más las dependencias del README; toda función de `core` tiene `// 001/RF-x` y su test; `npm test` en verde; `core` sin referencias a Express, MongoDB, `document` o `window`; la persistencia usa solo MongoDB con la plantilla separada del registro; todo texto visible está en español en `messages/es.js` y el código en inglés.

---

## Cobertura de requisitos

| RF | Tareas |
|---|---|
| RF-1.1 | T-19, T-21, T-28, T-29, T-31, T-39, T-40 |
| RF-1.2 | T-29, T-30, T-40 |
| RF-1.3 | T-29, T-40 |
| RF-1.4 | T-26, T-29, T-40 |
| RF-1.5 | T-29, T-40 |
| RF-2.1 | T-33, T-40 |
| RF-2.2 | T-13, T-33 |
| RF-2.3 | T-18, T-22, T-27, T-34, T-40 |
| RF-2.4 | T-34, T-35, T-40 |
| RF-2.5 | T-35, T-40 |
| RF-3.1 | T-05, T-08 |
| RF-3.2 | T-06, T-08 |
| RF-3.3 | T-07, T-08 |
| RF-3.4 | T-04, T-07 |
| RF-3.5 | T-07 |
| RF-3.6 | T-06 |
| RF-3.7 | T-04, T-07, T-32, T-40 |
| RF-3.8 | T-06, T-25 |
| RF-3.9 | T-16, T-22, T-25 |
| RF-3.10 | T-08, T-16, T-36, T-40 |
| RF-3.11 | T-08, T-36, T-40 |
| RF-4.1 | T-09, T-17, T-36, T-41 |
| RF-4.2 | T-09 |
| RF-4.3 | T-09 |
| RF-4.4 | T-10, T-17, T-36, T-41 |
| RF-4.5 | T-15, T-17, T-25, T-41 |
| RF-5.1 | T-21, T-30, T-31, T-40 |
| RF-5.2 | T-21, T-30 |
| RF-5.3 | T-30 |
| RF-5.4 | T-29, T-30, T-40 |
| RF-6.1 | T-12, T-14, T-19, T-21, T-31, T-41 |
| RF-6.2 | T-13 |
| RF-6.3 | T-13, T-21, T-41 |
| RF-7.1 | T-12, T-18, T-25, T-26, T-37, T-42 |
| RF-7.2 | T-18, T-34, T-37, T-42 |
| RF-7.3 | T-37, T-42 |
| RF-7.4 | T-14, T-19, T-21, T-28, T-31, T-42 |
| RF-8.1 | T-23, T-24, T-38, T-42 |
| RNF-9 | T-13, T-22, T-25 |

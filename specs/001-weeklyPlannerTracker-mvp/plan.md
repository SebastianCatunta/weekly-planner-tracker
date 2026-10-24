# Plan técnico 001: Weekly Planner Tracker (MVP)

Este plan responde al CÓMO de [spec.md](spec.md) y respeta `docs/constitution.md`. No contiene código: solo estructura, contratos, pseudocódigo y decisiones. Cada parte indica entre corchetes qué requisitos cubre (`[RF-x]`).

## 0. Alcance y supuestos del plan

- **Cubre** RF-1 a RF-8 de la spec 001 y los RNF aplicables.
- **Racha:** la spec 001 deja fuera el contador, el historial y la racha (sección 7 de la spec). Ningún RF la pide. Se documenta el algoritmo en la sección 5 porque se solicitó, pero **no se implementa ni se crea su colección en 001**.
- **Dudas:** la spec no tiene dudas abiertas. Las decisiones que estaban pendientes quedaron fijadas en la spec, y el plan las aplica directamente.
- **Constitución:** principio 1 (Express, React, MongoDB, JavaScript), 2 (referencias `// 001/RF-x` en `core`), 3 (lógica en `server/core/`), 4 (`node --test` en `core`), 5 (MongoDB, plantilla separada del registro), 6 (código en inglés, textos en español en un solo archivo).

## 1. Estructura de módulos

```
weekly-planner-tracker/
├── docs/constitution.md
├── specs/001-weeklyPlannerTracker-mvp/{spec.md, plan.md}
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── core/                    # PURO: sin Express, Mongo ni React (principio 3)
│   │   │   ├── timeUtils.js         # "HH:MM" <-> minutos del día
│   │   │   ├── normalizeText.js     # normalización de espacios
│   │   │   ├── validateActivity.js  # reglas de campos, devuelve TODOS los errores
│   │   │   ├── findConflicts.js     # solapamiento y duplicado
│   │   │   └── index.js
│   │   ├── services/activityService.js     # orquesta: validar -> choques -> guardar
│   │   ├── repositories/activityRepository.js  # único módulo que habla con Mongo
│   │   ├── db/connection.js
│   │   ├── events/eventHub.js              # clientes SSE conectados
│   │   ├── routes/{activitiesRoutes.js, eventsRoutes.js}   # delgadas: traducen HTTP
│   │   ├── app.js                          # configura Express
│   │   └── server.js                       # arranque
│   └── tests/core/*.test.js
└── client/
    ├── package.json
    └── src/
        ├── main.jsx, App.jsx
        ├── api/{activitiesApi.js, eventsClient.js}
        ├── hooks/useActivities.js
        ├── components/{WeeklyGrid, ActivityBlock, ActivityForm, TimeSelect, SaveStatus, Toast}.jsx
        ├── utils/gridLayout.js             # solo geometría de la cuadrícula
        └── messages/es.js                  # ÚNICO archivo con textos visibles (principio 6)
```

| Módulo | Responsabilidad | Cubre |
|---|---|---|
| `core/timeUtils` | Convierte "HH:MM" a minutos; trata el fin `00:00` como 1440 (fin del día). | RF-3.4, RF-3.5, RF-3.7 |
| `core/normalizeText` | Quita espacios al inicio, al final y repetidos entre palabras. | RF-3.1 |
| `core/validateActivity` | Valida nombre, categoría, día, horas; devuelve todos los errores con los campos afectados. | RF-3.2, 3.3, 3.5, 3.6, 3.8, 3.10, 3.11 |
| `core/findConflicts` | Detecta solapamientos (todos) y duplicado idéntico. | RF-4.1 a 4.4 |
| `services/activityService` | Ejecuta el orden campos → choques → guardado, con escritura serializada. | RF-2.3, 3.9, 4.5, 7.2 |
| `repositories/activityRepository` | Lee y guarda en MongoDB; traduce fallos de conexión a un error propio. | RF-6.1 a 6.3, 7.1, 7.4 |
| `events/eventHub` + `routes/eventsRoutes` | Avisa a todas las pestañas de una actividad nueva. | RF-8.1 |
| `routes/activitiesRoutes` | `GET` y `POST` de actividades; traduce errores a códigos HTTP. | RF-1.1, 2.3, 7.1 |
| `client/hooks/useActivities` | Carga inicial, unión con eventos en vivo, estado de carga y error. | RF-1.1, 7.4, 8.1 |
| `client/components/WeeklyGrid` y `ActivityBlock` | Cuadrícula de 7 columnas por 24 horas con scroll. | RF-1.1 a 1.5, 5.1 a 5.4 |
| `client/components/ActivityForm`, `TimeSelect` | Formulario, entrada de horas válidas, vaciado selectivo de campos. | RF-2.1, 2.2, 2.4, 3.7, 3.11, 7.3 |
| `client/components/SaveStatus`, `Toast` | Iconos "guardando" y "guardado"; mensaje de 5 s. | RF-2.4, 2.5 |
| `client/messages/es.js` | Traduce códigos de error del servidor a texto en español. | RNF-3, RF-7.1 |

## 2. Modelo de datos

### 2.1 Colección `activities` (la plantilla semanal) [RF-2.2, RF-6.1 a 6.3]

| Campo | Tipo | Regla |
|---|---|---|
| `_id` | ObjectId | Generado por MongoDB. |
| `name` | string | Normalizado, 1 a 30 caracteres. |
| `category` | string | Normalizado, 1 a 30 caracteres. |
| `day` | string | Uno de `monday` … `sunday`. Un solo día por documento [RF-2.2]. |
| `startMinute` | entero | 0 a 1439. Minutos desde las 00:00. |
| `endMinute` | entero | 1 a 1440, siempre mayor que `startMinute`. `1440` representa el fin del día (`00:00`) [RF-3.4]. |
| `createdAt` | fecha | Momento del registro. No se usa en 001; los días no cumplidos futuros lo necesitarán. |

No existe campo de usuario ni de semana: el horario es único y recurrente [RF-6.2, RF-6.3].

**Ejemplo de documento** (actividad "Estudiar" los lunes de 18:00 a 20:00):

```json
{
  "_id": "6718f2a1c4b3e90012ab34cd",
  "name": "Estudiar",
  "category": "Estudio",
  "day": "monday",
  "startMinute": 1080,
  "endMinute": 1200,
  "createdAt": "2026-10-23T14:05:00.000Z"
}
```

**Ejemplo con fin de día:** "Leer" de domingo 23:00 a 00:00 se guarda con `startMinute` 1380 y `endMinute` 1440.

### 2.2 Índice
- `{ day: 1, startMinute: 1 }`: acelera la lectura de las actividades de un día para validar choques y mostrar el horario ordenado [RF-4.1, RF-5.2].
- No hay índice único: MongoDB no puede expresar solapamiento de intervalos. La unicidad la garantiza la serialización de escrituras (decisión D5).

### 2.3 Reservado, no se crea en 001
- `completions` (un registro por actividad y fecha) pertenece a una spec posterior (principio 5). No se crea ahora.

## 3. Algoritmos en pseudocódigo

### 3.1 Normalización y validación de campos [RF-3.1 a 3.10, RF-3.11]

```
function normalizeText(text):
    return text sin espacios al inicio ni al final,
           con cada grupo de espacios internos reducido a uno           // RF-3.1

function endToMinutes(end):
    if end == "00:00": return 1440                                      // RF-3.4
    return parseMinutes(end)

function validateActivity(input):
    errors = []
    name     = normalizeText(input.name)
    category = normalizeText(input.category)

    // Todos los errores juntos, nunca solo el primero                  // RF-3.10
    if name is empty:                 add NAME_REQUIRED       fields [name]      // RF-3.2
    else if length(name) > 30:        add NAME_TOO_LONG       fields [name]      // RF-3.6
    else if containsDisallowed(name): add TEXT_NOT_ALLOWED    fields [name]      // RF-3.8

    (lo mismo para category con CATEGORY_REQUIRED / CATEGORY_TOO_LONG / TEXT_NOT_ALLOWED)

    if input.day is missing:              add DAY_REQUIRED    fields [day]       // RF-3.3
    else if input.day not in the 7 keys:  add DAY_INVALID     fields [day]       // RF-3.9
    if input.start is missing:            add START_REQUIRED  fields [start]
    else if not a valid "HH:MM":          add TIME_INVALID    fields [start]     // RF-3.7 (servidor)
    if input.end is missing:              add END_REQUIRED    fields [end]
    else if not a valid "HH:MM":          add TIME_INVALID    fields [end]

    if start and end are valid:
        startMin = parseMinutes(start)
        endMin   = endToMinutes(end)
        if endMin <= startMin:
            add END_NOT_AFTER_START fields [end]                                 // RF-3.5

    if errors is not empty: return { ok: false, errors }
    return { ok: true, value: { name, category, day, startMinute, endMinute } }
```

Cada error lleva `fields`: la lista de campos que la interfaz vacía y pide rellenar de nuevo, y solo esos [RF-3.11].

### 3.2 Solapamiento y duplicado [RF-4.1 a 4.4]

```
function overlaps(a, b):
    // intervalos semiabiertos [inicio, fin): tocarse en un extremo NO es choque
    return a.startMinute < b.endMinute AND b.startMinute < a.endMinute       // RF-4.2

function findConflicts(candidate, sameDayActivities):
    conflicts = [ x in sameDayActivities where overlaps(candidate, x) ]      // RF-4.1: todas
    // sameDayActivities ya excluye otros días                               // RF-4.3
    duplicate = any x in conflicts where
                x.name == candidate.name AND x.category == candidate.category
                AND x.startMinute == candidate.startMinute
                AND x.endMinute == candidate.endMinute
    return { conflicts, isDuplicate: duplicate }                             // RF-4.4
```

### 3.3 Registro completo con escritura serializada [RF-2.3, RF-3.9, RF-4.5, RF-7]

```
function createActivity(input):
    result = validateActivity(input)                                  // 1) campos
    if not result.ok: return 422 VALIDATION_FAILED(result.errors)

    await writeQueue.run(function():                                  // una escritura a la vez
        sameDay = repository.findByDay(result.value.day)              //   puede fallar -> DB_UNAVAILABLE
        found   = findConflicts(result.value, sameDay)                // 2) choques
        if found.conflicts is not empty:
            if found.isDuplicate: return 409 DUPLICATE_OVERLAP(found.conflicts)
            return 409 OVERLAP(found.conflicts)
        saved = repository.insert(result.value + createdAt = now)     // 3) guardado
        eventHub.broadcast("activity-created", saved)                 // RF-8.1
        return 201 saved
    )
    // si el repositorio lanza DatabaseUnavailableError -> 503 DB_UNAVAILABLE   // RF-7.1
```

La cola de escritura hace que, si dos peticiones chocan casi a la vez, se evalúe primero la que llegó antes y la segunda vea a la primera ya guardada [RF-4.5]. También resuelve el doble clic: la segunda petición se rechaza como duplicado [RF-4.4].

## 4. Contrato del backend (API HTTP)

Todas las rutas cuelgan de `/api`. El servidor **no devuelve texto para el usuario**: devuelve códigos, y el cliente los traduce (decisión D6).

### 4.1 `GET /api/activities` [RF-1.1, RF-5.1, RF-5.2, RF-6.1, RF-6.3, RF-7.4]

| Resultado | Código | Cuerpo |
|---|---|---|
| Todas las actividades, ordenadas por día y `startMinute` | 200 | `{ "activities": [ActivityDto, ...] }` |
| Sin conexión con la base de datos | 503 | `{ "error": { "code": "DB_UNAVAILABLE" } }` |
| Alguna actividad guardada es inválida (solo si la base de datos se alteró fuera de la aplicación) | 500 | `{ "error": { "code": "DATA_CORRUPT" } }` |

Si el listado no puede devolverse completo, no se devuelve parcial [RF-7.4].

### 4.2 `POST /api/activities` [RF-2.3, RF-3.x, RF-4.x, RF-7.1, RF-7.2]

**Petición**
```json
{ "name": "  Estudiar   inglés ", "category": "Estudio", "day": "monday", "start": "18:00", "end": "20:00" }
```
Todos los campos son texto. Un campo ausente se trata como vacío.

**Respuestas**

| Resultado | Código | Cuerpo |
|---|---|---|
| Guardada | 201 | `{ "activity": ActivityDto }` |
| Campos inválidos (uno o varios) | 422 | `{ "error": { "code": "VALIDATION_FAILED", "details": [ { "code": "...", "fields": ["..."] } ] } }` |
| Choque con otras actividades | 409 | `{ "error": { "code": "OVERLAP", "fields": ["day","start","end"], "conflicts": [ConflictDto, ...] } }` |
| Choque y además idéntica | 409 | igual que el anterior con `"code": "DUPLICATE_OVERLAP"` |
| Sin conexión con la base de datos | 503 | `{ "error": { "code": "DB_UNAVAILABLE" } }` |
| Cuerpo ilegible | 400 | `{ "error": { "code": "INVALID_BODY" } }` |
| Fallo inesperado | 500 | `{ "error": { "code": "INTERNAL" } }` |

**Códigos de `details`:** `NAME_REQUIRED`, `CATEGORY_REQUIRED`, `DAY_REQUIRED`, `START_REQUIRED`, `END_REQUIRED`, `NAME_TOO_LONG`, `CATEGORY_TOO_LONG`, `TEXT_NOT_ALLOWED`, `DAY_INVALID`, `TIME_INVALID`, `END_NOT_AFTER_START`.

**Ejemplo de error 422** (nombre vacío y fin igual al inicio, los dos a la vez [RF-3.10]):
```json
{ "error": { "code": "VALIDATION_FAILED", "details": [
  { "code": "NAME_REQUIRED", "fields": ["name"] },
  { "code": "END_NOT_AFTER_START", "fields": ["end"] } ] } }
```

**Ejemplo de error 409:**
```json
{ "error": { "code": "OVERLAP", "fields": ["day", "start", "end"],
  "conflicts": [ { "id": "6718f2a1c4b3e90012ab34cd", "name": "Estudiar", "start": "18:00", "end": "20:00" } ] } }
```

**Objetos de respuesta**
- `ActivityDto`: `{ id, name, category, day, start, end, startMinute, endMinute }`. `start` y `end` son "HH:MM" (el fin del día se muestra "00:00"); `startMinute` y `endMinute` sirven para posicionar en la cuadrícula.
- `ConflictDto`: `{ id, name, start, end }`.

Conversión de códigos HTTP: la ruta solo traduce el resultado del servicio; no contiene reglas [principio 3].

### 4.3 `GET /api/events` (flujo de eventos del servidor) [RF-8.1]

- Conexión larga de tipo Server-Sent Events.
- Evento `activity-created`: `data` es un `ActivityDto` (el mismo que devuelve el `POST`).
- El servidor envía un comentario periódico para mantener la conexión viva.

## 5. Algoritmo de racha (preparado, fuera de alcance de 001)

> No cubre ningún RF de la spec 001. Se deja diseñado para la spec de seguimiento y se confirmará allí. **Definición supuesta:** racha actual = cantidad de veces programadas consecutivas, hacia atrás desde hoy, que se cumplieron sin saltarse ninguna. Los días en que la actividad no estaba programada no cuentan ni rompen la racha. El contador total es otra cosa: la cantidad de registros en `completions`.

```
function currentStreak(scheduledWeekday, createdOn, completedDates, today):
    // completedDates: conjunto de fechas ISO cumplidas para esta actividad
    cursor = lastScheduledDateOnOrBefore(today, scheduledWeekday)

    // Hoy todavía puede cumplirse: si hoy toca y aún no está cumplida, no rompe la racha
    if cursor == today AND today not in completedDates:
        cursor = cursor - 7 days

    streak = 0
    while cursor >= createdOn:                      // no se evalúa antes de que existiera
        if cursor in completedDates:
            streak = streak + 1
            cursor = cursor - 7 days                // salta a la ocurrencia anterior
        else:
            break                                   // una ocurrencia pasada sin cumplir corta la racha
    return streak
```

Casos que la spec futura debe resolver: qué pasa con la racha si el usuario edita el día de la actividad, y cómo se calculan los días no cumplidos tras una edición.

## 6. Contrato del frontend

### 6.1 Componentes y responsabilidades

| Componente | Entradas | Salidas / efectos | Cubre |
|---|---|---|---|
| `App` | — | Une cuadrícula y formulario; muestra el aviso de fallo de carga | RF-1.1, 7.4 |
| `WeeklyGrid` | `activities` | 7 columnas (lunes a domingo) por 24 filas de hora de al menos 48 px cada una; contenedor con scroll; vacío si no hay datos, sin textos de ayuda | RF-1.1 a 1.5 |
| `ActivityBlock` | una `ActivityDto` | Bloque con nombre, categoría y horas, colocado según `startMinute` y `endMinute`; categoría como texto, sin color; altura mínima de 20 px para que el nombre sea legible | RF-5.1 a 5.4 |
| `TimeSelect` | valor, `onChange` | Dos listas, hora 00–23 y minutos 00–59, que impiden elegir valores inválidos | RF-3.7 |
| `ActivityForm` | `onSubmit` | Cinco campos que parten vacíos; día único por registro | RF-2.1, 2.2 |
| `SaveStatus` | estado | Icono "guardando" mientras se guarda; icono "guardado" al terminar | RF-2.5 |
| `Toast` | mensaje | Mensaje de confirmación que desaparece a los 5 segundos | RF-2.4 |

### 6.2 Estados

- **Carga (`useActivities`):** `loading` → `ready` o `failed`. En `failed` no se muestra una cuadrícula vacía como si fuera real; se muestra el aviso de error [RF-7.4].
- **Formulario (`ActivityForm`):** `idle` → `saving` → `saved` o `rejected` o `connectionError`.
  - `saved`: vaciar los cinco campos y mostrar el `Toast` 5 segundos [RF-2.4].
  - `rejected` (códigos 422 o 409): mostrar **todos** los mensajes, vaciar solo los campos listados en `fields` y pedir rellenarlos otra vez; conservar los demás [RF-3.10, RF-3.11].
  - `connectionError` (503): mostrar el mensaje de conexión y conservar **todos** los campos [RF-7.1, RF-7.3].
  - La actividad no aparece en la cuadrícula hasta que el servidor responde 201 [RF-7.2].

### 6.3 Posición en la cuadrícula [RF-1.2, RF-5.1, RF-5.2]
- `top = startMinute / 1440` y `alto = (endMinute − startMinute) / 1440`, como porcentaje de la altura total de la cuadrícula. La altura total es de 1152 px como mínimo (48 px por hora), así que normalmente supera la pantalla y hay scroll [RF-5.4].
- Cada bloque mide al menos 20 px. Si un bloque de altura mínima tocaría el siguiente del mismo día, el siguiente se desplaza hacia abajo lo necesario para no superponerse [RF-5.2].
- Como el servidor impide solapamientos, el orden visual de los bloques de un mismo día es el cronológico.

### 6.4 Sincronización entre pestañas [RF-8.1]
- Al abrir la página, el cliente se suscribe a `GET /api/events`.
- Al recibir `activity-created`, incorpora la actividad a la lista **solo si su `id` no está ya** (la pestaña que registró recibe su propia respuesta y también el evento).
- Si la conexión de eventos se corta y se restablece, el cliente vuelve a pedir `GET /api/activities` para recuperar lo que se perdió.

### 6.5 Textos [RNF-3, principio 6]
`messages/es.js` es el único archivo con texto visible. Contiene: nombres de los días, etiquetas del formulario, mensaje de confirmación, mensaje de conexión `"No se pudo guardar por fallas de conexión"` [RF-7.1], mensaje de carga `"Cargando tus actividades"` y mensaje de fallo de carga `"Ocurrió un fallo del sistema al cargar tus actividades, intenta de nuevo en 1 minuto."` [RF-7.4], y una traducción por cada código de error de la sección 4. Los mensajes de solapamiento reciben la lista `conflicts` para nombrar todas las actividades con las que chocan [RF-4.1].

## 7. Contrato de la base de datos

| Aspecto | Definición | Cubre |
|---|---|---|
| Base y colección | Una base con la colección `activities` (sección 2) | RF-6.1 |
| Acceso | Solo `activityRepository` importa el driver de MongoDB | principio 5 |
| Operaciones | `findAll` (ordenado por día y `startMinute`), `findByDay(day)`, `insert(activity)` | RF-6.1, RF-4.1 |
| Errores | Los fallos de red o de selección de servidor se traducen a `DatabaseUnavailableError`; el resto sube como error inesperado | RF-7.1 |
| Lectura estricta | Al leer, cada documento se valida contra las reglas de `core`; si alguno falla, se aborta toda la lectura con `DATA_CORRUPT`. Como solo se guardan datos válidos, esto ocurre únicamente si la base se altera desde fuera de la aplicación | RF-7.4 |
| Sin dueño | Los documentos no llevan usuario: cualquiera ve el mismo horario | RF-6.3 |
| Hora y zona | Solo minutos del día, sin fechas ni zonas horarias | RNF-7 |
| Configuración | La dirección de conexión se lee de una variable de entorno, nunca del repositorio | — |

## 8. Decisiones técnicas

| # | Decisión | Por qué | Alternativa descartada |
|---|---|---|---|
| D1 | Dos carpetas independientes (`server/`, `client/`), cada una con su `package.json`. En desarrollo el cliente redirige `/api` al servidor; en producción Express sirve el cliente ya compilado. | Separa responsabilidades y evita configurar CORS (principio 1, simplicidad). | Un solo paquete con todo mezclado, o gestor de workspaces: más herramientas que un junior debe aprender. |
| D2 | Driver oficial `mongodb`, sin ODM. | La validación ya vive en `core` (principio 3); un esquema en el ODM duplicaría las reglas. Menos capas. | Mongoose: añade esquemas, middleware y conceptos que repiten lo que `core` ya valida. |
| D3 | Horas guardadas como minutos desde las 00:00 (entero), con 1440 para el fin del día. | Comparar y detectar choques se reduce a comparar enteros; `00:00` como fin de día queda sin ambigüedad [RF-3.4]; no hay zonas horarias [RNF-7]. | Texto "HH:MM" (comparar y tratar `00:00` exige casos especiales) o fechas completas (arrastran zona horaria y un día que no existe en el modelo). |
| D4 | Sincronizar pestañas con Server-Sent Events. | Está incluido en navegadores y en Express sin librerías; es unidireccional, que es justo lo que se necesita; el navegador reconecta solo; funciona entre dispositivos [RF-6.3, RF-8.1]. | WebSocket (requiere librería y es bidireccional sin necesidad); consulta periódica (retraso y tráfico constante); `BroadcastChannel` (solo sincroniza pestañas del mismo navegador). |
| D5 | Serializar las escrituras con una cola dentro del proceso: leer el día, comprobar choques e insertar, de una en una. | Garantiza "gana el primero" y rechaza el doble clic como duplicado [RF-4.4, RF-4.5] sin infraestructura extra. Limitación documentada: asume una sola instancia del servidor. | Transacciones de MongoDB (exigen un clúster con réplicas, difícil de montar en un proyecto educativo) o índice único (no puede expresar solapamiento de intervalos). |
| D6 | El servidor devuelve códigos de error y el cliente los traduce en `messages/es.js`. | Cumple el principio 6: todo el texto visible en un solo archivo y el código en inglés. | Mensajes en español armados en el servidor: textos repartidos en dos proyectos. |
| D7 | Horas con dos listas (hora 00–23, minutos 00–59). | Hace imposible escribir una hora inválida [RF-3.7] y fija formato de 24 horas sin depender de la configuración del equipo. | `input` de tipo hora: el formato 12 h o 24 h depende del sistema operativo y permite estados a medio escribir. |
| D8 | Las reglas de negocio se validan solo en el servidor (`core`); el cliente solo evita valores imposibles (listas de horas) y muestra lo que el servidor responde. | Una única fuente de verdad (principio 3) y se valida siempre al guardar [RF-3.9]. | Duplicar reglas en el cliente para feedback inmediato: dos copias que divergen; compartir `core` con el cliente exigiría empaquetado extra. |
| D9 | Días como claves en inglés (`monday` … `sunday`) en API y base de datos. | Identificadores en inglés (principio 6); no dependen del idioma de la interfaz. | Números 0–6 (ambiguos sobre qué día es el 0) o nombres en español (rompen el principio 6). |
| D10 | Vite para compilar y servir el cliente en desarrollo. | Arranque simple y estándar actual para React. | Create React App (descontinuado) o configurar webpack a mano (complejidad innecesaria). |
| D11 | Node 20 o superior, con ejecutor de tests y carga de variables de entorno nativos. | Evita librerías de tests y de configuración (principios 1 y 4). | Jest o dotenv: dependencias que la constitución permite solo si se justifican y aquí no hacen falta. |
| D12 | Rechazo de texto que intenta vulnerar la seguridad: los caracteres `< > { } $ ; ' "`, el acento grave y las secuencias `--`, `/*` y `*/` (lista en RF-3.8). Además, las consultas a MongoDB se construyen solo con valores y React muestra el texto como texto [RNF-9]. | Solo se rechaza lo que la spec define como inseguro; emojis y demás caracteres se aceptan. La protección está en la capa de datos y de salida, no solo en la lista. | Lista blanca de caracteres: rechazaría emojis y símbolos que la spec acepta. Confiar solo en filtrar caracteres: siempre incompleto. |

**Dependencias totales** (principio 1: toda dependencia adicional justificada):

| Paquete | Dónde | Justificación |
|---|---|---|
| `express` | server | Definido por la constitución. |
| `mongodb` | server | Driver oficial para MongoDB (D2). |
| `react`, `react-dom` | client | Definido por la constitución. |
| `vite`, `@vitejs/plugin-react` | client (desarrollo) | Compilación y servidor de desarrollo (D10). |

## 9. Estrategia de tests

### 9.1 Reglas (principio 4)
- Todo archivo de `server/src/core/` tiene su archivo de tests, con `node --test` y sin librerías.
- Cada función de `core` lleva el comentario `// 001/RF-x` del requisito que cumple (principio 2), y el nombre del test incluye el mismo identificador.
- No se integra código con tests en rojo. Todo bug corregido añade primero un test que lo reproduce.

### 9.2 Tests automáticos de `core`

| Archivo | Casos mínimos | RF |
|---|---|---|
| `timeUtils.test` | "18:00" → 1080; "00:00" como fin → 1440; "23:59" → 1439; "25:00" y "12:60" inválidos; formato inverso 1440 → "00:00" | RF-3.4, 3.7 |
| `normalizeText.test` | espacios al inicio y al final; espacios repetidos entre palabras; solo espacios → vacío; tildes y ñ intactas | RF-3.1, 3.2 |
| `validateActivity.test` | caso válido; nombre vacío; categoría vacía; falta día, inicio o fin; fin igual al inicio; fin anterior al inicio; 23:00–01:00 rechazada; 23:59–00:00 aceptada; 00:00–23:59 aceptada; 00:00–00:00 aceptada como día completo; nombre de 30 y de 31 caracteres; nombre que llega a 30 solo tras normalizar; texto con `<` o `'` rechazado, emoji aceptado; varios errores a la vez devuelven todos; cada error trae sus `fields`; actividad de 1 minuto aceptada | RF-3.1 a 3.10, 5.4 |
| `findConflicts.test` | solapamiento parcial; contenida; que contiene; contigua (sin choque); distinto día no choca; choca con dos actividades y devuelve ambas; idéntica marca duplicado; mismo nombre en franja distinta no es duplicado | RF-4.1 a 4.4 |

### 9.3 Tests recomendados del servicio (opcionales, fuera de la política obligatoria)
`activityService` se prueba con `node --test` usando un repositorio falso en memoria, sin base de datos real: orden campos → choques → guardado; dos registros simultáneos que chocan (gana el primero); doble envío (el segundo es duplicado); fallo de conexión simulado devuelve `DB_UNAVAILABLE` y no guarda. Cubren RF-4.5, RF-4.4, RF-7.1 y RF-7.2.

### 9.4 Verificación manual de lo que está fuera de `core`
La constitución solo exige tests en `core`; el resto se comprueba a mano antes de cerrar la spec (criterio de finalización 3), con esta lista:

| Comprobación manual | RF |
|---|---|
| Abrir la pantalla: 7 días de lunes a domingo, cuadrícula vacía y con scroll, sin fechas | RF-1.1 a 1.5 |
| Formulario: cinco campos vacíos al abrir; no se puede elegir hora 25 ni minuto 70 | RF-2.1, 3.7 |
| Registrar una actividad válida: aparece en su día y hora, formulario vacío, mensaje que se va a los 5 s, iconos guardando y guardado | RF-2.3 a 2.5, 5.1 |
| Enviar con varios errores: se ven todos y solo se vacían los campos fallidos | RF-3.10, 3.11 |
| Registrar una actividad que choca con dos: el mensaje nombra ambas | RF-4.1 |
| Doble clic rápido: queda una sola; la segunda se informa como duplicado y solapamiento | RF-4.4 |
| Dos navegadores registrando choques a la vez: queda la primera | RF-4.5 |
| Cerrar y volver a abrir el navegador, y abrir desde otro equipo: mismo horario | RF-6.1 a 6.3 |
| Apagar MongoDB y registrar: mensaje exacto, campos conservados, no aparece en el horario | RF-7.1 a 7.3 |
| Apagar MongoDB y recargar: aviso de error, no una cuadrícula vacía | RF-7.4 |
| Dos pestañas abiertas: registrar en una y verla aparecer en la otra sin recargar | RF-8.1 |
| Actividad de 1 minuto: su nombre se lee y la cuadrícula mide al menos 1152 px | RF-5.4 |
| Enviar datos al servidor sin pasar por el formulario (herramienta externa) con valores inválidos: se rechazan | RF-3.9 |

## 10. Cobertura de requisitos

| RF | Dónde se cubre |
|---|---|
| RF-1.1 a 1.5 | `WeeklyGrid`, `messages/es.js`, `GET /api/activities`, 6.3 |
| RF-2.1, 2.2 | `ActivityForm`, `TimeSelect`, modelo (campo `day` único) |
| RF-2.3 | `POST /api/activities`, `activityService`, `activityRepository` |
| RF-2.4, 2.5 | `ActivityForm` (estados), `Toast`, `SaveStatus` |
| RF-3.1 | `core/normalizeText` |
| RF-3.2, 3.3, 3.5, 3.6, 3.8 | `core/validateActivity` (3.8 con la lista de D12) |
| RF-3.4 | `core/timeUtils`, campo `endMinute` = 1440 |
| RF-3.7 | `TimeSelect` y código `TIME_INVALID` en el servidor |
| RF-3.9 | `activityService` valida siempre antes de guardar |
| RF-3.10, 3.11 | `details[].fields` del 422 y manejo de `rejected` en el formulario |
| RF-4.1 a 4.4 | `core/findConflicts`, respuesta 409 |
| RF-4.5 | Cola de escritura de `activityService` (D5) |
| RF-5.1 a 5.4 | `ActivityBlock`, `WeeklyGrid`, 6.3 |
| RF-6.1 a 6.3 | Colección `activities` sin dueño ni semana, `GET /api/activities` |
| RF-7.1 a 7.3 | `DatabaseUnavailableError`, respuesta 503, estado `connectionError` |
| RF-7.4 | Estado `failed` de `useActivities`, lectura estricta, `DATA_CORRUPT` |
| RF-8.1 | `GET /api/events`, `eventHub`, 6.4 |

| RNF | Dónde se cubre |
|---|---|
| RNF-1 | Formulario de cinco campos, cuadrícula vacía sin pasos extra |
| RNF-2 | Respuesta directa del servidor; un solo `POST` por registro |
| RNF-3 | `messages/es.js` |
| RNF-4 | Estructura de la sección 1, pocas dependencias, `core` pequeño y probado |
| RNF-5 | Página web de escritorio, sin adaptación a móvil |
| RNF-6 | La respuesta 201 solo se envía tras guardar en MongoDB |
| RNF-7 | Minutos del día sin zona horaria (D3) |
| RNF-8 | Sin requisitos específicos en 001 |
| RNF-9 | Consultas parametrizadas y rechazo de claves `$` en `activityRepository` y validación; texto mostrado por React (D12) |

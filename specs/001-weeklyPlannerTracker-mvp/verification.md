# Verificación 001: Weekly Planner Tracker (MVP)

Resultado de las tareas T-40 a T-43 de [tasks.md](tasks.md): la verificación manual de la sección 9.4 del [plan](plan.md) y la revisión final contra la [constitución](../../docs/constitution.md).

## Cómo se hizo

- **Aplicación:** el cliente compilado (`npm run build`) servido por Express, sin el servidor de desarrollo de Vite, contra un MongoDB local.
- **Base de datos:** una base temporal (`planner_e2e_tmp`), que se borró al terminar. No se usó `weekly_planner`.
- **Navegador:** Microsoft Edge (Chromium) real, controlado por un script con el protocolo de herramientas de desarrollo (clics, escritura, lectura de la pantalla y de los tamaños). El script no forma parte del repositorio.
- **Fallos:** MongoDB apagado se simuló arrancando el servidor con una dirección de MongoDB inalcanzable; el servidor sigue respondiendo y devuelve 503.

### Límites de esta verificación

- Solo se probó en Edge. RNF-5 pide además Chrome, Firefox y Safari de escritorio; esos tres no se probaron.
- "Abrir desde otro equipo" se comprobó con un perfil de navegador nuevo y otro origen (`localhost` en vez de `127.0.0.1`), no con un segundo ordenador. Lo que demuestra es que el horario viene del servidor y no del navegador.
- Las pruebas con la red lenta y con peticiones retenidas se hicieron con las herramientas del propio navegador, no con una red real degradada.

## T-40 · Interfaz

Ventana de 1280 × 700 para que la cuadrícula (1152 px) no cupiera y hubiera scroll.

| Comprobación | RF | Resultado | Evidencia |
|---|---|---|---|
| Los 7 días de lunes a domingo, solo con su nombre | 1.1, 1.4 | Correcto | Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo |
| Sin fechas de calendario en pantalla | 1.4 | Correcto | Ningún patrón de fecha en el texto de la cuadrícula |
| Calendario vacío, sin textos de ayuda | 1.3 | Correcto | 0 bloques; los únicos textos son los días y las horas |
| Cuadrícula de 24 filas de 48 px, 1152 px en total | 1.2, 5.4 | Correcto | Cuerpo de 1152 px, fila de 48 px |
| La cuadrícula se desplaza cuando no cabe | 1.5 | Correcto | `scrollHeight` 1198 > `clientHeight` 580; el scroll se mueve de 0 a 600 |
| Los cinco campos vacíos al abrir el formulario | 2.1 | Correcto | Todos vacíos |
| No se puede elegir hora 25 ni minuto 70 | 3.7 | Correcto | Las listas ofrecen 00–23 y 00–59; al intentar fijar 25 y 70 siguen sin selección |
| Registro válido: icono "guardando" mientras se guarda | 2.5 | Correcto | Icono visible durante el guardado |
| La actividad no aparece antes de que el servidor responda 201 | 2.3, 7.2 | Correcto | Con la petición retenida en el navegador 1,5 s: mismos bloques, icono "guardando", campos aún llenos; al soltarla aparece el bloque |
| Icono "guardado" distinto al terminar | 2.5 | Correcto | Icono `saved` visible |
| El formulario se vacía al guardar | 2.4 | Correcto | Los cinco campos vacíos |
| La actividad aparece en su día y hora, con nombre, categoría y horas | 2.3, 5.1 | Correcto | Lunes, arriba 864 px (esperado 864), alto 96 px (esperado 96), "Estudiar / Estudio / 18:00–20:00" |
| El mensaje de confirmación desaparece a los 5 s | 2.4 | Correcto | Visible unos 5,04 s |
| Varios errores a la vez: se ven todos | 3.10 | Correcto | 3 mensajes juntos (nombre vacío, texto no permitido en categoría, fin no posterior al inicio) |
| Solo se vacían los campos que fallaron | 3.11 | Correcto | Vaciados nombre, categoría y hora de fin; día y hora de inicio se conservan |
| Actividad de 1 minuto: el nombre se lee | 5.4 | Correcto | Bloque de 20 px, nombre de 38 × 16 px, cuadrícula de 1152 px |

**Hallazgo:** con la sincronización de pestañas (T-38) la actividad puede aparecer en la pestaña que registra un instante antes de que le llegue la respuesta 201, porque el evento del servidor y la respuesta salen a la vez. No contradice RF-7.2: el evento se emite solo después de guardar en MongoDB, así que nunca se muestra algo que no esté guardado. La comprobación se hizo reteniendo la petición en el navegador, que es lo que prueba que la pantalla no se adelanta.

## T-41 · Choques, concurrencia y persistencia

| Comprobación | RF | Resultado | Evidencia |
|---|---|---|---|
| Un choque con dos actividades nombra ambas | 4.1 | Correcto | "El horario choca con otras actividades: "Reunión A" (10:00 a 11:00), "Reunión B" (11:30 a 12:30)." |
| La actividad rechazada no se guarda | 4.1 | Correcto | No está en la base de datos |
| Una actividad que empieza justo cuando otra termina se acepta | 4.2 | Correcto | "Contigua" guardada entre las 11:00 y las 11:30 |
| Doble clic rápido: queda una sola | 4.4 | Correcto | Dos clics en el mismo instante, una copia guardada |
| La segunda se informa como duplicado y solapamiento, pidiendo verificar | 4.4 | Correcto | "Esta actividad es un duplicado y además se solapa con "Doble" (08:00 a 09:00). Verifica en el horario semanal si ya está registrada." |
| La cuadrícula muestra la actividad una sola vez | 4.4 | Correcto | Un bloque con ese nombre |
| Dos navegadores con choque simultáneo: queda la primera | 4.5 | Correcto | Se guardó "Navegador A"; el otro navegador recibió "…choca con…"Navegador A" (10:00 a 11:00)" |
| Cerrar y volver a abrir el navegador muestra el mismo horario | 6.1, 6.3 | Correcto | Perfil nuevo: 8 actividades en pantalla, 8 en la base de datos |
| Abrir como otro cliente muestra el mismo horario, sin usuario ni sesión | 6.1, 6.3 | Correcto | Perfil nuevo y otro origen: 8 de 8 (ver los límites al inicio) |
| Las actividades no llevan usuario ni semana | 6.2 | Correcto | Campos: `id`, `name`, `category`, `day`, `start`, `end`, `startMinute`, `endMinute` |

## T-42 · Fallos y varias pestañas

Para apagar MongoDB se arrancó el servidor con una dirección inalcanzable; el servidor responde, pero sin base de datos.

| Comprobación | RF | Resultado | Evidencia |
|---|---|---|---|
| Registrar con MongoDB apagado: mensaje exacto y petición de reintentar | 7.1 | Correcto | "No se pudo guardar por fallas de conexión" e "Intenta de nuevo." |
| Los cinco campos se conservan | 7.3 | Correcto | Nombre, categoría, día, inicio y fin intactos |
| La actividad no aparece en el horario | 7.2 | Correcto | Ningún bloque con ese nombre |
| Con MongoDB otra vez encendido, reintentar desde el mismo formulario guarda la actividad | 7.3 | Correcto | Actividades en la base de datos: 9 → 10 |
| Recargar con MongoDB apagado: aviso de error, no una cuadrícula vacía | 7.4 | Correcto | "Ocurrió un fallo del sistema al cargar tus actividades, intenta de nuevo en 1 minuto." y sin cuadrícula |
| Mientras cargan, se muestra "Cargando tus actividades" | 7.4 | Correcto | Con la petición retenida en el navegador: el mensaje se ve y no hay cuadrícula |
| Un documento inválido en la base de datos hace fallar la carga, sin lista parcial | 7.4 | Correcto | Documento con fin anterior al inicio: aviso de error y sin cuadrícula; el documento se borró después |
| Registrar en una pestaña y verla aparecer en la otra sin recargar | 8.1 | Correcto | La otra pestaña la mostró a los 64 ms, sin recargar |
| La pestaña que registró la muestra una sola vez | 8.1 | Correcto | Un bloque |

### Datos enviados sin pasar por el formulario (herramienta externa)

Peticiones `curl` directas al servidor.

| Envío | RF | Resultado |
|---|---|---|
| Día inexistente (`funday`) | 3.9 | 422 `DAY_INVALID` |
| Hora `25:99` | 3.9 | 422 `TIME_INVALID` |
| Nombre con `<script>` | 3.8, 3.9 | 422 `TEXT_NOT_ALLOWED` |
| Cuerpo con una clave que empieza por `$` | RNF-9 | 400 `INVALID_BODY` |

## Casos límite de la sección 6 de la spec

Comprobados enviando peticiones directas al servidor (criterio de finalización 3). Los datos con tildes, ñ y emoji se enviaron desde un programa en Node, no desde la línea de comandos de Windows, que los altera antes de que lleguen al servidor.

| Caso | Resultado |
|---|---|
| Espacios de más en nombre y categoría | Se normalizan: `"  Leer    libro "` se guarda como `Leer libro` |
| Nombre solo con espacios | 422 `NAME_REQUIRED` |
| 31 caracteres | 422 `NAME_TOO_LONG`; 30 caracteres se aceptan |
| De 23:59 a 00:00 | 201 (fin del día, `endMinute` 1440) |
| De 00:00 a 00:00 | 201, día completo (`startMinute` 0, `endMinute` 1440) |
| De 23:00 a 01:00 (cruza la medianoche) | 422 `END_NOT_AFTER_START` |
| Hora de fin igual a la de inicio | 422 `END_NOT_AFTER_START` |
| Actividades contiguas | Se aceptan (ver T-41) |
| Mismo nombre en otro día | Se acepta |
| "Estudio" y "estudio" | Son categorías distintas: con igual nombre y horario el choque se informa como `OVERLAP`, no como duplicado |
| Actividad de 1 minuto | 201 |
| Tildes, ñ y emoji | Se aceptan y se guardan idénticos (mismos puntos de código al leerlos) |
| Varios campos ausentes | 422 con todos los `details` a la vez |
| Doble clic, choques simultáneos, pestaña con datos viejos, primer uso sin actividades, fallos de conexión, carga parcial | Ver T-40, T-41 y T-42 |
| Texto que intenta vulnerar la seguridad, datos que llegan sin pasar por el formulario | Ver T-42 |

El caso "recarga o salida con el formulario a medio llenar: el borrador se pierde" es el comportamiento por defecto de la aplicación, que no guarda borradores.

## T-43 · Revisión final contra la constitución

| Principio | Comprobación | Resultado |
|---|---|---|
| 1. Stack fijo | Dependencias del servidor: `express` y `mongodb`. Dependencias del cliente: `react` y `react-dom`, más `vite` y `@vitejs/plugin-react` solo en desarrollo. Las cuatro están en la tabla del README con su justificación | Correcto |
| 2. Spec manda | Cada función de `core`, incluidas las auxiliares, lleva `// 001/RF-x` justo encima: `overlaps`, `isIdentical`, `findConflicts`, `normalizeText`, `parseMinutes`, `endToMinutes`, `formatMinutes`, `validateTextField`, `isMissing`, `readTime`, `validateSchedule` y `validateActivity` | Correcto |
| 3. Lógica separada | Una búsqueda de `express`, `mongodb`, `document`, `window` y `localStorage` en `server/src/core/` no devuelve resultados. Las rutas solo traducen el resultado del servicio | Correcto |
| 4. Tests en `core` | Cada archivo de `core` tiene su test y cada función exportada aparece en él. `npm test` en `server/`: 114 pasan y 20 se omiten sin `MONGODB_URI`; con `node --env-file=.env --test`: 134 pasan y 0 fallan. `npm test` en `client/`: 70 pasan | Correcto |
| 5. Persistencia en MongoDB | Solo `connection.js` y `activityRepository.js` importan el driver. Se usa solo la colección `activities` (el horario). `completions` no existe: queda reservada para una spec posterior | Correcto |
| 6. Idioma | Un test del cliente comprueba que ningún componente escribe texto visible; todo está en `client/src/messages/es.js`. No hay caracteres acentuados ni palabras en español fuera de ese archivo, salvo los separadores `–` y `·` de las horas | Correcto |

## Estado

Las tareas T-01 a T-43 están completas y los criterios de finalización de la sección 8 de la spec se cumplen con estas salvedades:

- El criterio 1 (RF-1 a RF-8) y el 3 (casos límite) están comprobados en Edge; los otros tres navegadores de RNF-5 y un segundo equipo físico no se probaron (ver los límites al inicio).
- La verificación se hizo con un script que controla el navegador, no a mano frente a la pantalla.

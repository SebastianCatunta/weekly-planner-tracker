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
